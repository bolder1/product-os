import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import * as syncProtocol from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding from 'lib0/encoding'
import * as decoding from 'lib0/decoding'

const BASE_YJS_PORT = Number(process.env.YJS_PORT) || 4000

// ---------------------------------------------------------------------------
// Message types (matching y-websocket protocol)
// ---------------------------------------------------------------------------
const messageSync = 0
const messageAwareness = 1

// ---------------------------------------------------------------------------
// In-memory document store
// ---------------------------------------------------------------------------
interface YjsRoom {
  doc: Y.Doc
  awareness: Awareness
  conns: Map<WebSocket, Set<number>> // ws -> awareness client IDs
}

const rooms = new Map<string, YjsRoom>()

function getOrCreateRoom(name: string): YjsRoom {
  if (rooms.has(name)) return rooms.get(name)!

  const doc = new Y.Doc()
  const awareness = new Awareness(doc)

  // Clean up awareness when a client disconnects
  awareness.on('update', ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
    const changedClients = [...added, ...updated, ...removed]
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, messageAwareness)
    encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients))
    const message = encoding.toUint8Array(encoder)

    const room = rooms.get(name)
    if (room) {
      for (const [conn] of room.conns) {
        if (conn.readyState === WebSocket.OPEN) {
          conn.send(message)
        }
      }
    }
  })

  const room: YjsRoom = { doc, awareness, conns: new Map() }
  rooms.set(name, room)
  return room
}

function handleMessage(room: YjsRoom, conn: WebSocket, message: Uint8Array) {
  const decoder = decoding.createDecoder(message)
  const messageType = decoding.readVarUint(decoder)

  switch (messageType) {
    case messageSync: {
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, messageSync)
      syncProtocol.readSyncMessage(decoder, encoder, room.doc, conn as unknown as object)
      if (encoding.length(encoder) > 1) {
        conn.send(encoding.toUint8Array(encoder))
      }
      break
    }
    case messageAwareness: {
      const update = decoding.readVarUint8Array(decoder)
      awarenessProtocol.applyAwarenessUpdate(room.awareness, update, conn)
      break
    }
  }
}

function setupConnection(room: YjsRoom, conn: WebSocket) {
  room.conns.set(conn, new Set())

  conn.on('message', (data: Buffer | ArrayBuffer | Buffer[]) => {
    const buf = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data as Buffer)
    handleMessage(room, conn, buf)
  })

  conn.on('close', () => {
    const controlledIds = room.conns.get(conn)
    room.conns.delete(conn)

    // Remove awareness states for this connection
    if (controlledIds) {
      awarenessProtocol.removeAwarenessStates(room.awareness, [...controlledIds], null)
    }

    // Clean up empty rooms after a delay
    if (room.conns.size === 0) {
      setTimeout(() => {
        const current = rooms.get(getRoomName(room))
        if (current && current.conns.size === 0) {
          current.doc.destroy()
          rooms.delete(getRoomName(room))
        }
      }, 30000) // keep room alive for 30s in case of reconnects
    }
  })

  // Send initial sync step 1
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, messageSync)
  syncProtocol.writeSyncStep1(encoder, room.doc)
  conn.send(encoding.toUint8Array(encoder))

  // Send current awareness state
  const awarenessStates = room.awareness.getStates()
  if (awarenessStates.size > 0) {
    const encoder2 = encoding.createEncoder()
    encoding.writeVarUint(encoder2, messageAwareness)
    encoding.writeVarUint8Array(
      encoder2,
      awarenessProtocol.encodeAwarenessUpdate(room.awareness, [...awarenessStates.keys()])
    )
    conn.send(encoding.toUint8Array(encoder2))
  }
}

function getRoomName(room: YjsRoom): string {
  for (const [name, r] of rooms) {
    if (r === room) return name
  }
  return 'unknown'
}

// ---------------------------------------------------------------------------
// HTTP + WebSocket server
// ---------------------------------------------------------------------------
const server = http.createServer((_req, res) => {
  if (_req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'ok',
      rooms: rooms.size,
      connections: [...rooms.values()].reduce((sum, r) => sum + r.conns.size, 0),
    }))
    return
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Product OS Yjs Collaboration Server')
})

const wss = new WebSocketServer({ server })

wss.on('connection', (ws, req) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const roomName = url.searchParams.get('room') ?? 'default'

  const room = getOrCreateRoom(roomName)
  setupConnection(room, ws)

  console.log(`[yjs] client connected to room "${roomName}" (${room.conns.size} peers)`)
})

function listenWithFallback(port: number, attemptsLeft: number) {
  const onError = (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      server.removeListener('error', onError)
      listenWithFallback(port + 1, attemptsLeft - 1)
      return
    }
    console.error('[yjs-server]', err)
    process.exit(1)
  }
  server.on('error', onError)
  server.listen(port, () => {
    server.removeListener('error', onError)
    console.log(`[yjs-server] listening on ws://localhost:${port}`)
    console.log(`[yjs-server] health check at http://localhost:${port}/health`)
  })
}

listenWithFallback(BASE_YJS_PORT, 10)

export { server, wss }
