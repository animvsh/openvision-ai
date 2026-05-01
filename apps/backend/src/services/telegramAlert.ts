import axios from 'axios';

export interface TelegramAlertConfig {
  botToken: string;
  chatIds: string[];
  enabled: boolean;
}

export interface TelegramAlertMessage {
  imageBuffer?: Buffer;
  caption: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cameraId?: string;
  eventId?: string;
}

const DEFAULT_CONFIG: TelegramAlertConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  chatIds: process.env.TELEGRAM_CHAT_IDS?.split(',') || [],
  enabled: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_IDS)
};

export class TelegramAlertService {
  private botToken: string;
  private chatIds: string[];
  private enabled: boolean;

  constructor(config: TelegramAlertConfig = DEFAULT_CONFIG) {
    this.botToken = config.botToken;
    this.chatIds = config.chatIds;
    this.enabled = config.enabled;
  }

  async sendAlert(message: TelegramAlertMessage): Promise<{ success: boolean; errors?: string[] }> {
    if (!this.enabled) {
      return { success: false, errors: ['Telegram alerts are not configured'] };
    }

    const errors: string[] = [];

    for (const chatId of this.chatIds) {
      try {
        await this.sendToChat(chatId, message);
      } catch (error) {
        errors.push(`Failed to send to ${chatId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { success: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  }

  private async sendToChat(chatId: string, message: TelegramAlertMessage): Promise<void> {
    const emoji = this.getSeverityEmoji(message.severity);
    const formattedCaption = `${emoji} *OpenVision Alert*\n\n${message.caption}`;

    if (message.imageBuffer) {
      await this.sendPhotoWithCaption(chatId, message.imageBuffer, formattedCaption);
    } else {
      await this.sendTextMessage(chatId, formattedCaption);
    }
  }

  private async sendPhotoWithCaption(chatId: string, imageBuffer: Buffer, caption: string): Promise<void> {
    const url = `https://api.telegram.org/bot${this.botToken}/sendPhoto`;

    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('photo', new Blob([imageBuffer]), 'alert.jpg');
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');

    await axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });
  }

  private async sendTextMessage(chatId: string, text: string): Promise<void> {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    await axios.post(url, {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }, {
      timeout: 10000,
    });
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '📢';
      case 'low':
        return 'ℹ️';
      default:
        return '📢';
    }
  }

  isConfigured(): boolean {
    return this.enabled && this.botToken.length > 0 && this.chatIds.length > 0;
  }
}

export const telegramAlertService = new TelegramAlertService();

export default telegramAlertService;