import { WebSocketServer } from 'ws'
import http from 'http'

const PORT = Number(process.env.YJS_PORT) || 4000

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Product OS Yjs Collaboration Server')
})

const wss = new WebSocketServer({ server })

// Track docs by room
const rooms = new Map<string, Set<import('ws').WebSocket>>()

wss.on('connection', (ws, req) => {
  const room = new URL(req.url ?? '/', `http://localhost:${PORT}`).searchParams.get('room') ?? 'default'

  if (!rooms.has(room)) rooms.set(room, new Set())
  const peers = rooms.get(room)!
  peers.add(ws)

  // Broadcast to all peers in the same room
  ws.on('message', (data) => {
    for (const peer of peers) {
      if (peer !== ws && peer.readyState === ws.OPEN) {
        peer.send(data)
      }
    }
  })

  ws.on('close', () => {
    peers.delete(ws)
    if (peers.size === 0) rooms.delete(room)
  })
})

server.listen(PORT, () => {
  console.log(`[yjs-server] listening on ws://localhost:${PORT}`)
})

export { server, wss }
