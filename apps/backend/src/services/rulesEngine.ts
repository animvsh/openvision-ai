/**
 * Rules Engine Service
 * Event-driven automation for camera events
 */

import { broadcastAlert, broadcastEvent } from './websocket';

export type RuleAction = 'notify' | 'record' | 'trigger_alarm' | 'webhook';
export type RuleEvent = 'authorized_entry' | 'attendance' | 'phone_detected' | 'face_recognized' | 'face_unknown' | 'vehicle_recognized' | 'unknown_vehicle';

export type AttendanceRole = 'employee' | 'visitor' | 'contractor' | 'student';
export type VehicleRole = 'authorized' | 'delivery' | 'employee' | 'visitor' | 'restricted';

export interface AttendanceCondition {
  role: AttendanceRole;
  entryTimeStart?: string;
  entryTimeEnd?: string;
  exitTime?: string;
  intervalCheck?: boolean;
}

export interface VehicleCondition {
  role: VehicleRole;
  licensePlatePattern?: string;
}

export type RuleCondition =
  | { type: 'attendance'; data: AttendanceCondition }
  | { type: 'vehicle'; data: VehicleCondition }
  | { type: 'general'; data: { description: string } };

export interface Rule {
  id: string;
  name: string;
  cameraId?: string;
  cameraName?: string;
  event: RuleEvent;
  condition: RuleCondition;
  action: RuleAction;
  enabled: boolean;
  schedule: string;
  days: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RuleExecutionContext {
  ruleId: string;
  ruleName: string;
  event: RuleEvent;
  cameraId: string;
  cameraName?: string;
  timestamp: string;
  eventData: Record<string, unknown>;
}

const rules: Map<string, Rule> = new Map();

export const createRule = (ruleData: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>): Rule => {
  const now = new Date().toISOString();
  const rule: Rule = {
    ...ruleData,
    id: `rule-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };
  rules.set(rule.id, rule);
  return rule;
};

export const getRules = (): Rule[] => {
  return Array.from(rules.values());
};

export const getRuleById = (id: string): Rule | undefined => {
  return rules.get(id);
};

export const getRulesByCameraId = (cameraId: string): Rule[] => {
  return Array.from(rules.values()).filter(
    (rule) => rule.cameraId === cameraId || !rule.cameraId
  );
};

export const getRulesByEvent = (event: RuleEvent): Rule[] => {
  return Array.from(rules.values()).filter(
    (rule) => rule.enabled && rule.event === event
  );
};

export const updateRule = (id: string, updates: Partial<Omit<Rule, 'id' | 'createdAt'>>): Rule | undefined => {
  const rule = rules.get(id);
  if (!rule) return undefined;

  const updatedRule: Rule = {
    ...rule,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  rules.set(id, updatedRule);
  return updatedRule;
};

export const deleteRule = (id: string): boolean => {
  return rules.delete(id);
};

const evaluateCondition = (condition: RuleCondition, eventData: Record<string, unknown>): boolean => {
  switch (condition.type) {
    case 'attendance': {
      const data = condition.data;
      if (eventData.role !== data.role) return false;
      if (data.entryTimeStart || data.entryTimeEnd) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        if (data.entryTimeStart && currentTime < data.entryTimeStart) return false;
        if (data.entryTimeEnd && currentTime > data.entryTimeEnd) return false;
      }
      return true;
    }
    case 'vehicle': {
      const data = condition.data;
      if (eventData.role && eventData.role !== data.role) return false;
      if (data.licensePlatePattern && eventData.licensePlate) {
        const pattern = new RegExp(data.licensePlatePattern);
        if (!pattern.test(eventData.licensePlate as string)) return false;
      }
      return true;
    }
    case 'general':
      return true;
    default:
      return false;
  }
};

const executeAction = async (action: RuleAction, context: RuleExecutionContext): Promise<void> => {
  switch (action) {
    case 'notify':
      broadcastAlert({
        alertType: 'rule_triggered',
        ruleName: context.ruleName,
        cameraId: context.cameraId,
        message: `Rule "${context.ruleName}" triggered on camera ${context.cameraName || context.cameraId}`,
        severity: 'medium',
      });
      break;

    case 'record':
      broadcastEvent({
        type: 'recording_started',
        payload: {
          ruleId: context.ruleId,
          cameraId: context.cameraId,
          timestamp: context.timestamp,
        },
        timestamp: context.timestamp,
      });
      break;

    case 'trigger_alarm':
      broadcastAlert({
        alertType: 'alarm_triggered',
        ruleName: context.ruleName,
        cameraId: context.cameraId,
        message: `ALARM: Rule "${context.ruleName}" triggered`,
        severity: 'critical',
      });
      break;

    case 'webhook':
      console.log(`Webhook triggered for rule ${context.ruleName}`);
      break;
  }
};

export const evaluateRules = async (event: RuleEvent, cameraId: string, cameraName: string | undefined, eventData: Record<string, unknown>): Promise<void> => {
  const matchingRules = getRulesByEvent(event);

  for (const rule of matchingRules) {
    if (rule.cameraId && rule.cameraId !== cameraId) continue;

    const conditionMet = evaluateCondition(rule.condition, eventData);
    if (!conditionMet) continue;

    const context: RuleExecutionContext = {
      ruleId: rule.id,
      ruleName: rule.name,
      event,
      cameraId,
      cameraName,
      timestamp: new Date().toISOString(),
      eventData,
    };

    await executeAction(rule.action, context);
  }
};

export const initializeDefaultRules = (): void => {
  if (rules.size === 0) {
    createRule({
      name: 'Default Authorized Entry Alert',
      event: 'authorized_entry',
      condition: { type: 'general', data: { description: 'Alert on any authorized entry' } },
      action: 'notify',
      enabled: true,
      schedule: 'always',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    });

    createRule({
      name: 'Phone Detection Alarm',
      event: 'phone_detected',
      condition: { type: 'general', data: { description: 'Trigger alarm on phone detection' } },
      action: 'trigger_alarm',
      enabled: true,
      schedule: 'always',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    });
  }
};

initializeDefaultRules();