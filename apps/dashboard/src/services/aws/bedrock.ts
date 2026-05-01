import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime"

const client = new BedrockRuntimeClient({
  region: process.env.VITE_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY || '',
  }
})

export interface EventSummary {
  type: string
  cameraName: string
  timestamp: string
  detectionDetails?: string
}

export async function generateEventSummary(event: EventSummary): Promise<string> {
  const prompt = `You are an AI assistant for a school camera monitoring system.
Analyze this event and provide a brief, actionable summary:

Event Type: ${event.type}
Camera: ${event.cameraName}
Time: ${event.timestamp}
Details: ${event.detectionDetails || 'N/A'}

Provide a 1-2 sentence summary suitable for a teacher or security officer.`;

  const command = new InvokeModelCommand({
    modelId: "anthropic.claude-3-sonnet-4-20250514",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: prompt
      }]
    })
  });

  try {
    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.content[0].text;
  } catch (error) {
    // Graceful fallback when AWS credentials aren't configured
    console.warn('Bedrock API unavailable, using fallback summary:', error);
    return generateFallbackSummary(event);
  }
}

function generateFallbackSummary(event: EventSummary): string {
  // Generate a basic summary without AI when AWS is unavailable
  const timestamp = new Date(event.timestamp).toLocaleString();
  return `[Fallback] ${event.type} detected at ${event.cameraName} on ${timestamp}. ${event.detectionDetails || 'Review required.'}`;
}

export async function isBedrockConfigured(): Promise<boolean> {
  try {
    const hasCredentials =
      process.env.VITE_AWS_ACCESS_KEY_ID &&
      process.env.VITE_AWS_SECRET_ACCESS_KEY;

    if (!hasCredentials) return false;

    // Test with a lightweight call
    const testCommand = new InvokeModelCommand({
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hi" }]
      })
    });

    await client.send(testCommand);
    return true;
  } catch {
    return false;
  }
}