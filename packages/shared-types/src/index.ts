// Shared type definitions for SecureOS
// These types are used across all plugin types and the main application

// ============================================================
// Core Entity Types
// ============================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  dataRetentionDays: 24 | 7 | 30 | 90;
  mfaEnabled: boolean;
  allowedDomains?: string[];
  maxCameras: number;
  features: string[];
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'operator' | 'reviewer' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'pending';

export interface Location {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  timezone: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Camera {
  id: string;
  locationId: string;
  name: string;
  streamUrl: string;
  status: CameraStatus;
  mode: CameraMode;
  config: CameraConfig;
  createdAt: string;
  updatedAt: string;
}

export type CameraStatus = 'online' | 'offline' | 'maintenance';
export type CameraMode = 'security' | 'classroom' | 'exam' | 'live';

export interface CameraConfig {
  rotation?: 0 | 90 | 180 | 270;
  minConfidence: number;
  detectionRegions?: DetectionRegion[];
  recordingEnabled: boolean;
  motionDetectionEnabled: boolean;
}

export interface DetectionRegion {
  id: string;
  name: string;
  polygon: { x: number; y: number }[];
  enabled: boolean;
}

export interface Session {
  id: string;
  organizationId: string;
  userId: string;
  token: string;
  refreshToken?: string;
  expiresAt: string;
  createdAt: string;
}

// ============================================================
// Event Types
// ============================================================

export interface Event {
  id: string;
  organizationId: string;
  cameraId: string;
  type: EventType;
  severity: EventSeverity;
  score: number;
  payload: DetectionPayload;
  processedAt: string;
  createdAt: string;
}

export type EventType =
  | 'motion'
  | 'person_detected'
  | 'object_detected'
  | 'face_detected'
  | 'intrusion'
  | 'crowd'
  | 'tailgating'
  | 'prohibited_item';

export type EventSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface DetectionPayload {
  type: string;
  confidence: number;
  bbox?: BoundingBox;
  objects?: DetectedObject[];
  faces?: DetectedFace[];
  metadata?: Record<string, unknown>;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface DetectedFace {
  bbox: BoundingBox;
  landmarks?: { x: number; y: number }[];
  emotions?: Record<string, number>;
  ageRange?: { min: number; max: number };
  gender?: 'male' | 'female' | 'unknown';
}

export interface EventScore {
  eventId: string;
  overallScore: number;
  components: {
    confidence: number;
    severity: number;
    velocity: number;
    context: number;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  generatedAt: string;
}

export interface Rule {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  mode: CameraMode;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RuleCondition {
  type: 'event_type' | 'detection' | 'time_range' | 'zone' | 'threshold';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: string | number | string[] | number[];
  field?: string;
}

export interface RuleAction {
  type: 'notify' | 'record' | 'alert' | 'webhook' | 'automation';
  config: Record<string, unknown>;
}

export interface Review {
  id: string;
  eventId: string;
  userId: string;
  status: ReviewStatus;
  notes?: string;
  disposition?: ReviewDisposition;
  createdAt: string;
  updatedAt: string;
}

export type ReviewStatus = 'pending' | 'in_progress' | 'resolved' | 'dismissed';
export type ReviewDisposition = 'true_positive' | 'false_positive' | 'investigation_ongoing' | 'escalated';

// ============================================================
// AI Types
// ============================================================

export interface AIModelResponse {
  model: string;
  provider: 'bedrock' | 'rekognition' | 'custom';
  predictions: AIPrediction[];
  processingTimeMs: number;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface AIPrediction {
  type: string;
  label: string;
  confidence: number;
  bbox?: BoundingBox;
  metadata?: Record<string, unknown>;
}

// ============================================================
// API Types
// ============================================================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: APIPaginationMeta;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface APIPaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================
// WebSocket Types
// ============================================================

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: unknown;
  timestamp: string;
}

export type WebSocketMessageType =
  | 'event'
  | 'camera_status'
  | 'alert'
  | 'heartbeat'
  | 'error';

export interface WebSocketEventMessage extends WebSocketMessage {
  type: 'event';
  payload: {
    event: Event;
    score: EventScore;
  };
}

// ============================================================
// Dashboard Types
// ============================================================

export interface DashboardWidget {
  id: string;
  name: string;
  render(props: WidgetProps): unknown;
}

export interface WidgetConfig {
  id: string;
  name: string;
  type: 'chart' | 'table' | 'counter' | 'alert';
  refreshInterval?: number;
  config: Record<string, unknown>;
}

export interface WidgetProps {
  data: unknown;
  config: Record<string, unknown>;
  refresh: () => void;
}

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  source: string;
  metadata?: Record<string, unknown>;
}

// ============================================================
// Plugin SDK Types
// ============================================================

export interface VideoFrame {
  data: Uint8Array | Uint8ClampedArray;
  width: number;
  height: number;
  timestamp: number;
  format?: 'rgba' | 'rgb' | 'yuv';
}

export interface Detection {
  id: string;
  label: string;
  confidence: number;
  bbox: BoundingBox;
  metadata?: Record<string, unknown>;
}
