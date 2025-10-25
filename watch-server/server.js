// server.js — Watch Together relay con stato stanza
import http from "http";
import crypto from "crypto";
import { WebSocketServer } from "ws";
import url from "url";

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("VichiFlix WS OK");
});

const wss = new WebSocketServer({ noServer: true });

/** rooms: { [roomId]: { clients:Set<ws>, state:{seriesId, ep, t, playing, ts} } } */
const rooms = Object.create(null);

function getOrCreateRoom(id) {
  if (!rooms[id]) rooms[id] = { clients: new Set(), state: null };
  return rooms[id];
}

function send(ws, obj) {
  try { ws.readyState === ws.OPEN && ws.send(JSON.stringify(obj)); } catch {}
}

function broadcast(roomId, obj, except) {
  const r = rooms[roomId];
  if (!r) return;
  const payload = JSON.stringify(obj);
  for (const client of r.clients) {
    if (client !== except && client.readyState === client.OPEN) {
      client.send(payload);
    }
  }
}

wss.on("connection", (ws, request, client) => {
  const { query } = url.parse(request.url, true);
  const roomParam = String(query.room || "").replace(/[^A-Za-z0-9\-]/g, "");
  const roomId = roomParam.toUpperCase();
  if (!roomId) {
    send(ws, { type: "error", message: "room mancante" });
    ws.close(1008, "room required");
    return;
  }

  ws.id = crypto.randomUUID();
  ws.roomId = roomId;

  const room = getOrCreateRoom(roomId);
  room.clients.add(ws);

  // Annuncia join
  broadcast(roomId, { type: "presence", action: "join", id: ws.id }, ws);

  // Se la stanza ha uno stato, invialo subito al nuovo
  if (room.state) {
    send(ws, { type: "state", ...room.state });
  }

  ws.on("message", (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }
    if (!msg || typeof msg !== "object") return;

    switch (msg.type) {
      case "ping":
        send(ws, { type: "pong", t: msg.t || Date.now() });
        break;

      case "source": {
        // Aggiorna lo stato stanza
        const { seriesId, ep } = msg;
        if (!seriesId || !ep) return;
        const newState = room.state || { seriesId, ep, t: 0, playing: false, ts: Date.now() };
        newState.seriesId = seriesId;
        newState.ep = ep;
        newState.ts = Date.now();
        room.state = newState;
        broadcast(roomId, { type: "source", seriesId, ep }, ws);
        break;
      }

      case "play": {
        if (!room.state) room.state = { seriesId: null, ep: null, t: 0, playing: true, ts: Date.now() };
        room.state.playing = true;
        room.state.ts = Date.now();
        broadcast(roomId, { type: "play" }, ws);
        break;
      }

      case "pause": {
        if (!room.state) room.state = { seriesId: null, ep: null, t: 0, playing: false, ts: Date.now() };
        room.state.playing = false;
        room.state.ts = Date.now();
        broadcast(roomId, { type: "pause" }, ws);
        break;
      }

      case "seek": {
        if (!room.state) room.state = { seriesId: null, ep: null, t: 0, playing: false, ts: Date.now() };
        room.state.t = Number(msg.t) || 0;
        room.state.ts = Date.now();
        broadcast(roomId, { type: "seek", t: room.state.t }, ws);
        break;
      }

      case "time": {
        if (!room.state) room.state = { seriesId: null, ep: null, t: 0, playing: false, ts: Date.now() };
        room.state.t = Number(msg.t) || 0;
        room.state.ts = Date.now();
        // niente broadcast (rumoroso): il client invia 'time' solo per snapshot/keepalive
        break;
      }

      case "hello":
        // Rinvia lo stato corrente (se c'è)
        if (room.state) {
          send(ws, { type: "state", ...room.state });
        }
        break;
    }
  });

  ws.on("close", () => {
    const r = rooms[roomId];
    if (r) {
      r.clients.delete(ws);
      broadcast(roomId, { type: "presence", action: "leave", id: ws.id }, ws);
      if (r.clients.size === 0) {
        // opzionale: dopo 2 minuti stanza senza client → cleanup
        setTimeout(() => {
          if (rooms[roomId] && rooms[roomId].clients.size === 0) delete rooms[roomId];
        }, 120000);
      }
    }
  });
});

// Upgrade HTTP -> WS (Render usa lo stesso port)
server.on("upgrade", (request, socket, head) => {
  const pathname = url.parse(request.url).pathname || "/";
  if (pathname === "/ws" || pathname === "/") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("WS server on", PORT);
});