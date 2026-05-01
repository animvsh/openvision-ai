import type { Rule, WidgetConfig, WidgetProps } from '../../shared-types/src';

/**
 * Mode Plugin Interface
 * Provides behavioral modes with rules and dashboard widgets
 */
export interface ModePlugin {
  mode_id: string;
  name: string;
  description?: string;
  version?: string;
  mode_type: ModeType;
  rules: Rule[];
  dashboard_widgets: WidgetConfig[];
  onActivate?(): Promise<void>;
  onDeactivate?(): Promise<void>;
  onRuleTriggered?(ruleId: string, context: RuleContext): Promise<RuleAction>;
}

export type ModeType = 'classroom' | 'exam' | 'security' | 'facility_safety';

/**
 * Rule context passed when a rule is triggered
 */
export interface RuleContext {
  camera_id: string;
  timestamp: number;
  event_type: string;
  detections?: Array<{
    label: string;
    confidence: number;
    bbox: { x: number; y: number; width: number; height: number };
  }>;
  metadata?: Record<string, unknown>;
}

/**
 * Action to perform when a rule triggers
 */
export interface RuleAction {
  type: 'notify' | 'record' | 'alert' | 'webhook' | 'automation' | 'custom';
  config: Record<string, unknown>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Classroom Mode Plugin
 * Monitors classroom activities, attendance, and behavior
 */
export interface ClassroomModeConfig {
  attendance_tracking: boolean;
  focus_detection: boolean;
  noise_level_threshold: number;
  permitted_zones: string[];
  prohibited_objects: string[];
  alert_on_exits: boolean;
}

export interface ClassroomModePlugin extends ModePlugin {
  mode_type: 'classroom';
  config: ClassroomModeConfig;
  getAttendance(): Promise<AttendanceRecord[]>;
  getFocusScore(): Promise<number>;
  getNoiseLevel(): Promise<number>;
}

export interface AttendanceRecord {
  camera_id: string;
  timestamp: number;
  present_count: number;
  absent_count: number;
  individuals: Array<{
    person_id: string;
    label: string;
    bbox: { x: number; y: number; width: number; height: number };
  }>;
}

/**
 * Exam Integrity Mode Plugin
 * Ensures exam environment integrity, detects cheating
 */
export interface ExamIntegrityConfig {
  prohibited_objects: string[];
  lookaround_detection: boolean;
  phone_detection: boolean;
  multiple_person_threshold: number;
  head_pose_threshold: number;
  alert_delay_seconds: number;
  auto_record_on_violation: boolean;
}

export interface ExamIntegrityModePlugin extends ModePlugin {
  mode_type: 'exam';
  config: ExamIntegrityConfig;
  getViolationCount(): Promise<number>;
  getViolationEvents(): Promise<ExamViolation[]>;
  getActiveMonitoringCount(): Promise<number>;
}

export interface ExamViolation {
  id: string;
  timestamp: number;
  camera_id: string;
  violation_type: 'lookaround' | 'phone' | 'multiple_person' | 'prohibited_object' | 'head_pose';
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence?: {
    frame_data?: string;
    bbox?: { x: number; y: number; width: number; height: number };
  };
}

/**
 * Security Mode Plugin
 * Standard security monitoring with intrusion detection
 */
export interface SecurityModeConfig {
  intrusion_detection: boolean;
  perimeter_monitoring: boolean;
  unauthorized_entry_alert: boolean;
  crowd_detection_threshold: number;
  tailgating_detection: boolean;
  tripwire_enabled: boolean;
  loitering_detection: boolean;
  loitering_time_threshold_seconds: number;
}

export interface SecurityModePlugin extends ModePlugin {
  mode_type: 'security';
  config: SecurityModeConfig;
  getActiveThreats(): Promise<SecurityThreat[]>;
  getZoneStatus(): Promise<ZoneStatus[]>;
  armZone(zoneId: string): Promise<void>;
  disarmZone(zoneId: string): Promise<void>;
}

export interface SecurityThreat {
  id: string;
  threat_type: 'intrusion' | 'tailgating' | 'crowd' | 'loitering' | 'perimeter';
  severity: 'low' | 'medium' | 'high' | 'critical';
  camera_id: string;
  timestamp: number;
  location?: { x: number; y: number };
  description: string;
}

export interface ZoneStatus {
  zone_id: string;
  name: string;
  status: 'armed' | 'disarmed' | 'alarm' | 'fault';
  last_activity?: number;
  threat_count: number;
}

/**
 * Facility Safety Mode Plugin
 * Monitors facility safety compliance
 */
export interface FacilitySafetyConfig {
  ppe_detection: boolean;
  required_ppe: string[];
  hard_hat_zones: string[];
  safety_vest_zones: string[];
  hazard_detection: boolean;
  confined_space_monitoring: boolean;
  emergency_exit_clear: boolean;
  smoking_detection: boolean;
}

export interface FacilitySafetyModePlugin extends ModePlugin {
  mode_type: 'facility_safety';
  config: FacilitySafetyConfig;
  getComplianceRate(): Promise<number>;
  getPPEViolations(): Promise<PPEViolation[]>;
  getHazardAlerts(): Promise<HazardAlert[]>;
}

export interface PPEViolation {
  id: string;
  timestamp: number;
  camera_id: string;
  person_id: string;
  missing_ppe: string[];
  bbox: { x: number; y: number; width: number; height: number };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface HazardAlert {
  id: string;
  timestamp: number;
  camera_id: string;
  hazard_type: 'fire' | 'smoke' | 'spill' | 'equipment' | 'unauthorized' | 'confined_space';
  location?: { x: number; y: number };
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

/**
 * Mode Plugin Manifest
 */
export interface ModeManifest {
  api_version: string;
  plugin_type: 'mode';
  plugin: ModePlugin;
  supported_cameras?: string[];
  required_permissions?: string[];
  default_config?: Record<string, unknown>;
}

/**
 * Mode Plugin Registry
 */
export interface ModePluginRegistry {
  register(plugin: ModePlugin): void;
  deregister(modeId: string): boolean;
  get(modeId: string): ModePlugin | undefined;
  list(): ModePlugin[];
  listByType(type: ModeType): ModePlugin[];
  getActive(): ModePlugin | undefined;
  setActive(modeId: string): void;
}

/**
 * Factory functions for creating mode plugins
 */
export function createClassroomModePlugin(
  modeId: string,
  name: string,
  config: ClassroomModeConfig
): ClassroomModePlugin {
  return {
    mode_id: modeId,
    name,
    description: 'Classroom monitoring and attendance tracking mode',
    version: '1.0.0',
    mode_type: 'classroom' as const,
    config,
    rules: [],
    dashboard_widgets: [],
    async onActivate() {},
    async onDeactivate() {},
    async getAttendance() { return []; },
    async getFocusScore() { return 0; },
    async getNoiseLevel() { return 0; },
  };
}

export function createExamIntegrityModePlugin(
  modeId: string,
  name: string,
  config: ExamIntegrityConfig
): ExamIntegrityModePlugin {
  return {
    mode_id: modeId,
    name,
    description: 'Exam integrity monitoring and cheating detection mode',
    version: '1.0.0',
    mode_type: 'exam' as const,
    config,
    rules: [],
    dashboard_widgets: [],
    async onActivate() {},
    async onDeactivate() {},
    async getViolationCount() { return 0; },
    async getViolationEvents() { return []; },
    async getActiveMonitoringCount() { return 0; },
  };
}

export function createSecurityModePlugin(
  modeId: string,
  name: string,
  config: SecurityModeConfig
): SecurityModePlugin {
  return {
    mode_id: modeId,
    name,
    description: 'Security monitoring with intrusion and threat detection',
    version: '1.0.0',
    mode_type: 'security' as const,
    config,
    rules: [],
    dashboard_widgets: [],
    async onActivate() {},
    async onDeactivate() {},
    async getActiveThreats() { return []; },
    async getZoneStatus() { return []; },
    async armZone(_zoneId: string) {},
    async disarmZone(_zoneId: string) {},
  };
}

export function createFacilitySafetyModePlugin(
  modeId: string,
  name: string,
  config: FacilitySafetyConfig
): FacilitySafetyModePlugin {
  return {
    mode_id: modeId,
    name,
    description: 'Facility safety compliance monitoring mode',
    version: '1.0.0',
    mode_type: 'facility_safety' as const,
    config,
    rules: [],
    dashboard_widgets: [],
    async onActivate() {},
    async onDeactivate() {},
    async getComplianceRate() { return 0; },
    async getPPEViolations() { return []; },
    async getHazardAlerts() { return []; },
  };
}