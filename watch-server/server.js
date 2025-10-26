// server.js
import { WebSocketServer } from 'ws';
import http from 'http';

// mappa roomId -> { state, clients:Set<ws> }
const rooms = new Map();

function joinRoom(ws, roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { state: null, clients: new Set() });
  }
  const room = rooms.get(roomId);

  // rimuovi dal gruppo precedente, se serve
  if (ws._roomId && rooms.has(ws._roomId)) {
    rooms.get(ws._roomId).clients.delete(ws);
  }

  ws._roomId = roomId;
  room.clients.add(ws);

  // manda stato corrente al nuovo arrivato
  if (room.state) {
    ws.send(JSON.stringify({
      type: 'sync-state',
      state: room.state
    }));
  }
}

function broadcastState(ws, roomId, newState) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.state = newState; // salva ultimo stato della stanza

  for (const client of room.clients) {
    if (client !== ws && client.readyState === client.OPEN) {
      client.send(JSON.stringify({
        type: 'sync-state',
        state: newState
      }));
    }
  }
}

// 1. Creiamo un http.Server singolo
const server = http.createServer((req, res) => {
  // opzionale: healthcheck / debug
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WatchTogether WS up\n');
});

// 2. Agganciamo WebSocketServer allo stesso server HTTP
//    e usiamo un path dedicato /watch
const wss = new WebSocketServer({ server, path: '/watch' });

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', raw => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      console.warn('Invalid JSON:', raw.toString());
      return;
    }

    switch (msg.type) {
      case 'join-room': {
        if (typeof msg.roomId === 'string' && msg.roomId.length < 40) {
          joinRoom(ws, msg.roomId);
        }
        break;
      }

      case 'update-state': {
        if (msg.roomId && typeof msg.state === 'object') {
          broadcastState(ws, msg.roomId, msg.state);
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    if (ws._roomId && rooms.has(ws._roomId)) {
      const room = rooms.get(ws._roomId);
      room.clients.delete(ws);
      if (room.clients.size === 0) {
        rooms.delete(ws._roomId); // stanza vuota, la puliamo
      }
    }
  });
});

// heartbeat per killare connessioni zombie (Render può tenerle aperte finché "vive" il container)
setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// 3. Porta: Render ti dà PORT (default 10000). Devi ascoltare su 0.0.0.0
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log('WS server listening on', PORT);
});
