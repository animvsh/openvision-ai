import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { WebSocketMessage, WebSocketSubscription } from '../types';

let wss: WebSocketServer | null = null;
const clients: Map<string, WebSocket> = new Map();
const subscriptions: Map<string, WebSocketSubscription> = new Map();
const HEARTBEAT_INTERVAL = 30000;
const MAX_CONNECTIONS = 100;
const MAX_MESSAGE_SIZE = 1024 * 1024;

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  clientId: string;
}

const generateClientId = (): string => `client-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;

const broadcastToTopic = (topic: string, message: WebSocketMessage): void => {
  const messageStr = JSON.stringify(message);
  subscriptions.forEach((sub, clientId) => {
    if (sub.topics.has(topic) || sub.topics.has('all')) {
      const client = clients.get(clientId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    }
  });
};

const broadcastToCamera = (cameraId: string, message: WebSocketMessage): void => {
  const messageStr = JSON.stringify(message);
  subscriptions.forEach((sub, clientId) => {
    if (sub.cameraIds && (sub.cameraIds.has(cameraId) || sub.cameraIds.has('all'))) {
      const client = clients.get(clientId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    }
  });
};

export const initializeWebSocket = (server: Server): WebSocketServer => {
  if (wss) {
    return wss;
  }

  wss = new WebSocketServer({ server, path: '/ws', maxPayload: MAX_MESSAGE_SIZE });

  const heartbeat = setInterval(() => {
    clients.forEach((ws, clientId) => {
      const extWs = ws as ExtendedWebSocket;
      if (extWs.isAlive === false) {
        clients.delete(clientId);
        subscriptions.delete(clientId);
        return ws.terminate();
      }
      extWs.isAlive = false;
      ws.ping();
    });
  }, HEARTBEAT_INTERVAL);

  wss.on('connection', (ws: WebSocket) => {
    if (clients.size >= MAX_CONNECTIONS) {
      ws.close(1010, 'Server at capacity');
      return;
    }

    const extWs = ws as ExtendedWebSocket;
    extWs.isAlive = true;
    extWs.clientId = generateClientId();

    clients.set(extWs.clientId, ws);
    subscriptions.set(extWs.clientId, {
      clientId: extWs.clientId,
      topics: new Set(['all']),
      cameraIds: new Set(['all']),
    });

    ws.on('pong', () => {
      extWs.isAlive = true;
    });

    ws.on('message', (data: Buffer) => {
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
        const sub = subscriptions.get(extWs.clientId);

        switch (message.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
            break;

          case 'subscribe': {
            const payload = message.payload as { topics?: string[]; cameraIds?: string[] };
            if (payload.topics && sub) {
              sub.topics = new Set(payload.topics);
            }
            if (payload.cameraIds && sub) {
              sub.cameraIds = new Set(payload.cameraIds);
            }
            ws.send(JSON.stringify({
              type: 'subscribed',
              payload: { topics: Array.from(sub?.topics || []), cameraIds: Array.from(sub?.cameraIds || []) },
              timestamp: new Date().toISOString()
            }));
            break;
          }

          case 'unsubscribe': {
            const payload = message.payload as { topics?: string[]; cameraIds?: string[] };
            if (payload.topics && sub) {
              payload.topics.forEach(t => sub.topics.delete(t));
            }
            if (payload.cameraIds && sub && sub.cameraIds) {
              payload.cameraIds.forEach(c => sub.cameraIds!.delete(c));
            }
            break;
          }

          case 'camera_update':
            if (message.payload && typeof message.payload === 'object' && 'cameraId' in (message.payload as Record<string, unknown>)) {
              const cameraId = (message.payload as { cameraId: string }).cameraId;
              broadcastToCamera(cameraId, message);
            }
            break;

          case 'event_alert':
            broadcastToTopic('events', message);
            break;

          default:
            broadcastToTopic('all', message);
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
      clients.delete(extWs.clientId);
      subscriptions.delete(extWs.clientId);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(extWs.clientId);
      subscriptions.delete(extWs.clientId);
    });

    ws.send(JSON.stringify({
      type: 'connected',
      payload: {
        message: 'Connected to OpenVision WebSocket',
        clientId: extWs.clientId,
      },
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

export const broadcastToTopicFunc = (topic: string, type: string, payload: unknown): void => {
  broadcastToTopic(topic, {
    type,
    payload,
    timestamp: new Date().toISOString()
  });
};

export const broadcastEventAlert = (alert: unknown): void => {
  broadcastToTopic('events', {
    type: 'event_alert',
    payload: alert,
    timestamp: new Date().toISOString()
  });
};

export const getConnectedClientsCount = (): number => {
  return clients.size;
};

export const getSubscriptionStats = (): { clients: number; topics: Map<string, number> } => {
  const topicCounts = new Map<string, number>();
  subscriptions.forEach((sub) => {
    sub.topics.forEach((topic) => {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    });
  });
  return { clients: clients.size, topics: topicCounts };
};

export const closeWebSocket = (): void => {
  if (wss) {
    wss.close();
    wss = null;
  }
  clients.clear();
  subscriptions.clear();
};