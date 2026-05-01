// API Response type following the shared patterns
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string | null;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  orgId: string;
  status: CameraStatus;
  rtspUrl?: string;
  mode?: string;
  createdAt: string;
  updatedAt: string;
}

export enum CameraStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance'
}

export interface Event {
  id: string;
  sessionId?: string;
  cameraId: string;
  orgId: string;
  ruleId?: string;
  severity: EventSeverity;
  status: EventStatus;
  description: string;
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export enum EventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum EventStatus {
  NEW = 'new',
  ESCALATED = 'escalated',
  DISMISSED = 'dismissed',
  RESOLVED = 'resolved'
}

export interface User {
  id: string;
  email: string;
  name: string;
  orgId: string;
  role: UserRole;
}

export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer'
}

export interface AuthToken {
  token: string;
  expiresAt: string;
  user: User;
}

export interface AnalyticsOverview {
  totalEvents: number;
  activeSessions: number;
  camerasOnline: number;
  eventsBySeverity: Record<string, number>;
  recentAlerts: number;
}

export interface EngagementAnalytics {
  totalEngagements: number;
  engagementRate: number;
  averageSessionDuration: number;
  topCameras: Array<{ cameraId: string; engagementCount: number }>;
  hourlyDistribution: Record<string, number>;
}

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: string;
}