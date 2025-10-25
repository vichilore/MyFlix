import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://lorenzovichi.it",
      "https://itanime.onrender.com", // se lo usi anche come frontend
      "http://localhost:3000",
      "http://localhost:5500"
    ],
    methods: ["GET", "POST"]
  }
});

// rooms state
const rooms = {};

io.on("connection", (socket) => {
  console.log("🔌 Utente connesso", socket.id);

  socket.on("join-room", ({ roomId }) => {
    socket.join(roomId);
    console.log(`👥 Utente ${socket.id} in stanza ${roomId}`);

    if (rooms[roomId]) {
      socket.emit("sync-state", rooms[roomId]);
    }
  });

  socket.on("update-state", ({ roomId, state }) => {
    rooms[roomId] = { ...state, updatedAt: Date.now() };
    socket.to(roomId).emit("sync-state", rooms[roomId]);
  });

  socket.on("disconnect", () =>
    console.log("❌ Disconnesso", socket.id)
  );
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`✅ WatchTogether server su ${PORT}`));
