// Shared type definitions for the plugin SDK
// These types are used across all plugin types

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
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metadata?: Record<string, unknown>;
}

export interface Rule {
  id: string;
  name: string;
  condition: string;
  action: 'allow' | 'deny' | 'alert';
  priority: number;
}

export interface WidgetConfig {
  id: string;
  name: string;
  type: 'chart' | 'table' | 'counter' | 'alert';
  refresh_interval?: number;
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

export interface DashboardWidget {
  id: string;
  name: string;
  render(props: WidgetProps): unknown;
}