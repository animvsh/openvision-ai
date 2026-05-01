import { EventSeverity } from '../types';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AlertChannel {
  telegram: boolean;
  email: boolean;
  sns: boolean;
}

export interface EscalationRule {
  afterMinutes: number;
  channels: AlertChannel;
  severity: AlertSeverity;
}

export interface RoutingRule {
  severity: AlertSeverity;
  channels: AlertChannel;
  cooldownMinutes: number;
}

const DEFAULT_ROUTING_RULES: RoutingRule[] = [
  {
    severity: 'critical',
    channels: { telegram: true, email: true, sns: true },
    cooldownMinutes: 0,
  },
  {
    severity: 'high',
    channels: { telegram: true, email: true, sns: true },
    cooldownMinutes: 5,
  },
  {
    severity: 'medium',
    channels: { telegram: true, email: true, sns: false },
    cooldownMinutes: 15,
  },
  {
    severity: 'low',
    channels: { telegram: true, email: false, sns: false },
    cooldownMinutes: 30,
  },
];

const DEFAULT_ESCALATION_RULES: EscalationRule[] = [
  { afterMinutes: 5, channels: { telegram: true, email: true, sns: true }, severity: 'high' },
  { afterMinutes: 15, channels: { telegram: true, email: true, sns: true }, severity: 'critical' },
];

export class AlertPriorityService {
  private routingRules: RoutingRule[];
  private escalationRules: EscalationRule[];
  private lastAlertTime: Map<string, number> = new Map();

  constructor(
    routingRules: RoutingRule[] = DEFAULT_ROUTING_RULES,
    escalationRules: EscalationRule[] = DEFAULT_ESCALATION_RULES
  ) {
    this.routingRules = routingRules;
    this.escalationRules = escalationRules;
  }

  getRoutingRule(severity: AlertSeverity): RoutingRule {
    return this.routingRules.find(r => r.severity === severity) || this.routingRules[2];
  }

  getEscalationRule(eventId: string, eventCreatedAt: Date): EscalationRule | null {
    const elapsedMinutes = (Date.now() - eventCreatedAt.getTime()) / 60000;

    for (const rule of this.escalationRules) {
      if (elapsedMinutes >= rule.afterMinutes) {
        return rule;
      }
    }

    return null;
  }

  shouldSendAlert(eventId: string, severity: AlertSeverity): boolean {
    const cooldownKey = `${eventId}:${severity}`;
    const lastSent = this.lastAlertTime.get(cooldownKey);

    if (!lastSent) {
      return true;
    }

    const rule = this.getRoutingRule(severity);
    const cooldownMs = rule.cooldownMinutes * 60 * 1000;

    return Date.now() - lastSent >= cooldownMs;
  }

  recordAlertSent(eventId: string, severity: AlertSeverity): void {
    const cooldownKey = `${eventId}:${severity}`;
    this.lastAlertTime.set(cooldownKey, Date.now());
  }

  getChannels(severity: AlertSeverity): AlertChannel {
    const rule = this.getRoutingRule(severity);
    return { ...rule.channels };
  }

  mapEventSeverity(severity: EventSeverity): AlertSeverity {
    switch (severity) {
      case EventSeverity.CRITICAL:
        return 'critical';
      case EventSeverity.HIGH:
        return 'high';
      case EventSeverity.MEDIUM:
        return 'medium';
      case EventSeverity.LOW:
        return 'low';
      default:
        return 'medium';
    }
  }

  getAlertMessage(event: {
    id: string;
    description: string;
    severity: EventSeverity;
    cameraId: string;
    createdAt: string;
  }): { subject: string; body: string } {
    const severityLabel = this.mapEventSeverity(event.severity).toUpperCase();

    return {
      subject: `${event.description.substring(0, 50)}${event.description.length > 50 ? '...' : ''}`,
      body: `
Event ID: ${event.id}
Severity: ${severityLabel}
Description: ${event.description}
Camera: ${event.cameraId}
Time: ${new Date(event.createdAt).toLocaleString()}
      `.trim(),
    };
  }

  getCooldownRemaining(eventId: string, severity: AlertSeverity): number {
    const cooldownKey = `${eventId}:${severity}`;
    const lastSent = this.lastAlertTime.get(cooldownKey);

    if (!lastSent) {
      return 0;
    }

    const rule = this.getRoutingRule(severity);
    const cooldownMs = rule.cooldownMinutes * 60 * 1000;
    const elapsed = Date.now() - lastSent;

    return Math.max(0, cooldownMs - elapsed);
  }
}

export const alertPriorityService = new AlertPriorityService();

export default alertPriorityService;