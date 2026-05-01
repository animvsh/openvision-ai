# OpenVision AI - System Architecture Documentation

## 1. Executive Summary

**OpenVision AI** is a real-time computer vision platform designed for security monitoring, classroom analytics, and hackathon demonstrations. The platform processes video streams locally using MediaPipe and TensorFlow.js for low-latency detection, with optional cloud enhancement via AWS Rekognition and Bedrock.

### Core Capabilities
- **Live Face Detection** with bounding boxes and attention scoring
- **Object Detection** (person, phone, etc.) using COCO-SSD
- **Threat Detection Alerts** with sound effects
- **AI Commentary Mode** powered by AWS Bedrock
- **Real-time WebSocket** bidirectional communication
- **Dark Mode UI** with neon cyberpunk aesthetics

### Target Use Cases
1. **Hackathon Demo** - Impressive visual CV with live webcam integration
2. **Security Monitoring** - Real-time threat detection and alerting
3. **Classroom Analytics** - Attention and engagement tracking
4. **Smart Campus** - Multi-camera distributed deployment

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI framework |
| TypeScript | 5.4 | Type safety |
| Vite | 5.2 | Build tooling |
| Tailwind CSS | 3.4 | Styling |
| Zustand | 4.5 | State management |
| React Query | 5.17 | Server state |
| React Router | 6.23 | Navigation |

### Computer Vision
| Technology | Purpose |
|------------|---------|
| MediaPipe Face Mesh | Real-time face detection with 468 keypoints |
| TensorFlow.js COCO-SSD | Object detection (person, phone, etc.) |
| TensorFlow.js Pose Detection | Human pose estimation |
| AWS Rekognition | Advanced cloud-based CV analysis |
| AWS Bedrock | AI commentary and summarization |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express | REST API |
| WebSocket (ws) | Real-time communication |
| JWT (jsonwebtoken) | Authentication |
| AWS SDK | DynamoDB, SNS, SQS, Rekognition, Bedrock |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| AWS DynamoDB | Serverless database |
| AWS SNS/SQS | Event messaging |
| Docker | Containerization |
| Nginx | Reverse proxy + static hosting |

---

## 3. Architecture Decisions

### Why Local CV Processing (MediaPipe + TensorFlow.js)?

**Decision**: Process video frames locally on the client for real-time detection before sending to cloud.

**Rationale**:
1. **Low Latency** - Local processing avoids network round-trip delays
2. **Cost Reduction** - AWS Rekognition charges per API call; local processing is free
3. **Privacy** - Video frames don't leave the device for basic detection
4. **Offline Capability** - Core CV works without internet connection
5. **Scalability** - Client-side processing scales infinitely at no cost

**Trade-off**: More powerful CV models (custom training, detailed analysis) still require cloud processing.

### Why DynamoDB?

**Decision**: Use DynamoDB for event and camera metadata storage.

**Rationale**:
1. **Serverless** - No servers to manage or scale
2. **Low Latency** - Single-digit millisecond reads for real-time dashboards
3. **Pay Per Request** - Cost-efficient for variable workloads
4. **Automatic Scaling** - Handles spikes without intervention

**Trade-off**: Complex queries (joins, aggregations) require additional services (Elasticsearch, Athena).

### Why WebSocket for Real-time Updates?

**Decision**: Use WebSocket instead of Server-Sent Events (SSE) or polling.

**Rationale**:
1. **Bidirectional** - Both client and server can send messages
2. **Lower Latency** - Persistent connection, no connection overhead
3. **Efficient** - Small frames without HTTP overhead
4. **Server Push** - Natural fit for live camera updates

**Trade-off**: More complex infrastructure (sticky sessions, WebSocket gateway).

### Why JWT for Authentication?

**Decision**: Use JWT with short-lived access tokens and refresh tokens.

**Rationale**:
1. **Stateless** - No server-side session storage needed
2. **Industry Standard** - Widely understood, tested, and supported
3. **Portable** - Works across multiple services and domains
4. **Short-Lived** - Compromised tokens expire quickly

**Trade-off**: Token revocation requires additional infrastructure (blocklist, shorter expiry).

### Why Docker + Nginx?

**Decision**: Containerize both backend and frontend with nginx for serving.

**Rationale**:
1. **Consistency** - Same environment dev/prod/parity
2. **Isolation** - Dependencies don't conflict
3. **Nginx Benefits** - Static file serving, GZIP, caching, SSL termination
4. **Easy Deployment** - ECS, App Runner, Lambda all support containers

---

## 4. Security Considerations

### Input Validation
- All API inputs validated using Zod schema validation
- Pagination bounds enforced to prevent DoS (max 100 items per page)
- WebSocket message size limits (1MB max per message)

### Connection Security
- WebSocket connection limits (100 concurrent max)
- JWT token expiration (15 minute access tokens)
- CORS configured for specific origins only

### Secret Management
- All secrets via environment variables
- `.env.example` committed with placeholder values
- AWS credentials use IAM roles, not long-lived keys

### CV Security
- Face data never persisted to cloud
- Object detection runs client-side only
- Optional cloud enhancement requires explicit user consent

---

## 5. Project Structure

```
openvision-ai/
├── apps/
│   ├── backend/                 # Express + WebSocket API
│   │   ├── src/
│   │   │   ├── aws/            # AWS SDK configuration
│   │   │   ├── routes/         # API endpoints
│   │   │   ├── services/       # Business logic
│   │   │   ├── middleware/     # Auth, validation
│   │   │   └── index.ts        # Entry point
│   │   └── Dockerfile
│   │
│   └── dashboard/              # React frontend
│       ├── src/
│       │   ├── components/      # UI components
│       │   │   ├── ui/         # Base components
│       │   │   └── cv/         # CV-specific components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── pages/          # Route pages
│       │   ├── stores/         # Zustand stores
│       │   └── data/           # Mock data
│       ├── Dockerfile
│       └── nginx.conf
│
├── packages/
│   ├── plugin-sdk/             # Plugin loader system
│   └── shared-types/           # Shared TypeScript types
│
├── services/
│   └── ai-summary/             # AWS Bedrock integration
│
├── infra/
│   └── terraform/              # AWS infrastructure as code
│
├── docker-compose.yml          # Local development
└── README.md
```

---

## 6. API Reference

### Authentication
| Endpoint | Method | Description |
|---------|--------|-------------|
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/register` | POST | Create new account |
| `/api/auth/refresh` | POST | Refresh access token |

### Cameras
| Endpoint | Method | Description |
|---------|--------|-------------|
| `/api/cameras` | GET | List all cameras |
| `/api/cameras/:id` | GET | Get camera details |
| `/api/cameras` | POST | Register new camera |

### Events
| Endpoint | Method | Description |
|---------|--------|-------------|
| `/api/events` | GET | List events (paginated) |
| `/api/events/:id` | GET | Get event details |
| `/api/events/stats` | GET | Event statistics |

### WebSocket
| Message Type | Direction | Description |
|-------------|-----------|-------------|
| `camera_update` | Server→Client | Camera status change |
| `new_event` | Server→Client | New event detected |
| `detection_result` | Client→Server | CV detection result |
| `alert_triggered` | Server→Client | Threat alert |

---

## 7. Deployment Architecture

### Docker Compose (Local Development)
```
backend:3001 → Express API
dashboard:80 → Nginx → React build
```

### AWS Deployment Options

#### Option 1: App Runner + Amplify (Recommended for Permissions)
- **Backend**: AWS App Runner (containerized Express)
- **Frontend**: AWS Amplify (CI/CD from GitHub)
- **Database**: DynamoDB (existing tables)

#### Option 2: ECS Fargate
- **Backend**: ECS Task with Fargate
- **Frontend**: S3 + CloudFront
- **Database**: DynamoDB

#### Option 3: Elastic Beanstalk (if permitted)
- **Backend**: EB environment with Node.js
- **Frontend**: EB environment with static assets

### Environment Variables
```bash
# Backend
JWT_SECRET=your-secret-key
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
DYNAMODB_TABLE_CAMERAS=openvision-cameras
DYNAMODB_TABLE_EVENTS=openvision-events
DYNAMODB_TABLE_ALERTS=openvision-alerts

# Frontend
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:8080
```

---

## 8. Future Improvements

### Short-term (Hackathon Demo)
- [ ] WebRTC for better video streaming
- [ ] More CV model options (YOLO, EfficientDet)
- [ ] Sound effects for alerts
- [ ] Video recording and playback

### Medium-term (MVP)
- [ ] TURN/STUN for NAT traversal
- [ ] Multi-region DynamoDB deployment
- [ ] Custom CV model training pipeline
- [ ] Real-time collaboration features

### Long-term (Production)
- [ ] Custom trained models for specific use cases
- [ ] Edge deployment (Raspberry Pi, NVIDIA Jetson)
- [ ] Multi-tenancy with organization isolation
- [ ] Advanced analytics and reporting

---

## 9. Troubleshooting

### CV Not Working
1. Check browser permissions for camera access
2. Verify MediaPipe/TensorFlow.js loaded correctly
3. Check console for WebGL errors
4. Try different browser (Chrome recommended)

### WebSocket Disconnects
1. Check backend is running on correct port
2. Verify CORS configuration
3. Check connection limits (100 max)
4. Network/firewall issues?

### AWS Permissions
1. Verify IAM user has required policies
2. Check AWS credentials in environment
3. Verify DynamoDB table names match
4. Region configuration correct?
