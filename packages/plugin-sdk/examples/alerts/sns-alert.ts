import type { AlertPlugin, Alert } from '../../src';

/**
 * SNS Alert Plugin
 * Sends alerts to AWS SNS (Simple Notification Service)
 */
export const snsAlertPlugin: AlertPlugin = {
  plugin_id: 'sns-alert',
  name: 'SNS Alert Plugin',
  version: '1.0.0',

  async send(alert: Alert): Promise<void> {
    const snsMessage = formatSNSMessage(alert);
    await publishToSNS(snsMessage);
  },
};

interface SNSMessage {
  id: string;
  severity: string;
  title: string;
  message: string;
  timestamp: string;
  source: string;
  metadata?: Record<string, unknown>;
}

function formatSNSMessage(alert: Alert): SNSMessage {
  return {
    id: alert.id,
    severity: alert.severity,
    title: alert.title,
    message: alert.message,
    timestamp: new Date(alert.timestamp).toISOString(),
    source: alert.source,
    metadata: alert.metadata,
  };
}

async function publishToSNS(message: SNSMessage): Promise<void> {
  // In production, this would use AWS SDK to publish to SNS
  // const sns = new AWS.SNS();
  // await sns.publish({
  //   TopicArn: process.env.SNS_ALERT_TOPIC_ARN,
  //   Message: JSON.stringify(message),
  //   MessageAttributes: {
  //     severity: { DataType: 'String', StringValue: message.severity },
  //   },
  // }).promise();

  // For development/testing, just log
  console.log('[SNS Alert]', JSON.stringify(message, null, 2));

  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 100));
}

// Configuration for SNS plugin
export interface SNSConfig {
  region: string;
  topicArn: string;
  subject?: string;
}

let currentConfig: SNSConfig | null = null;

export function configureSNS(config: SNSConfig): void {
  currentConfig = config;
}

export function getConfig(): SNSConfig | null {
  return currentConfig;
}

export default snsAlertPlugin;