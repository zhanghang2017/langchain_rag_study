import { Router } from "express";
import { aiChatBodySchema } from "../common/schemas";
import { validate } from "../common/validation";
import * as fileController from "../controllers/file.controller";
import * as aiService from "../services/ai.service";

const aiRouter = Router();

aiRouter.post("/chat", async (req, res, next) => {
  try {
    // Keep AI payload validation at route boundary for predictable proxy behavior.
    const payload = validate(aiChatBodySchema, req.body || {}, "request body");
    const result = await aiService.requestChat({
      query: payload.query,
      sessionId: payload.sessionId,
      userId: payload.userId,
    });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

aiRouter.post("/ingestion/callback", fileController.ingestionCallback);

export default aiRouter;
