import { WebSocketServer } from 'ws';
import http from 'http';

const rooms = new Map();

function joinRoom(ws, roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { state: null, clients: new Set() });
  }
  const room = rooms.get(roomId);

  if (ws._roomId && rooms.has(ws._roomId)) {
    rooms.get(ws._roomId).clients.delete(ws);
  }

  ws._roomId = roomId;
  room.clients.add(ws);

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

  room.state = newState;

  for (const client of room.clients) {
    if (client !== ws && client.readyState === client.OPEN) {
      client.send(JSON.stringify({
        type: 'sync-state',
        state: newState
      }));
    }
  }
}

const server = http.createServer((req, res) => {
  try { console.log('[HTTP]', req.method, req.url); } catch {}
  if (req.url === '/health' || req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
    res.end('ok\n');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
  res.end('WatchTogether WS up\n');
});

const wss = new WebSocketServer({
  server,
  path: '/watch',
  perMessageDeflate: false
});

wss.on('connection', (ws, req) => {
  try { console.log('[WS] connection', req?.url); } catch {}
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', raw => {
    try { console.log('[WS] message', raw.toString().slice(0, 200)); } catch {}
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
    try { console.log('[WS] close'); } catch {}
    if (ws._roomId && rooms.has(ws._roomId)) {
      const room = rooms.get(ws._roomId);
      room.clients.delete(ws);
      if (room.clients.size === 0) {
        rooms.delete(ws._roomId);
      }
    }
  });
});

// heartbeat anti-zombie
setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// 🚨 QUESTA PARTE È CRITICA PER RENDER 🚨
const PORT = process.env.PORT || 3001;
server.on('listening', () => {
  const addr = server.address();
  console.log('WS server listening on', typeof addr === 'string' ? addr : `${addr.address}:${addr.port}`);
});
server.listen(PORT, '0.0.0.0');

// --- Keep-alive ping (evita cold start) ---
try {
  const PUBLIC_URL = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL || null;
  if (PUBLIC_URL) {
    const PING_EVERY_MS = 4 * 60 * 1000; // 4 minuti
    const doPing = () => {
      const base = PUBLIC_URL.replace(/\/$/, '');
      const url = base + '/watch';
      (globalThis.fetch ? fetch(url) : Promise.reject('no-fetch'))
        .then(() => console.log('[keep-alive] WS ping OK'))
        .catch(() => console.log('[keep-alive] WS ping failed'));
    };
    setInterval(doPing, PING_EVERY_MS);
    console.log('[keep-alive] enabled ->', PUBLIC_URL);
  }
} catch {}
