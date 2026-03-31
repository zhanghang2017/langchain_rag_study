import { z } from "zod";

function resolveRequiredUserId(data: { userId?: string; browserFingerprintHash?: string }) {
  return data.userId ?? data.browserFingerprintHash;
}

// Shared primitives reused across multiple query/body schemas.
export const fingerprintSchema = z
  .object({
    userId: z.string().min(1).optional(),
    browserFingerprintHash: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (!resolveRequiredUserId(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["userId"], message: "Required" });
    }
  })
  .transform((data) => ({ userId: resolveRequiredUserId(data)! }));

export const uploadBodySchema = z
  .object({
    userId: z.string().min(1).optional(),
    browserFingerprintHash: z.string().min(1).optional(),
    contentHash: z.string().regex(/^[a-fA-F0-9]{64}$/).optional(),
  })
  .superRefine((data, ctx) => {
    if (!resolveRequiredUserId(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["userId"], message: "Required" });
    }
  })
  .transform((data) => ({
    userId: resolveRequiredUserId(data)!,
    contentHash: data.contentHash,
  }));

export const chunkUploadInitBodySchema = z
  .object({
    uploadId: z.string().regex(/^[a-fA-F0-9]{64}$/),
    userId: z.string().min(1).optional(),
    browserFingerprintHash: z.string().min(1).optional(),
    fileName: z.string().min(1),
    fileSizeBytes: z.coerce.number().int().positive(),
    totalChunks: z.coerce.number().int().min(1),
  })
  .superRefine((data, ctx) => {
    if (!resolveRequiredUserId(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["userId"], message: "Required" });
    }
  })
  .transform((data) => ({
    uploadId: data.uploadId,
    userId: resolveRequiredUserId(data)!,
    fileName: data.fileName,
    fileSizeBytes: data.fileSizeBytes,
    totalChunks: data.totalChunks,
  }));

export const chunkUploadBodySchema = z.object({
  uploadId: z.string().regex(/^[a-fA-F0-9]{64}$/),
  chunkIndex: z.coerce.number().int().min(0),
});

export const chunkUploadStatusQuerySchema = z.object({
  uploadId: z.string().regex(/^[a-fA-F0-9]{64}$/),
});

export const chunkUploadCompleteBodySchema = z.object({
  uploadId: z.string().regex(/^[a-fA-F0-9]{64}$/),
});

// Shared enum for knowledge-file parse lifecycle; kept aligned with ingestion task status.
const parseStatusEnum = z.enum(["queued", "running", "success", "failed", "cancelled"]);

export const filesQuerySchema = z.object({
  userId: z.string().min(1).optional(),
  browserFingerprintHash: z.string().min(1).optional(),
  parseStatus: parseStatusEnum.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})
  .superRefine((data, ctx) => {
    if (!resolveRequiredUserId(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["userId"], message: "Required" });
    }
  })
  .transform((data) => ({
    userId: resolveRequiredUserId(data)!,
    parseStatus: data.parseStatus,
    limit: data.limit,
  }));

export const taskParamsSchema = z.object({
  taskId: z.string().uuid(),
});

export const createSessionBodySchema = z
  .object({
    userId: z.string().min(1).optional(),
    browserFingerprintHash: z.string().min(1).optional(),
    title: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (!resolveRequiredUserId(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["userId"], message: "Required" });
    }
  })
  .transform((data) => ({
    userId: resolveRequiredUserId(data)!,
    title: data.title,
  }));

export const sessionsQuerySchema = z
  .object({
    userId: z.string().min(1).optional(),
    browserFingerprintHash: z.string().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  })
  .superRefine((data, ctx) => {
    if (!resolveRequiredUserId(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["userId"], message: "Required" });
    }
  })
  .transform((data) => ({
    userId: resolveRequiredUserId(data)!,
    limit: data.limit,
  }));

export const sessionParamsSchema = z.object({
  id: z.string().uuid(),
});

export const messageBodySchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export const messageListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

// Input contract for forwarding user queries to Python AI service.
export const aiChatBodySchema = z
  .object({
    query: z.string().min(1),
    sessionId: z.string().uuid().optional(),
    userId: z.string().min(1).optional(),
    browserFingerprintHash: z.string().min(1).optional(),
  })
  .transform((data) => ({
    query: data.query,
    sessionId: data.sessionId,
    userId: data.userId ?? data.browserFingerprintHash,
  }));

const taskStatusEnum = z.enum(["queued", "running", "success", "failed", "cancelled"]);

export const ingestionCallbackBodySchema = z.object({
  taskId: z.string().uuid(),
  status: taskStatusEnum,
  progress: z.number().min(0).max(100).optional(),
  errorMessage: z.string().optional(),
});
