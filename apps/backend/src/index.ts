import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import camerasRouter from './routes/cameras';
import eventsRouter from './routes/events';
import authRouter from './routes/auth';
import analyticsRouter from './routes/analytics';

// Import WebSocket
import { initializeWebSocket, closeWebSocket } from './services/websocket';

// Import AWS config
import { getCorsOrigins } from './aws/config';

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.amazonaws.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: getCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing with size limits
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'openvision-backend'
  });
});

// API routes
app.use('/cameras', camerasRouter);
app.use('/events', eventsRouter);
app.use('/auth', authRouter);
app.use('/analytics', analyticsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    data: null
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    data: null
  });
});

// Create HTTP server and initialize WebSocket
const server = createServer(app);
initializeWebSocket(server);

// Start server
const httpServer = server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   OpenVision AI Backend Server                               ║
║   Running on http://localhost:${PORT}                          ║
║                                                              ║
║   Endpoints:                                                 ║
║   - GET  /health                                             ║
║   - GET  /cameras                                            ║
║   - GET  /cameras/:id                                        ║
║   - PUT  /cameras/:id/mode                                   ║
║   - GET  /events                                             ║
║   - GET  /events/:id                                         ║
║   - PUT  /events/:id/status                                  ║
║   - POST /auth/login                                         ║
║   - POST /auth/register                                      ║
║   - POST /auth/logout                                        ║
║   - GET  /analytics/engagement                               ║
║   - GET  /analytics/events                                    ║
║   - WS   /ws                                                  ║
║                                                              ║
║   AWS Configuration: ${process.env.AWS_ACCESS_KEY_ID ? 'Configured' : 'Using mock data'}            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  httpServer.close(() => {
    console.log('HTTP server closed');
    closeWebSocket();
    console.log('WebSocket server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;