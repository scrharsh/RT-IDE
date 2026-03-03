import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { sessionsRouter } from "./routes/sessions.js";
import { Session } from "./models/Session.js";
import { initRedis, getRedis } from "./services/cache.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || "http://localhost:5173" }
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/api/sessions", sessionsRouter);

app.get("/health", (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
const MAX_ROOM_USERS = Number(process.env.MAX_ROOM_USERS || 10);
const activeUsers = new Map();

const updatePresence = (roomId) => {
  const users = activeUsers.get(roomId) || new Set();
  io.to(roomId).emit("presence", Array.from(users));
};

io.on("connection", (socket) => {
  socket.on("join_room", async ({ roomId, username }, ack) => {
    try {
      if (!roomId || !username) {
        ack?.({ ok: false, error: "roomId and username are required." });
        return;
      }

      const users = activeUsers.get(roomId) || new Set();
      if (!users.has(username) && users.size >= MAX_ROOM_USERS) {
        ack?.({ ok: false, error: `Room user limit (${MAX_ROOM_USERS}) reached.` });
        return;
      }

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.username = username;

      users.add(username);
      activeUsers.set(roomId, users);

      await Session.findOneAndUpdate(
        { roomId },
        { $addToSet: { participants: username } },
        { upsert: true }
      );

      updatePresence(roomId);
      ack?.({ ok: true });
    } catch (error) {
      ack?.({ ok: false, error: "Failed to join room." });
      socket.emit("server_error", { message: error.message });
    }
  });

  socket.on("code_change", async ({ roomId, code, language }) => {
    try {
      if (!roomId || typeof code !== "string") return;

      socket.to(roomId).emit("code_update", { code, language });

      const redis = getRedis();
      if (redis) {
        await Promise.all([
          redis.set(`session:${roomId}:code`, code, "EX", 60 * 30),
          redis.incr(`session:${roomId}:ops`)
        ]);
      }

      await Session.findOneAndUpdate(
        { roomId },
        { $set: { code, language }, $inc: { operationsCount: 1 } },
        { upsert: true }
      );
    } catch (error) {
      socket.emit("server_error", { message: error.message });
    }
  });

  socket.on("disconnect", () => {
    const { roomId, username } = socket.data;
    if (!roomId || !username) return;

    const users = activeUsers.get(roomId);
    if (!users) return;

    users.delete(username);
    if (!users.size) {
      activeUsers.delete(roomId);
      io.to(roomId).emit("presence", []);
      return;
    }

    updatePresence(roomId);
  });
});

const bootstrap = async () => {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rt-ide");
  initRedis();
  server.listen(PORT, () => {
    console.log(`RT IDE server running on :${PORT}`);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
