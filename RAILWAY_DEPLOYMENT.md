# OpenVision AI Platform - Railway Deployment Guide

## Architecture Overview

```
                                    ┌─────────────────┐
                                    │   Railway DNS   │
                                    │  (auto-assigned)│
                                    └────────┬────────┘
                                             │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        │                                   │                                   │
        ▼                                   ▼                                   ▼
┌───────────────┐                   ┌───────────────┐                   ┌───────────────┐
│   Dashboard   │                   │    Backend    │                   │   API Service │
│   (React/Nginx)│                   │  (Express/WS) │                   │  (FastAPI)    │
│   Port: 80     │                   │   Port: 3001   │                   │   Port: 8000 │
└───────┬───────┘                   └───────┬───────┘                   └───────┬───────┘
        │                                   │                                   │
        │   VITE_API_URL ───────────────────┘                                   │
        │   VITE_WS_URL ─────────────────────────────────────────────────────►  │
        │                                                                     │
        └─────────────────────────────────┼───────────────────────────────────┘
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
           ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
           │ Rules Engine  │     │  AI Summary   │     │Video Processor│
           │  Port: 3000   │     │   Port: 3000  │     │   Port: 8080  │
           │  (Python/Lambda)    │  (boto3/Bedrock)│    │  (FastAPI/OpenCV)
           └───────────────┘     └───────────────┘     └───────────────┘
```

## Service-to-Service Communication

### Internal URLs (Railway Private Networking)

| Service | Internal URL | Port |
|---------|-------------|------|
| Dashboard | `http://dashboard.railway.internal` | 80 |
| Backend | `http://backend.railway.internal` | 3001 |
| API Service | `http://api.railway.internal` | 8000 |
| Rules Engine | `http://rules-engine.railway.internal` | 3000 |
| AI Summary | `http://ai-summary.railway.internal` | 3000 |
| Video Processor | `http://video-processor.railway.internal` | 8080 |

### Communication Flow

```
Dashboard → Backend (REST API, WebSocket)
Dashboard → API Service (for enhanced analytics via REST)

Backend → Rules Engine (event processing via internal HTTP)
Backend → AI Summary (AI summaries via internal HTTP)
Backend → Video Processor (video processing jobs via internal HTTP)

API Service → PostgreSQL (DATABASE_URL)
API Service → DynamoDB (via AWS SDK)

Rules Engine → DynamoDB (via AWS SDK)
Rules Engine → SNS (notifications via AWS SDK)
Rules Engine → Bedrock (AI summaries via AWS SDK)

AI Summary → Bedrock (Claude AI via AWS SDK)

Video Processor → DynamoDB (job status via AWS SDK)
Video Processor → Kinesis (detection events via AWS SDK)
Video Processor → S3 (video storage via AWS SDK)
Video Processor → Rekognition (video analysis via AWS SDK)
```

## Environment Variables by Service

### 1. Dashboard (apps/dashboard)

```bash
# Required
VITE_API_URL=http://backend.railway.internal:3001
VITE_WS_URL=ws://backend.railway.internal:3001/ws

# Optional - AWS credentials for client-side Bedrock
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=
VITE_AWS_SECRET_ACCESS_KEY=
```

### 2. Backend (apps/backend)

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# JWT Authentication (REQUIRED - generate a secure secret)
JWT_SECRET=your-256-bit-secret-key-here

# CORS - space-separated list of allowed origins
CORS_ORIGINS=http://dashboard.railway.internal

# AWS Configuration (optional - mock data used when not configured)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

# DynamoDB Tables
DYNAMODB_TABLE_CAMERAS=openvision-cameras
DYNAMODB_TABLE_EVENTS=openvision-events
DYNAMODB_TABLE_ALERTS=openvision-alerts

# SNS for notifications (optional)
SNS_TOPIC_ARN=
SQS_QUEUE_URL=

# Telegram alerts (optional)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_IDS=

# Email alerts via SES (optional)
SES_FROM_EMAIL=alerts@openvision.ai
SES_TO_EMAILS=admin@openvision.ai
```

### 3. API Service (services/api)

```bash
# Database - PostgreSQL (via Railway PostgreSQL plugin)
DATABASE_URL=postgresql://postgres:password@db.railway.internal:5432/openvision

# Alternative individual DB vars (used if DATABASE_URL not set)
DB_HOST=db.railway.internal
DB_PORT=5432
DB_NAME=openvision
DB_USER=postgres
DB_PASSWORD=your-secure-password

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# DynamoDB
DYNAMODB_TABLE=VideoProcessingJobs
CAMERA_STATE_TABLE=CameraState
EVENTS_TABLE=Events

# Kinesis Streams
KINESIS_STREAM=DetectionEvents

# SNS Topics
SNS_TOPIC_ARN=
REKOGNITION_ROLE_ARN=

# Cognito (optional - for JWT validation)
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=

# JWT Secret for token validation (use same as backend)
JWT_SECRET=your-256-bit-secret-key-here

# WebSocket URL
WEBSOCKET_URL=ws://backend.railway.internal:3001/ws

# API Configuration
API_STAGE=production
CORS_ORIGINS=*
```

### 4. Rules Engine (services/rules-engine)

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# DynamoDB Tables
CAMERA_STATE_TABLE=CameraState
EVENTS_TABLE=Events

# SNS for notifications
SNS_TOPIC_ARN=
```

### 5. AI Summary (services/ai-summary)

```bash
# AWS Configuration for Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Anthropic API Key (for Claude via Bedrock)
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Optional - Bedrock Agent configuration
BEDROCK_AGENT_ID=
BEDROCK_AGENT_ALIAS_ID=
```

### 6. Video Processor (services/video-processor)

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# DynamoDB
DYNAMODB_TABLE=VideoProcessingJobs

# Kinesis
KINESIS_STREAM=DetectionEvents

# S3
S3_BUCKET=openvision-videos

# Server port
PORT=8080
```

## Railway PostgreSQL Setup

For the API service, add a PostgreSQL plugin in Railway dashboard:

1. Go to your API service
2. Add PostgreSQL plugin
3. Railway will auto-inject `DATABASE_URL` environment variable
4. The connection string format: `postgresql://postgres:[password]@[host]:[port]/[database]`

## AWS Credentials Setup

For services that need AWS access (Backend, Rules Engine, AI Summary, Video Processor):

1. Go to AWS IAM → Create a new user with programmatic access
2. Attach policies for required services:
   - DynamoDB (full access or specific tables)
   - SNS (for notifications)
   - Bedrock (for Claude AI)
   - Rekognition (for video analysis)
   - Kinesis (for event streaming)
   - S3 (for video storage)
3. Create access key and add to Railway environment variables

## Security Notes

### JWT Secret
Generate a secure secret for JWT operations:
```bash
openssl rand -base64 32
```

### CORS Origins
In production, set `CORS_ORIGINS` to the specific dashboard URL instead of `*`:
```
CORS_ORIGINS=http://dashboard.railway.internal
```

### Database Passwords
Use strong passwords for PostgreSQL. Railway's PostgreSQL plugin generates secure passwords automatically.

## Deployment Checklist

1. Deploy services in order:
   - [ ] PostgreSQL (via Railway plugin)
   - [ ] API Service (creates tables on startup)
   - [ ] Backend
   - [ ] Rules Engine
   - [ ] AI Summary
   - [ ] Video Processor
   - [ ] Dashboard

2. Set environment variables for each service using Railway dashboard

3. Configure domain routing if using custom domains

4. Set up AWS credentials and IAM roles before deploying AWS-integrated services

5. Verify health check endpoints:
   - `http://backend.railway.internal:3001/health`
   - `http://api.railway.internal:8000/health`
   - `http://rules-engine.railway.internal:3000/health`
   - `http://ai-summary.railway.internal:3000/health`
   - `http://video-processor.railway.internal:8080/health`