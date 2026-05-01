import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { SQSClient } from '@aws-sdk/client-sqs'
import { SNSClient } from '@aws-sdk/client-sns'
import { RekognitionClient } from '@aws-sdk/client-rekognition'
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime'

const region = process.env.AWS_REGION || 'us-east-1'

// Client configuration with timeout
const clientConfig = {
  region,
  requestTimeout: 5000,
  connectTimeout: 5000,
}

// Cache clients to avoid creating new instances on each call
let cachedDynamoDBClient: DynamoDBClient | null = null
let cachedSQSClient: SQSClient | null = null
let cachedSNSClient: SNSClient | null = null
let cachedRekognitionClient: RekognitionClient | null = null
let cachedBedrockClient: BedrockRuntimeClient | null = null
let cachedDocClient: DynamoDBDocumentClient | null = null

export const getDynamoDBClient = (): DynamoDBClient => {
  if (!cachedDynamoDBClient) {
    cachedDynamoDBClient = new DynamoDBClient(clientConfig)
  }
  return cachedDynamoDBClient
}

export const getSQSClient = (): SQSClient => {
  if (!cachedSQSClient) {
    cachedSQSClient = new SQSClient(clientConfig)
  }
  return cachedSQSClient
}

export const getSNSClient = (): SNSClient => {
  if (!cachedSNSClient) {
    cachedSNSClient = new SNSClient(clientConfig)
  }
  return cachedSNSClient
}

export const getRekognitionClient = (): RekognitionClient => {
  if (!cachedRekognitionClient) {
    cachedRekognitionClient = new RekognitionClient(clientConfig)
  }
  return cachedRekognitionClient
}

export const getBedrockClient = (): BedrockRuntimeClient => {
  if (!cachedBedrockClient) {
    cachedBedrockClient = new BedrockRuntimeClient(clientConfig)
  }
  return cachedBedrockClient
}

export const getCorsOrigins = (): string | string[] => {
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map(s => s.trim()) || ['http://localhost:5173', 'http://localhost:3000']
  return process.env.NODE_ENV === 'production' ? allowedOrigins : '*'
}

// Table name exports
export const DYNAMODB_TABLE_CAMERAS = process.env.DYNAMODB_TABLE_CAMERAS || 'openvision-cameras'
export const DYNAMODB_TABLE_EVENTS = process.env.DYNAMODB_TABLE_EVENTS || 'openvision-events'
export const DYNAMODB_TABLE_ALERTS = process.env.DYNAMODB_TABLE_ALERTS || 'openvision-alerts'
export const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || ''
export const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL || ''

export const getDocClient = (): DynamoDBDocumentClient => {
  if (!cachedDocClient) {
    cachedDocClient = DynamoDBDocumentClient.from(getDynamoDBClient(), {
      marshallOptions: { removeUndefinedValues: true }
    })
  }
  return cachedDocClient
}

export const getTableName = (table: 'cameras' | 'events' | 'alerts' | 'CAMERAS' | 'EVENTS' | 'ALERTS'): string => {
  switch (table.toUpperCase()) {
    case 'CAMERAS': return DYNAMODB_TABLE_CAMERAS
    case 'EVENTS': return DYNAMODB_TABLE_EVENTS
    case 'ALERTS': return DYNAMODB_TABLE_ALERTS
    default: return DYNAMODB_TABLE_CAMERAS
  }
}
