# OpenVision AI

Open-source AWS-native camera intelligence platform for privacy-conscious behavioral and safety insights.

## Architecture

```
Camera → KVS/S3 → Rekognition → KDS → Lambda → RDS/S3 → Bedrock → Dashboard
                                        ↓
                                     SNS (Alerts)
```

## Features

- **Classroom Engagement Mode** - Monitor and analyze student engagement patterns
- **Exam Integrity Mode** - Ensure academic honesty during examinations
- **Security Camera Mode** - Real-time security monitoring and alerting

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: AWS Lambda (Python)
- **Database**: RDS PostgreSQL, DynamoDB
- **Storage**: S3
- **AI/ML**: AWS Rekognition, Bedrock
- **Messaging**: SNS, KDS (Kinesis Data Streams)
- **Video**: KVS (Kinesis Video Streams)

## Infrastructure

- AWS Lambda functions
- Terraform infrastructure as code
- CloudFormation templates

## Getting Started

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup instructions.

## License

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

## GitHub Actions

[![CI](https://github.com/animvsh/secureos/actions/workflows/ci.yml/badge.svg)](https://github.com/animvsh/secureos/actions/workflows/ci.yml)
