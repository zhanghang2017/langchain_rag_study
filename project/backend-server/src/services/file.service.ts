import { createApiError } from "../common/errors";
import { access, mkdir, open, readFile, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import * as fileRepository from "../repositories/file.repository";
import * as taskRepository from "../repositories/task.repository";
import * as userRepository from "../repositories/user.repository";
import * as aiService from "./ai.service";

const uploadDir = path.resolve(process.cwd(), "upload");
const uploadTmpDir = path.resolve(uploadDir, "tmp");
const uploadChunkRootDir = path.resolve(uploadDir, "chunks");

type ChunkUploadManifest = {
  uploadId: string;
  userId: string;
  browserFingerprintHash?: string;
  fileName: string;
  fileSizeBytes: number;
  totalChunks: number;
  receivedChunks: number[];
  createdAt: string;
};

/**
 * 计算某个上传会话对应的分片目录绝对路径。
 * @param uploadId 上传会话 ID。
 * @returns 分片目录绝对路径。
 */
function getChunkSessionDir(uploadId: string) {
  return path.resolve(uploadChunkRootDir, uploadId);
}

/**
 * 计算某个上传会话对应的清单文件路径。
 * @param uploadId 上传会话 ID。
 * @returns manifest 文件绝对路径。
 */
function getChunkManifestPath(uploadId: string) {
  return path.resolve(uploadChunkRootDir, `${uploadId}.json`);
}

/**
 * 计算某个用户对应的正式文件存储目录。
 * @param userId 用户 ID。
 * @returns 用户目录绝对路径。
 */
function getUserUploadDir(userId: string) {
  return path.resolve(uploadDir, userId);
}

/**
 * 读取分片上传清单。
 * @param uploadId 上传会话 ID。
 * @returns 分片清单对象。
 * @throws UPLOAD_SESSION_NOT_FOUND 当上传会话不存在时抛出。
 */
async function readChunkManifest(uploadId: string): Promise<ChunkUploadManifest> {
  const manifestPath = getChunkManifestPath(uploadId);
  try {
    const content = await readFile(manifestPath, "utf8");
    const parsed = JSON.parse(content) as ChunkUploadManifest;
    return {
      ...parsed,
      userId: parsed.userId ?? parsed.browserFingerprintHash ?? "",
    };
  } catch {
    throw createApiError(404, "UPLOAD_SESSION_NOT_FOUND", "Upload session not found");
  }
}

/**
 * 持久化分片上传清单到磁盘。
 * @param manifest 分片清单对象。
 * @returns 无返回值。
 */
async function writeChunkManifest(manifest: ChunkUploadManifest) {
  await mkdir(uploadChunkRootDir, { recursive: true });
  await writeFile(getChunkManifestPath(manifest.uploadId), JSON.stringify(manifest), "utf8");
}

/**
 * 处理已落盘的临时文件：计算 MD5、按用户去重、写入正式文件并创建任务。
 * @param payload 处理参数（用户 ID、临时文件路径、原始文件名、文件大小）。
 * @param payload.contentSha256 客户端预计算的 SHA-256 哈希，提供时与服务端所计算值比对以验证传输完整性。
 * @returns 上传结果（去重命中时 task 为 null，未命中时返回新建 task）。
 */
async function processUploadedTempFile(payload: {
  userId: string;
  tempFilePath: string;
  originalName: string;
  sizeBytes: number;
  contentSha256?: string;
}) {
  // 若客户端提供了 SHA-256，则在落盘后验证完整性
  if (payload.contentSha256) {
    const serverSha256 = await computeFileSha256(payload.tempFilePath);
    if (serverSha256 !== payload.contentSha256) {
      await unlink(payload.tempFilePath).catch(() => {});
      throw createApiError(422, "CONTENT_HASH_MISMATCH", "File integrity check failed: SHA-256 mismatch");
    }
  }

  const contentMd5 = await computeFileMd5(payload.tempFilePath);
  const ext = path.extname(payload.originalName || "") || ".bin";
  const storageRelativePath = path
    .join("upload", payload.userId, `${contentMd5}${ext}`)
    .replace(/\\/g, "/");
  const storageAbsolutePath = path.resolve(process.cwd(), storageRelativePath);

  const user = await userRepository.upsertUserById(payload.userId);
  const existed = await fileRepository.findByUserIdAndMd5(user.id, contentMd5);
  if (existed) {
    await unlink(payload.tempFilePath).catch(() => {
      // Ignore temp-file cleanup errors on dedupe path.
    });

    return {
      deduplicated: true,
      file: existed,
      task: null,
    };
  }

  await mkdir(getUserUploadDir(payload.userId), { recursive: true });

  try {
    await access(storageAbsolutePath);
    await unlink(payload.tempFilePath).catch(() => {
      // If target already exists, drop temp file.
    });
  } catch {
    await rename(payload.tempFilePath, storageAbsolutePath);
  }

  const result = await fileRepository.createFileAndTask({
    userId: payload.userId,
    fileName: payload.originalName,
    contentMd5,
    fileSizeBytes: payload.sizeBytes,
    storagePath: storageRelativePath,
  });

  // Fire-and-forget dispatch: upload call returns success immediately.
  void aiService.dispatchIngestionTask({
    taskId: result.task.id,
    fileId: result.file.id,
    storagePath: result.file.storagePath,
  });

  return {
    deduplicated: false,
    file: result.file,
    task: result.task,
  };
}

/**
 * 以流式方式计算文件 SHA-256，与客户端一致以支持完整性校验。
 * @param filePath 文件绝对路径。
 * @returns 小写十六进制 SHA-256 字符串。
 */
async function computeFileSha256(filePath: string) {
  return new Promise<string>((resolve, reject) => {
    const sha256 = crypto.createHash("sha256");
    const stream = createReadStream(filePath);

    stream.on("data", (chunk) => sha256.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(sha256.digest("hex")));
  });
}

/**
 * 以流式方式计算文件 MD5，避免大文件占用过多内存。
 * @param filePath 文件绝对路径。
 * @returns 小写十六进制 MD5 字符串。
 */
async function computeFileMd5(filePath: string) {
  return new Promise<string>((resolve, reject) => {
    const md5 = crypto.createHash("md5");
    const stream = createReadStream(filePath);

    stream.on("data", (chunk) => md5.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(md5.digest("hex")));
  });
}

/**
 * 基于用户 ID 幂等地解析用户身份。
 * @param userId 用户 ID。
 * @returns 最小用户标识对象，仅返回 id。
 */
export async function identifyUser(userId: string) {
  const user = await userRepository.upsertUserById(userId);
  return { id: user.id };
}

/**
 * 创建文件与任务记录，并触发异步 ingestion 模拟流程。
 * @param payload 上传参数（用户 ID 与文件二进制）。
 * @returns 上传结果。
 */
export async function uploadFile(payload: {
  userId: string;
  file: Express.Multer.File;
  contentSha256?: string;
}) {
  if (!payload.file.path) {
    throw createApiError(500, "UPLOAD_STORAGE_ERROR", "Upload file path not available");
  }

  return processUploadedTempFile({
    userId: payload.userId,
    tempFilePath: payload.file.path,
    originalName: payload.file.originalname,
    sizeBytes: payload.file.size,
    contentSha256: payload.contentSha256,
  });
}

/**
 * 初始化分片上传会话。
 * @param payload 初始化参数。
 * @returns uploadId 与已上传分片索引。
 */
export async function initChunkUpload(payload: {
  uploadId: string;
  userId: string;
  fileName: string;
  fileSizeBytes: number;
  totalChunks: number;
}) {
  const uploadId = payload.uploadId;

  try {
    const existed = await readChunkManifest(uploadId);
    if (
      existed.userId !== payload.userId ||
      existed.fileName !== payload.fileName ||
      existed.fileSizeBytes !== payload.fileSizeBytes
    ) {
      throw createApiError(409, "UPLOAD_SESSION_CONFLICT", "Upload session already exists with different file metadata");
    }

    return {
      uploadId,
      totalChunks: existed.totalChunks,
      uploadedChunks: existed.receivedChunks,
    };
  } catch (error) {
    if ((error as { code?: string })?.code && (error as { code?: string }).code !== "UPLOAD_SESSION_NOT_FOUND") {
      throw error;
    }
  }

  await mkdir(getChunkSessionDir(uploadId), { recursive: true });

  const manifest: ChunkUploadManifest = {
    uploadId,
    userId: payload.userId,
    fileName: payload.fileName,
    fileSizeBytes: payload.fileSizeBytes,
    totalChunks: payload.totalChunks,
    receivedChunks: [],
    createdAt: new Date().toISOString(),
  };

  await writeChunkManifest(manifest);
  return {
    uploadId,
    totalChunks: payload.totalChunks,
    uploadedChunks: [],
  };
}

/**
 * 写入单个分片并记录上传进度。
 * @param payload 分片上传参数。
 * @returns 当前上传进度信息。
 */
export async function uploadChunk(payload: {
  uploadId: string;
  chunkIndex: number;
  file: Express.Multer.File;
}) {
  if (!payload.file.path) {
    throw createApiError(500, "UPLOAD_STORAGE_ERROR", "Upload file path not available");
  }

  const manifest = await readChunkManifest(payload.uploadId);
  if (payload.chunkIndex >= manifest.totalChunks) {
    throw createApiError(400, "VALIDATION_ERROR", "Invalid request body", [
      { path: "chunkIndex", message: "Out of range" },
    ]);
  }

  const chunkTargetPath = path.resolve(getChunkSessionDir(payload.uploadId), `${payload.chunkIndex}.part`);
  await rename(payload.file.path, chunkTargetPath);

  const set = new Set(manifest.receivedChunks);
  set.add(payload.chunkIndex);
  manifest.receivedChunks = Array.from(set).sort((a, b) => a - b);
  await writeChunkManifest(manifest);

  return {
    uploadId: payload.uploadId,
    totalChunks: manifest.totalChunks,
    uploadedChunks: manifest.receivedChunks,
  };
}

/**
 * 查询分片上传状态，供断点续传。
 * @param uploadId 上传会话 ID。
 * @returns 上传进度信息。
 */
export async function getChunkUploadStatus(uploadId: string) {
  const manifest = await readChunkManifest(uploadId);
  return {
    uploadId,
    totalChunks: manifest.totalChunks,
    uploadedChunks: manifest.receivedChunks,
  };
}

/**
 * 合并分片并完成上传流程（去重入库+异步向量化）。
 * @param uploadId 上传会话 ID。
 * @returns 最终 file/task 结果。
 */
export async function completeChunkUpload(uploadId: string) {
  const manifest = await readChunkManifest(uploadId);
  for (let index = 0; index < manifest.totalChunks; index += 1) {
    if (!manifest.receivedChunks.includes(index)) {
      throw createApiError(400, "CHUNK_UPLOAD_INCOMPLETE", "Chunk upload incomplete", [
        { path: "uploadId", message: `Missing chunk index ${index}` },
      ]);
    }
  }

  await mkdir(uploadTmpDir, { recursive: true });
  const ext = path.extname(manifest.fileName || "") || ".bin";
  const mergedFilePath = path.resolve(uploadTmpDir, `${uploadId}_merged${ext}`);
  const handle = await open(mergedFilePath, "w");

  try {
    for (let index = 0; index < manifest.totalChunks; index += 1) {
      const chunkPath = path.resolve(getChunkSessionDir(uploadId), `${index}.part`);
      const bytes = await readFile(chunkPath);
      await handle.write(bytes);
    }
  } finally {
    await handle.close();
  }

  const mergedStat = await stat(mergedFilePath);
  const result = await processUploadedTempFile({
    userId: manifest.userId,
    tempFilePath: mergedFilePath,
    originalName: manifest.fileName,
    sizeBytes: Number(mergedStat.size),
  });

  await rm(getChunkSessionDir(uploadId), { recursive: true, force: true });
  await unlink(getChunkManifestPath(uploadId)).catch(() => {
    // Ignore manifest cleanup errors.
  });

  return result;
}

/**
 * 查询用户下的文件列表。
 * @param query 查询条件（用户 ID、解析状态、分页上限）。
 * @returns 文件列表数组。
 */
export async function getFiles(query: {
  userId: string;
  parseStatus?: "queued" | "running" | "success" | "failed" | "cancelled";
  limit: number;
}) {
  return fileRepository.listFiles(
    {
      userId: query.userId,
      parseStatus: query.parseStatus,
    },
    query.limit,
  );
}

/**
 * 查询单个 ingestion 任务。
 * @param taskId 任务 ID。
 * @returns 任务详情。
 * @throws TASK_NOT_FOUND 当任务不存在时抛出。
 */
export async function getTask(taskId: string) {
  const task = await taskRepository.findTaskById(taskId);
  if (!task) {
    throw createApiError(404, "TASK_NOT_FOUND", "Task not found");
  }
  return task;
}

/**
 * 处理 AI 服务回调并同步更新任务与文件向量化状态。
 * @param payload AI 回调参数。
 * @returns 更新后的任务和文件记录。
 * @throws TASK_NOT_FOUND 当任务不存在时抛出。
 */
export async function handleIngestionCallback(payload: {
  taskId: string;
  status: "queued" | "running" | "success" | "failed" | "cancelled";
  progress?: number;
  errorMessage?: string;
}) {
  const task = await taskRepository.findTaskById(payload.taskId);
  if (!task) {
    throw createApiError(404, "TASK_NOT_FOUND", "Task not found");
  }

  const progress = payload.progress ?? (payload.status === "success" ? 100 : task.progress);
  const updatedTask = await taskRepository.updateTaskById(payload.taskId, {
    status: payload.status,
    progress,
    errorMessage: payload.errorMessage ?? null,
  });

  const updatedFile = await fileRepository.updateFileById(task.fileId, {
    parseStatus: payload.status,
  });

  return {
    task: updatedTask,
    file: updatedFile,
  };
}
