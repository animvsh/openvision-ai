import type {
  DetectionPlugin,
  ModePlugin,
  AlertPlugin,
  DashboardWidget,
  VideoFrame,
  Detection,
  Rule,
  WidgetConfig,
  Alert,
  WidgetProps,
} from '../../shared-types/src';

/**
 * Plugin SDK - Core interfaces for building SecureOS plugins
 */

// Re-export shared types for convenience
export {
  type VideoFrame,
  type Detection,
  type Rule,
  type WidgetConfig,
  type Alert,
  type WidgetProps,
} from '../../shared-types/src';

// Plugin interface for object detection
export interface DetectionPlugin {
  plugin_id: string;
  name: string;
  version?: string;
  detect(frame: VideoFrame): Detection[];
}

// Plugin interface for mode/rules-based plugins
export interface ModePlugin {
  mode_id: string;
  name: string;
  version?: string;
  rules: Rule[];
  dashboard_widgets: WidgetConfig[];
}

// Plugin interface for alert/notification plugins
export interface AlertPlugin {
  plugin_id: string;
  name: string;
  version?: string;
  send(alert: Alert): Promise<void>;
}

// Dashboard widget plugin
export interface DashboardWidget {
  id: string;
  name: string;
  render(props: WidgetProps): unknown;
}

// Plugin manifest - all plugins must export this
export interface PluginManifest {
  api_version: string;
  plugin_type: 'detection' | 'mode' | 'alert' | 'widget';
  plugin: DetectionPlugin | ModePlugin | AlertPlugin | DashboardWidget;
}

// Export all plugin interfaces
export type { DetectionPlugin, ModePlugin, AlertPlugin, DashboardWidget };