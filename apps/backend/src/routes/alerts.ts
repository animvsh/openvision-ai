import { Router, Request, Response } from 'express';
import { ApiResponse, EventSeverity } from '../types';
import { telegramAlertService, TelegramAlertMessage } from '../services/telegramAlert';
import { sesEmailService, EmailAlertMessage } from '../services/sesEmail';
import { snsNotificationService, SnsAlertMessage } from '../services/snsNotification';
import { alertPriorityService, AlertSeverity } from '../services/alertPriority';
import { broadcastAlert } from '../services/websocket';

const router = Router();

interface SendAlertRequest {
  eventId: string;
  cameraId: string;
  severity: EventSeverity;
  description: string;
  imageBuffer?: string;
  createdAt: string;
}

router.post('/send', async (req: Request, res: Response) => {
  try {
    const { eventId, cameraId, severity, description, imageBuffer, createdAt } = req.body as SendAlertRequest;

    if (!eventId || !cameraId || !severity || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: eventId, cameraId, severity, description',
        data: null
      } as ApiResponse<null>);
    }

    const alertSeverity: AlertSeverity = alertPriorityService.mapEventSeverity(severity);

    if (!alertPriorityService.shouldSendAlert(eventId, alertSeverity)) {
      const remaining = alertPriorityService.getCooldownRemaining(eventId, alertSeverity);
      return res.json({
        success: true,
        data: {
          message: 'Alert suppressed due to cooldown',
          remainingMs: remaining
        },
        error: null
      } as ApiResponse<{ message: string; remainingMs: number }>);
    }

    const { subject, body } = alertPriorityService.getAlertMessage({
      id: eventId,
      description,
      severity,
      cameraId,
      createdAt
    });

    const channels = alertPriorityService.getChannels(alertSeverity);
    const results: { channel: string; success: boolean; error?: string }[] = [];

    if (channels.telegram && telegramAlertService.isConfigured()) {
      const imageBuf = imageBuffer ? Buffer.from(imageBuffer, 'base64') : undefined;
      const message: TelegramAlertMessage = {
        imageBuffer: imageBuf,
        caption: body,
        severity: alertSeverity,
        cameraId,
        eventId
      };

      const result = await telegramAlertService.sendAlert(message);
      results.push({ channel: 'telegram', success: result.success, error: result.errors?.join(', ') });
    }

    if (channels.email && sesEmailService.isConfigured()) {
      const message: EmailAlertMessage = {
        subject,
        body,
        imageBuffer: imageBuffer ? Buffer.from(imageBuffer, 'base64') : undefined,
        severity: alertSeverity,
        cameraId,
        eventId
      };

      try {
        await sesEmailService.sendAlert(message);
        results.push({ channel: 'email', success: true });
      } catch (error) {
        results.push({ channel: 'email', success: false, error: error instanceof Error ? error.message : 'Failed' });
      }
    }

    if (channels.sns && snsNotificationService.isConfigured()) {
      const message: SnsAlertMessage = {
        subject,
        message: body,
        severity: alertSeverity,
        cameraId,
        eventId
      };

      const result = await snsNotificationService.sendAlert(message);
      results.push({ channel: 'sns', success: result.success, error: result.error });
    }

    alertPriorityService.recordAlertSent(eventId, alertSeverity);

    broadcastAlert({
      eventId,
      cameraId,
      severity: alertSeverity,
      channels: results,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      data: {
        message: 'Alert sent',
        channels: results
      },
      error: null
    } as ApiResponse<{ message: string; channels: typeof results }>);
  } catch (error) {
    console.error('Error sending alert:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send alert',
      data: null
    } as ApiResponse<null>);
  }
});

router.get('/status', async (_req: Request, res: Response) => {
  return res.json({
    success: true,
    data: {
      telegram: telegramAlertService.isConfigured(),
      email: sesEmailService.isConfigured(),
      sns: snsNotificationService.isConfigured()
    },
    error: null
  } as ApiResponse<{ telegram: boolean; email: boolean; sns: boolean }>);
});

router.get('/routing/:severity', (req: Request, res: Response) => {
  const severity = req.params.severity as AlertSeverity;
  const rule = alertPriorityService.getRoutingRule(severity);

  return res.json({
    success: true,
    data: rule,
    error: null
  } as ApiResponse<typeof rule>);
});

export default router;