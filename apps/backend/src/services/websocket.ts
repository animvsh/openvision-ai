import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { WebSocketMessage } from '../types';

let wss: WebSocketServer | null = null;
const clients: Set<WebSocket> = new Set();
const HEARTBEAT_INTERVAL = 30000;
const MAX_CONNECTIONS = 100;
const MAX_MESSAGE_SIZE = 1024 * 1024; // 1MB

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
}

export const initializeWebSocket = (server: Server): WebSocketServer => {
  if (wss) {
    return wss;
  }

  wss = new WebSocketServer({ server, path: '/ws', maxPayload: MAX_MESSAGE_SIZE });

  // Heartbeat to detect dead connections
  const heartbeat = setInterval(() => {
    clients.forEach((ws) => {
      const extWs = ws as ExtendedWebSocket;
      if (extWs.isAlive === false) {
        clients.delete(ws);
        return ws.terminate();
      }
      extWs.isAlive = false;
      ws.ping();
    });
  }, HEARTBEAT_INTERVAL);

  wss.on('connection', (ws: WebSocket) => {
    // Connection limit check
    if (clients.size >= MAX_CONNECTIONS) {
      ws.close(1010, 'Server at capacity');
      return;
    }

    const extWs = ws as ExtendedWebSocket;
    extWs.isAlive = true;

    clients.add(ws);
    console.log('WebSocket client connected');

    ws.on('pong', () => {
      extWs.isAlive = true;
    });

    ws.on('message', (data: Buffer) => {
      // Message size check
      if (data.length > MAX_MESSAGE_SIZE) {
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Message too large' },
          timestamp: new Date().toISOString()
        }));
        return;
      }

      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;

        // Handle incoming messages - broadcast to all clients for now
        switch (message.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
            break;
          case 'subscribe':
            // Client wants to subscribe to specific camera/events
            ws.send(JSON.stringify({
              type: 'subscribed',
              payload: { cameraId: message.payload },
              timestamp: new Date().toISOString()
            }));
            break;
          default:
            // Broadcast other messages to all clients
            broadcast(message);
        }
      } catch {
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Invalid message format' },
          timestamp: new Date().toISOString()
        }));
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      payload: { message: 'Connected to OpenVision WebSocket' },
      timestamp: new Date().toISOString()
    }));
  });

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  console.log('WebSocket server initialized on /ws');
  return wss;
};

export const broadcast = (message: WebSocketMessage): void => {
  const messageStr = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
};

export const broadcastEvent = (event: unknown): void => {
  broadcast({
    type: 'event',
    payload: event,
    timestamp: new Date().toISOString()
  });
};

export const broadcastCameraUpdate = (camera: unknown): void => {
  broadcast({
    type: 'camera',
    payload: camera,
    timestamp: new Date().toISOString()
  });
};

export const broadcastAlert = (alert: unknown): void => {
  broadcast({
    type: 'alert',
    payload: alert,
    timestamp: new Date().toISOString()
  });
};

export const broadcastAnalytics = (analytics: unknown): void => {
  broadcast({
    type: 'analytics',
    payload: analytics,
    timestamp: new Date().toISOString()
  });
};

export const getConnectedClientsCount = (): number => {
  return clients.size;
};

export const closeWebSocket = (): void => {
  if (wss) {
    wss.close();
    wss = null;
  }
  clients.clear();
};