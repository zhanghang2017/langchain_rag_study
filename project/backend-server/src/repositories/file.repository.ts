import { prisma } from "../lib/prisma";

/**
 * 在单个事务中创建用户、文件与任务记录。
 * @param payload 上传元数据参数。
 * @returns 包含 user、file、task 的事务结果。
 */
export async function createFileAndTask(payload: {
  userId: string;
  fileName: string;
  contentMd5: string;
  fileSizeBytes: number;
  storagePath: string;
}) {
  // Keep user-file-task creation atomic to avoid dangling tasks/files.
  return prisma.$transaction(async (tx) => {
    const user = await tx.appUser.upsert({
      where: { id: payload.userId },
      update: {},
      create: {
        id: payload.userId,
        browserFingerprintHash: payload.userId,
      },
    });

    const file = await tx.knowledgeFile.create({
      data: {
        userId: user.id,
        fileName: payload.fileName,
        contentMd5: payload.contentMd5,
        fileSizeBytes: payload.fileSizeBytes,
        storagePath: payload.storagePath,
        parseStatus: "queued",
      },
    });

    const task = await tx.ingestionTask.create({
      data: {
        userId: user.id,
        fileId: file.id,
        status: "queued",
        progress: 0,
      },
    });

    return { user, file, task };
  });
}

/**
 * 按用户与内容哈希查询文件（用于去重）。
 * @param userId 用户 ID（浏览器指纹）。
 * @param contentMd5 文件内容 MD5。
 * @returns 文件记录；不存在时返回 null。
 */
export async function findByUserIdAndMd5(userId: string, contentMd5: string) {
  return prisma.knowledgeFile.findUnique({
    where: {
      userId_contentMd5: {
        userId,
        contentMd5,
      },
    },
  });
}

/**
 * 按条件查询文件列表。
 * @param where 查询过滤条件。
 * @param limit 返回数量上限。
 * @returns 文件记录数组。
 */
export async function listFiles(
  where: { userId: string; parseStatus?: "queued" | "running" | "success" | "failed" | "cancelled" },
  limit: number,
) {
  return prisma.knowledgeFile.findMany({
    where,
    orderBy: { uploadedAt: "desc" },
    take: limit,
  });
}

/**
 * 更新单个文件的解析状态。
 * @param fileId 文件 ID。
 * @param data 更新字段（parseStatus）。
 * @returns 更新后的文件记录。
 */
export async function updateFileById(
  fileId: string,
  data: { parseStatus?: "queued" | "running" | "success" | "failed" | "cancelled" },
) {
  return prisma.knowledgeFile.update({
    where: { id: fileId },
    data,
  });
}
