import { requestApi } from "./httpClient";

export type UploadResult = {
  deduplicated: boolean;
  task: { id: string } | null;
};

export type ChunkSession = {
  uploadId: string;
  totalChunks: number;
  uploadedChunks: number[];
};

/**
 * 直传小文件接口。
 * @param file 原始文件。
 * @param userId 用户 ID（浏览器指纹）。
 * @param contentHash 文件 SHA-256 哈希，供服务端完整性校验。
 * @returns 上传结果。
 */
export async function uploadFileDirect(file: File, userId: string, contentHash: string): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("userId", userId);
  formData.append("contentHash", contentHash);
  formData.append("file", file);

  return requestApi<UploadResult>("/files/upload", {
    method: "POST",
    body: formData,
  });
}

/**
 * 初始化分片上传会话。
 * @param payload 初始化参数。
 * @returns 分片会话信息。
 */
export async function initChunkUpload(payload: {
  uploadId: string;
  userId: string;
  fileName: string;
  fileSizeBytes: number;
  totalChunks: number;
}): Promise<ChunkSession> {
  return requestApi<ChunkSession>("/files/upload/chunked/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * 查询分片上传会话状态。
 * @param uploadId 上传会话 ID（文件哈希）。
 * @returns 分片会话信息。
 */
export async function getChunkUploadStatus(uploadId: string): Promise<ChunkSession> {
  return requestApi<ChunkSession>(`/files/upload/chunked/status?uploadId=${encodeURIComponent(uploadId)}`);
}

/**
 * 上传单个分片。
 * @param uploadId 上传会话 ID（文件哈希）。
 * @param chunkIndex 分片序号。
 * @param blob 分片数据。
 * @returns 分片会话信息。
 */
export async function uploadChunk(uploadId: string, chunkIndex: number, blob: Blob): Promise<ChunkSession> {
  const formData = new FormData();
  formData.append("uploadId", uploadId);
  formData.append("chunkIndex", String(chunkIndex));
  formData.append("chunk", blob);

  return requestApi<ChunkSession>("/files/upload/chunked/chunk", {
    method: "POST",
    body: formData,
  });
}

/**
 * 合并分片并完成上传。
 * @param uploadId 上传会话 ID（文件哈希）。
 * @returns 上传结果。
 */
export async function completeChunkUpload(uploadId: string): Promise<UploadResult> {
  return requestApi<UploadResult>("/files/upload/chunked/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadId }),
  });
}
