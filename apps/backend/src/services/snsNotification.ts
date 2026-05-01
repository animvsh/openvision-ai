import {
  SNSClient,
  PublishCommand,
  CreateTopicCommand,
  SubscribeCommand,
  TopicAttributes,
} from '@aws-sdk/client-sns';

export interface SnsNotificationConfig {
  region: string;
  topicArn: string;
  enabled: boolean;
}

export interface SnsAlertMessage {
  subject: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cameraId?: string;
  eventId?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
}

const DEFAULT_CONFIG: SnsNotificationConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  topicArn: process.env.SNS_TOPIC_ARN || '',
  enabled: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.SNS_TOPIC_ARN)
};

export class SnsNotificationService {
  private client: SNSClient;
  private topicArn: string;
  private enabled: boolean;

  constructor(config: SnsNotificationConfig = DEFAULT_CONFIG) {
    this.client = new SNSClient({
      region: config.region,
    });
    this.topicArn = config.topicArn;
    this.enabled = config.enabled;
  }

  async sendAlert(message: SnsAlertMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.enabled) {
      return { success: false, error: 'SNS notifications are not configured' };
    }

    try {
      const alertPayload = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        alert: {
          severity: message.severity,
          subject: message.subject,
          message: message.message,
          cameraId: message.cameraId,
          eventId: message.eventId,
          imageUrl: message.imageUrl,
          metadata: message.metadata,
        },
      };

      const command = new PublishCommand({
        TopicArn: this.topicArn,
        Subject: `[${message.severity.toUpperCase()}] OpenVision Alert: ${message.subject}`,
        Message: JSON.stringify(alertPayload),
        MessageAttributes: {
          severity: {
            DataType: 'String',
            StringValue: message.severity,
          },
          cameraId: {
            DataType: 'String',
            StringValue: message.cameraId || 'unknown',
          },
        },
      });

      const result = await this.client.send(command);
      return { success: true, messageId: result.MessageId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to publish SNS message'
      };
    }
  }

  async createTopic(topicName: string): Promise<string> {
    const command = new CreateTopicCommand({
      Name: topicName,
      Attributes: {
        DisplayName: 'OpenVision Alerts',
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: '*' },
              Action: 'sns:Publish',
              Resource: 'arn:aws:sns:*:*:*',
            },
          ],
        }),
      },
    });

    const result = await this.client.send(command);
    return result.TopicArn || '';
  }

  async subscribeEndpoint(topicArn: string, endpoint: string, protocol: string): Promise<void> {
    const command = new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: protocol,
      Endpoint: endpoint,
    });

    await this.client.send(command);
  }

  isConfigured(): boolean {
    return this.enabled && this.topicArn.length > 0;
  }
}

export const snsNotificationService = new SnsNotificationService();

export default snsNotificationService;