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
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WatchTogether WS up\n');
});

const wss = new WebSocketServer({
  server,
  path: '/watch'
});

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', raw => {
    let msg;
    console.log('Received message:', raw.toString());
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
      console.log('Client disconnected from room:', ws._roomId);
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
server.listen(PORT, '0.0.0.0', () => {
  console.log('WS server listening on', PORT);
});
