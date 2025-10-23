import http from 'http';
import { WebSocketServer } from 'ws';

const server = http.createServer((req, res) => {
  res.writeHead(200, {'content-type':'text/plain'});
  res.end('VichiFlix WS OK');
});

const wss = new WebSocketServer({ noServer: true });
const rooms = new Map(); // roomId -> Set(ws)

function broadcast(room, data, except){
  const set = rooms.get(room);
  if (!set) return;
  for (const client of set){
    if (client !== except && client.readyState === 1) client.send(data);
  }
}

wss.on('connection', (ws, request) => {
  const url = new URL(request.url, 'http://localhost');
  const room = (url.searchParams.get('room')||'').toUpperCase();
  if (!room){ ws.close(); return; }

  if (!rooms.has(room)) rooms.set(room, new Set());
  const set = rooms.get(room);
  set.add(ws);

  ws.send(JSON.stringify({ type:'WELCOME', payload:{ members:set.size } }));
  broadcast(room, JSON.stringify({ type:'MEMBERS', payload:{ ids:[...set].length } }), ws);

  ws.on('message', (buf) => {
    let msg = null;
    try { msg = JSON.parse(buf.toString()); } catch { return; }
    if (msg && msg.type)
      broadcast(room, JSON.stringify({ type: msg.type, payload: msg.payload }), ws);
  });

  ws.on('close', () => {
    const set = rooms.get(room);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) rooms.delete(room);
  });
});

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => console.log('✅ WS server in ascolto su :' + PORT));
