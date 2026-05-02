/**
 * Telegram Alert Plugin Example
 * Demonstrates how to create a Telegram alert adapter
 */

import type { Alert } from '../../shared-types/src';
import {
  createTelegramAlertPlugin,
  type TelegramAlertConfig,
} from '../src/plugins/alertPlugin';

/**
 * Example Telegram alert plugin implementation
 */
class TelegramAlertHandler {
  private plugin: ReturnType<typeof createTelegramAlertPlugin>;

  constructor() {
    const config: TelegramAlertConfig = {
      channel: 'telegram',
      bot_token: process.env.TELEGRAM_BOT_TOKEN || 'your-bot-token',
      chat_ids: [
        process.env.TELEGRAM_ALERT_CHAT_ID || '123456789',
        process.env.TELEGRAM_ADMIN_CHAT_ID || '987654321',
      ],
      parse_mode: 'MarkdownV2',
      disable_notification: false,
    };

    this.plugin = createTelegramAlertPlugin('telegram-alert-v1', 'Telegram Alert Plugin', config);
  }

  /**
   * Test the connection
   */
  async test(): Promise<boolean> {
    console.log('[TelegramAlert] Testing connection...');
    const success = await this.plugin.test({});
    console.log('[TelegramAlert] Connection test:', success ? 'OK' : 'FAILED');
    return success;
  }

  /**
   * Send an alert
   */
  async send(alert: Alert): Promise<void> {
    console.log('[TelegramAlert] Sending alert:', alert.title);
    const result = await this.plugin.send(alert);
    if (result.success) {
      console.log('[TelegramAlert] Alert sent successfully');
    } else {
      console.error('[TelegramAlert] Failed to send:', result.error);
    }
  }

  /**
   * Send critical alert with photo evidence
   */
  async sendCritical(alert: Alert, photoPath?: string): Promise<void> {
    if (photoPath) {
      console.log('[TelegramAlert] Sending critical alert with photo:', photoPath);
      await this.plugin.sendPhoto(alert, photoPath);
    } else {
      await this.send(alert);
    }
  }

  /**
   * Send batch alerts
   */
  async sendBatch(alerts: Alert[]): Promise<void> {
    console.log('[TelegramAlert] Sending batch of', alerts.length, 'alerts');
    const results = await this.plugin.sendBatch(alerts);
    const successCount = results.filter(r => r.success).length;
    console.log(`[TelegramAlert] Sent ${successCount}/${alerts.length} alerts`);
  }
}

// Usage example
async function example() {
  const alertHandler = new TelegramAlertHandler();

  // Test connection first
  await alertHandler.test();

  // Create and send a critical alert
  const criticalAlert: Alert = {
    id: 'alert-001',
    severity: 'critical',
    title: 'Intrusion Detected',
    message: 'Unauthorized person detected at front door camera',
    timestamp: Date.now(),
    source: 'security-camera-01',
    metadata: {
      camera_id: 'cam-front-door',
      confidence: 0.95,
      bbox: { x: 100, y: 50, width: 80, height: 120 },
    },
  };

  await alertHandler.send(criticalAlert);

  // Send batch of warnings
  const warnings: Alert[] = [
    {
      id: 'alert-002',
      severity: 'warning',
      title: 'Noise Level High',
      message: 'Classroom noise exceeded threshold',
      timestamp: Date.now(),
      source: 'classroom-cam-01',
    },
    {
      id: 'alert-003',
      severity: 'warning',
      title: 'Camera Offline',
      message: 'Camera cam-parking-lot is offline',
      timestamp: Date.now(),
      source: 'system',
    },
  ];

  await alertHandler.sendBatch(warnings);
}

export { TelegramAlertHandler };
export default { TelegramAlertHandler };