import { SESClient, SendEmailCommand, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { Readable } from 'stream';

export interface EmailAlertConfig {
  region: string;
  fromEmail: string;
  toEmails: string[];
  enabled: boolean;
}

export interface EmailAlertMessage {
  subject: string;
  body: string;
  imageBuffer?: Buffer;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cameraId?: string;
  eventId?: string;
}

const DEFAULT_CONFIG: EmailAlertConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  fromEmail: process.env.SES_FROM_EMAIL || 'alerts@openvision.ai',
  toEmails: process.env.SES_TO_EMAILS?.split(',') || [],
  enabled: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.SES_FROM_EMAIL)
};

export class SesEmailService {
  private client: SESClient;
  private fromEmail: string;
  private toEmails: string[];
  private enabled: boolean;

  constructor(config: EmailAlertConfig = DEFAULT_CONFIG) {
    this.client = new SESClient({
      region: config.region,
      credentials: config.region !== 'us-east-1' ? undefined : undefined,
    });
    this.fromEmail = config.fromEmail;
    this.toEmails = config.toEmails;
    this.enabled = config.enabled;
  }

  async sendAlert(message: EmailAlertMessage): Promise<{ success: boolean; errors?: string[] }> {
    if (!this.enabled) {
      return { success: false, errors: ['SES email alerts are not configured'] };
    }

    try {
      if (message.imageBuffer) {
        await this.sendEmailWithAttachment(message);
      } else {
        await this.sendSimpleEmail(message);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to send email']
      };
    }
  }

  private async sendSimpleEmail(message: EmailAlertMessage): Promise<void> {
    const severityLabel = message.severity.toUpperCase();
    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: {
        ToAddresses: this.toEmails,
      },
      Message: {
        Subject: {
          Data: `[${severityLabel}] OpenVision Alert: ${message.subject}`,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: this.formatHtmlBody(message),
            Charset: 'UTF-8',
          },
          Text: {
            Data: `${message.body}\n\nSeverity: ${message.severity.toUpperCase()}`,
            Charset: 'UTF-8',
          },
        },
      },
    });

    await this.client.send(command);
  }

  private async sendEmailWithAttachment(message: EmailAlertMessage): Promise<void> {
    const boundary = `boundary_${Date.now()}`;
    const imageBase64 = message.imageBuffer!.toString('base64');

    const rawEmail = [
      `From: ${this.fromEmail}`,
      `To: ${this.toEmails.join(', ')}`,
      `Subject: [${message.severity.toUpperCase()}] OpenVision Alert: ${message.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      '',
      this.formatHtmlBody(message),
      '',
      `--${boundary}`,
      `Content-Type: image/jpeg; name="alert.jpg"`,
      `Content-Transfer-Encoding: base64`,
      `Content-Disposition: attachment; filename="alert.jpg"`,
      '',
      imageBase64,
      '',
      `--${boundary}--`,
    ].join('\n');

    const command = new SendRawEmailCommand({
      RawMessage: {
        Data: Buffer.from(rawEmail),
      },
    });

    await this.client.send(command);
  }

  private formatHtmlBody(message: EmailAlertMessage): string {
    const severityColors: Record<string, string> = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#ca8a04',
      low: '#16a34a',
    };
    const color = severityColors[message.severity] || '#16a34a';

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f3f4f6; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: ${color}; color: white; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 20px; }
    .alert-box { border-left: 4px solid ${color}; padding: 15px; background: #f9fafb; margin: 15px 0; }
    .label { font-weight: bold; color: #6b7280; font-size: 12px; }
    .value { margin-top: 5px; font-size: 14px; }
    .footer { padding: 15px 20px; background: #f9fafb; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>OpenVision Alert</h1>
      <p>${message.severity.toUpperCase()} SEVERITY</p>
    </div>
    <div class="content">
      <div class="alert-box">
        <div class="label">MESSAGE</div>
        <div class="value">${message.body}</div>
      </div>
      ${message.cameraId ? `
      <div class="alert-box">
        <div class="label">CAMERA ID</div>
        <div class="value">${message.cameraId}</div>
      </div>
      ` : ''}
      ${message.eventId ? `
      <div class="alert-box">
        <div class="label">EVENT ID</div>
        <div class="value">${message.eventId}</div>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      OpenVision AI - Real-time Safety Monitoring
    </div>
  </div>
</body>
</html>`;
  }

  isConfigured(): boolean {
    return this.enabled && this.fromEmail.length > 0 && this.toEmails.length > 0;
  }
}

export const sesEmailService = new SesEmailService();

export default sesEmailService;