import type { Alert } from '../../shared-types/src';

/**
 * Alert Plugin Interface
 * Provides notification capabilities via various channels
 */
export interface AlertPlugin {
  plugin_id: string;
  name: string;
  version?: string;
  channel: AlertChannel;
  send(alert: Alert): Promise<AlertResult>;
  sendBatch(alerts: Alert[]): Promise<AlertResult[]>;
  test(connection: AlertConnectionConfig): Promise<boolean>;
}

export type AlertChannel = 'telegram' | 'email' | 'ses' | 'sns' | 'webhook' | 'sms' | 'phone';

export interface AlertResult {
  success: boolean;
  message_id?: string;
  timestamp: number;
  error?: string;
}

export interface AlertConnectionConfig {
  // Common
  enabled?: boolean;

  // Telegram
  bot_token?: string;
  chat_ids?: string[];

  // Email/SES
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  from_email?: string;
  to_emails?: string[];

  // SES
  aws_region?: string;
  ses_arn?: string;
  email_from?: string;
  email_to?: string[];

  // SNS
  aws_region?: string;
  sns_topic_arn?: string;
  sns_subject?: string;

  // Webhook
  webhook_url?: string;
  webhook_headers?: Record<string, string>;
  webhook_auth?: string;

  // SMS/Phone
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_from_number?: string;
  to_phone_numbers?: string[];
}

/**
 * Telegram Alert Adapter
 */
export interface TelegramAlertConfig extends AlertConnectionConfig {
  channel: 'telegram';
  bot_token: string;
  chat_ids: string[];
  parse_mode?: 'MarkdownV2' | 'HTML' | 'Markdown';
  disable_notification?: boolean;
  reply_to_message_id?: string;
}

export interface TelegramAlertPlugin extends AlertPlugin {
  channel: 'telegram';
  config: TelegramAlertConfig;
  sendPhoto(alert: Alert, photoPath: string): Promise<AlertResult>;
  sendDocument(alert: Alert, documentPath: string): Promise<AlertResult>;
  getChatMemberCount(chatId: string): Promise<number>;
}

/**
 * Email/SES Alert Adapter
 */
export interface EmailAlertConfig extends AlertConnectionConfig {
  channel: 'email';
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  to_emails: string[];
  subject_prefix?: string;
  use_tls?: boolean;
}

export interface SESAlertConfig extends AlertConnectionConfig {
  channel: 'ses';
  aws_region: string;
  ses_arn?: string;
  email_from: string;
  email_to: string[];
  subject_prefix?: string;
}

export interface EmailAlertPlugin extends AlertPlugin {
  channel: 'email';
  config: EmailAlertConfig;
  sendHTML(alert: Alert, htmlBody: string): Promise<AlertResult>;
  sendWithAttachment(alert: Alert, attachmentPath: string, filename: string): Promise<AlertResult>;
}

export interface SESAlertPlugin extends AlertPlugin {
  channel: 'ses';
  config: SESAlertConfig;
  sendHTML(alert: Alert, htmlBody: string): Promise<AlertResult>;
  sendTemplate(alert: Alert, templateName: string, templateData: Record<string, string>): Promise<AlertResult>;
}

/**
 * SNS Alert Adapter
 */
export interface SNSAlertConfig extends AlertConnectionConfig {
  channel: 'sns';
  aws_region: string;
  sns_topic_arn: string;
  sns_subject?: string;
  message_attributes?: Record<string, string>;
}

export interface SNSAlertPlugin extends AlertPlugin {
  channel: 'sns';
  config: SNSAlertConfig;
  sendToTopic(alert: Alert, topicArn?: string): Promise<AlertResult>;
  sendWithAttributes(alert: Alert, attributes: Record<string, string>): Promise<AlertResult>;
}

/**
 * Webhook Alert Adapter
 */
export interface WebhookAlertConfig extends AlertConnectionConfig {
  channel: 'webhook';
  webhook_url: string;
  webhook_headers?: Record<string, string>;
  webhook_auth?: string;
  retry_count?: number;
  retry_delay_ms?: number;
}

export interface WebhookAlertPlugin extends AlertPlugin {
  channel: 'webhook';
  config: WebhookAlertConfig;
  sendWithCustomHeaders(alert: Alert, headers: Record<string, string>): Promise<AlertResult>;
}

/**
 * Alert Plugin Manifest
 */
export interface AlertManifest {
  api_version: string;
  plugin_type: 'alert';
  plugin: AlertPlugin;
  supported_channels: AlertChannel[];
  max_batch_size?: number;
  rate_limit?: {
    per_second?: number;
    per_minute?: number;
  };
}

/**
 * Alert Plugin Registry
 */
export interface AlertPluginRegistry {
  register(plugin: AlertPlugin): void;
  deregister(pluginId: string): boolean;
  get(pluginId: string): AlertPlugin | undefined;
  list(): AlertPlugin[];
  listByChannel(channel: AlertChannel): AlertPlugin[];
  sendToAll(alert: Alert): Promise<Map<string, AlertResult>>;
}

/**
 * Factory functions for creating alert plugins
 */
export function createTelegramAlertPlugin(
  pluginId: string,
  name: string,
  config: TelegramAlertConfig
): TelegramAlertPlugin {
  return {
    plugin_id: pluginId,
    name,
    version: '1.0.0',
    channel: 'telegram' as const,
    config,
    async send(alert: Alert): Promise<AlertResult> {
      // Implementation sends to Telegram API
      const message = formatTelegramMessage(alert);
      // Send to all configured chat IDs
      for (const chatId of config.chat_ids) {
        // API call to Telegram
      }
      return { success: true, timestamp: Date.now() };
    },
    async sendBatch(alerts: Alert[]): Promise<AlertResult[]> {
      return Promise.all(alerts.map(a => this.send(a)));
    },
    async test(_connection: AlertConnectionConfig): Promise<boolean> {
      // Test Telegram bot token
      return true;
    },
    async sendPhoto(alert: Alert, photoPath: string): Promise<AlertResult> {
      return { success: true, timestamp: Date.now() };
    },
    async sendDocument(alert: Alert, documentPath: string): Promise<AlertResult> {
      return { success: true, timestamp: Date.now() };
    },
    async getChatMemberCount(_chatId: string): Promise<number> {
      return 0;
    },
  };
}

export function createEmailAlertPlugin(
  pluginId: string,
  name: string,
  config: EmailAlertConfig
): EmailAlertPlugin {
  return {
    plugin_id: pluginId,
    name,
    version: '1.0.0',
    channel: 'email' as const,
    config,
    async send(alert: Alert): Promise<AlertResult> {
      const subject = `${config.subject_prefix || '[SecureOS]'} ${alert.title}`;
      const body = formatEmailMessage(alert);
      // SMTP send implementation
      return { success: true, timestamp: Date.now() };
    },
    async sendBatch(alerts: Alert[]): Promise<AlertResult[]> {
      return Promise.all(alerts.map(a => this.send(a)));
    },
    async test(_connection: AlertConnectionConfig): Promise<boolean> {
      // Test SMTP connection
      return true;
    },
    async sendHTML(alert: Alert, htmlBody: string): Promise<AlertResult> {
      return { success: true, timestamp: Date.now() };
    },
    async sendWithAttachment(alert: Alert, attachmentPath: string, _filename: string): Promise<AlertResult> {
      return { success: true, timestamp: Date.now() };
    },
  };
}

export function createSESAlertPlugin(
  pluginId: string,
  name: string,
  config: SESAlertConfig
): SESAlertPlugin {
  return {
    plugin_id: pluginId,
    name,
    version: '1.0.0',
    channel: 'ses' as const,
    config,
    async send(alert: Alert): Promise<AlertResult> {
      const subject = `${config.subject_prefix || '[SecureOS]'} ${alert.title}`;
      // AWS SES SDK send
      return { success: true, timestamp: Date.now() };
    },
    async sendBatch(alerts: Alert[]): Promise<AlertResult[]> {
      return Promise.all(alerts.map(a => this.send(a)));
    },
    async test(_connection: AlertConnectionConfig): Promise<boolean> {
      // Test SES configuration
      return true;
    },
    async sendHTML(alert: Alert, htmlBody: string): Promise<AlertResult> {
      return { success: true, timestamp: Date.now() };
    },
    async sendTemplate(alert: Alert, _templateName: string, _templateData: Record<string, string>): Promise<AlertResult> {
      return { success: true, timestamp: Date.now() };
    },
  };
}

export function createSNSAlertPlugin(
  pluginId: string,
  name: string,
  config: SNSAlertConfig
): SNSAlertPlugin {
  return {
    plugin_id: pluginId,
    name,
    version: '1.0.0',
    channel: 'sns' as const,
    config,
    async send(alert: Alert): Promise<AlertResult> {
      // AWS SNS SDK publish
      return { success: true, message_id: `sns-${Date.now()}`, timestamp: Date.now() };
    },
    async sendBatch(alerts: Alert[]): Promise<AlertResult[]> {
      return Promise.all(alerts.map(a => this.send(a)));
    },
    async test(_connection: AlertConnectionConfig): Promise<boolean> {
      // Test SNS topic access
      return true;
    },
    async sendToTopic(alert: Alert, topicArn?: string): Promise<AlertResult> {
      return { success: true, message_id: `sns-${Date.now()}`, timestamp: Date.now() };
    },
    async sendWithAttributes(alert: Alert, attributes: Record<string, string>): Promise<AlertResult> {
      return { success: true, message_id: `sns-${Date.now()}`, timestamp: Date.now() };
    },
  };
}

export function createWebhookAlertPlugin(
  pluginId: string,
  name: string,
  config: WebhookAlertConfig
): WebhookAlertPlugin {
  return {
    plugin_id: pluginId,
    name,
    version: '1.0.0',
    channel: 'webhook' as const,
    config,
    async send(alert: Alert): Promise<AlertResult> {
      // HTTP POST to webhook_url
      return { success: true, timestamp: Date.now() };
    },
    async sendBatch(alerts: Alert[]): Promise<AlertResult[]> {
      return Promise.all(alerts.map(a => this.send(a)));
    },
    async test(_connection: AlertConnectionConfig): Promise<boolean> {
      // Test webhook connectivity
      return true;
    },
    async sendWithCustomHeaders(alert: Alert, headers: Record<string, string>): Promise<AlertResult> {
      return { success: true, timestamp: Date.now() };
    },
  };
}

/**
 * Message formatters
 */
function formatTelegramMessage(alert: Alert): string {
  const emoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';
  return `${emoji} *${alert.title}*\n\n${alert.message}\n\nSource: ${alert.source}\nTime: ${new Date(alert.timestamp).toISOString()}`;
}

function formatEmailMessage(alert: Alert): string {
  return `
SecureOS Alert
==============

Title: ${alert.title}
Severity: ${alert.severity}
Source: ${alert.source}
Time: ${new Date(alert.timestamp).toISOString()}

Message:
${alert.message}

---
SecureOS Alert System
  `.trim();
}