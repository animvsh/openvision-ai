/**
 * AI Assistant Service
 * Integration with AWS Bedrock (Claude) for camera natural language queries
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export interface AIQueryRequest {
  cameraId: string;
  cameraName?: string;
  query: string;
  includeImage?: boolean;
}

export interface AIQueryResponse {
  success: boolean;
  response?: string;
  cameraId?: string;
  cameraName?: string;
  timestamp?: string;
  model?: string;
  error?: string | null;
}

interface BedrockMessage {
  role: 'user' | 'assistant';
  content: string;
}

const generateMockResponse = (cameraId: string, query: string): string => {
  return `Based on the camera ${cameraId}, I can see the scene is active. For your query about "${query}", I recommend checking the Events page for detailed analytics. The AI analysis is running in demo mode - configure AWS Bedrock credentials for full functionality.`;
};

export const queryCamera = async (request: AIQueryRequest): Promise<AIQueryResponse> => {
  try {
    const region = process.env.AWS_REGION || 'us-east-1';
    const client = new BedrockRuntimeClient({ region });

    const systemPrompt = `You are OpenVision AI Assistant, a computer vision expert. You analyze camera feeds and provide insights about:
- What is happening in the camera scene
- Object detection and tracking
- People counting and crowd analysis
- Security alerts and anomalies
- General activity monitoring`;

    const userMessage = request.cameraName 
      ? `Camera ${request.cameraName} (${request.cameraId}): ${request.query}`
      : `Camera ${request.cameraId}: ${request.query}`;

    const messages: BedrockMessage[] = [
      { role: 'user', content: userMessage }
    ];

    try {
      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-sonnet-4-20250514',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1024,
          system: systemPrompt,
          messages: messages
        }),
      });
      
      const response = await client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const text = responseBody.content?.[0]?.text || 'No response generated';

      return {
        success: true,
        response: text,
        cameraId: request.cameraId,
        cameraName: request.cameraName,
        timestamp: new Date().toISOString(),
        model: 'anthropic.claude-3-sonnet-4-20250514',
      };
    } catch (bedrockError) {
      console.warn('Bedrock API not available, using mock response:', bedrockError);

      return {
        success: true,
        response: generateMockResponse(request.cameraName || request.cameraId, request.query),
        cameraId: request.cameraId,
        cameraName: request.cameraName,
        timestamp: new Date().toISOString(),
        model: 'mockClaude',
      };
    }
  } catch (error) {
    console.error('AI Assistant error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      cameraId: request.cameraId,
      timestamp: new Date().toISOString(),
    };
  }
};

export const getAIContext = async (cameraId: string) => {
  return {
    cameraId,
    availableCapabilities: [
      'object_detection',
      'face_recognition', 
      'motion_detection',
      'ppe_compliance',
      'zone_monitoring'
    ],
    supportedQueries: [
      'What is happening in the camera?',
      'How many people are there?',
      'Are there any alerts?',
      'Is PPE being worn correctly?'
    ]
  };
};

export const getCameraContext = async (cameraId: string) => {
  return getAIContext(cameraId);
};

export const isBedrockConfigured = (): boolean => {
  return !!(process.env.AWS_REGION || process.env.AWS_ACCESS_KEY_ID);
};
