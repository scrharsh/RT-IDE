import { Router } from "express";
import { Session } from "../models/Session.js";
import { getAiCompletion } from "../services/aiService.js";
import { getRedis } from "../services/cache.js";

export const sessionsRouter = Router();

sessionsRouter.get("/:roomId", async (req, res) => {
  const { roomId } = req.params;
  const redis = getRedis();

  let cachedCode;
  if (redis) {
    cachedCode = await redis.get(`session:${roomId}:code`);
  }

  let session = await Session.findOne({ roomId }).lean();
  if (!session) {
    session = await Session.create({ roomId });
    session = session.toObject();
  }

  if (cachedCode) {
    session.code = cachedCode;
  }

  res.json(session);
});

sessionsRouter.post("/:roomId/version", async (req, res) => {
  const { roomId } = req.params;
  const { code, language, savedBy } = req.body;

  if (typeof code !== "string") {
    res.status(400).json({ error: "code must be a string" });
    return;
  }

  const session = await Session.findOneAndUpdate(
    { roomId },
    {
      $set: { code, language },
      $push: {
        versions: {
          $each: [{ code, language, savedBy }],
          $slice: -50
        }
      }
    },
    { upsert: true, new: true }
  );

  res.json({ versions: session.versions.slice(-20) });
});

sessionsRouter.post("/:roomId/problem", async (req, res) => {
  const { roomId } = req.params;
  const { title = "", description = "", constraints = [], examples = [] } = req.body;

  const session = await Session.findOneAndUpdate(
    { roomId },
    {
      $set: {
        activeProblem: {
          title,
          description,
          constraints,
          examples
        }
      }
    },
    { upsert: true, new: true }
  );

  res.json({ activeProblem: session.activeProblem });
});

sessionsRouter.post("/:roomId/ai-complete", async (req, res) => {
  try {
    const { code, language = "javascript" } = req.body;
    if (typeof code !== "string") {
      res.status(400).json({ error: "code must be a string" });
      return;
    }

    const completion = await getAiCompletion({ code, language });
    res.json(completion);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});
