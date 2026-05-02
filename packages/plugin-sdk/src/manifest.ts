/**
 * Plugin Manifest Schema
 * JSON Schema for validating plugin manifests
 */

export interface PluginManifestSchema {
  api_version: string;
  plugin_type: 'detection' | 'mode' | 'alert' | 'widget';
  plugin: unknown;
  metadata?: {
    name: string;
    version?: string;
    description?: string;
    author?: string;
    license?: string;
    homepage?: string;
    repository?: string;
    keywords?: string[];
  };
  capabilities?: {
    live_detection?: boolean;
    batch_processing?: boolean;
    model_reloading?: boolean;
    config_update?: boolean;
  };
  dependencies?: Record<string, string>;
  permissions?: string[];
  environment?: Record<string, string>;
}

/**
 * Plugin manifest schema version
 */
export const CURRENT_API_VERSION = '1.0.0';

/**
 * Validate a plugin manifest against the schema
 */
export function validateManifest(manifest: unknown): PluginManifestSchema | null {
  if (!manifest || typeof manifest !== 'object') {
    return null;
  }

  const m = manifest as Record<string, unknown>;

  // Required fields
  if (!m.api_version || typeof m.api_version !== 'string') {
    return null;
  }
  if (!m.plugin_type || !['detection', 'mode', 'alert', 'widget'].includes(m.plugin_type as string)) {
    return null;
  }
  if (!m.plugin || typeof m.plugin !== 'object') {
    return null;
  }

  return {
    api_version: m.api_version as string,
    plugin_type: m.plugin_type as 'detection' | 'mode' | 'alert' | 'widget',
    plugin: m.plugin,
    metadata: m.metadata as PluginManifestSchema['metadata'],
    capabilities: m.capabilities as PluginManifestSchema['capabilities'],
    dependencies: m.dependencies as Record<string, string>,
    permissions: m.permissions as string[],
    environment: m.environment as Record<string, string>,
  };
}

/**
 * Example manifest for a YOLO detection plugin
 */
export const yoloPluginManifestExample: PluginManifestSchema = {
  api_version: '1.0.0',
  plugin_type: 'detection',
  plugin: {
    plugin_id: 'yolo-detector-v11',
    name: 'YOLOv11 Detection Plugin',
    version: '1.0.0',
    model_type: 'yolo',
    capabilities: {
      live_detection: true,
      batch_processing: true,
      model_reloading: true,
    },
  },
  metadata: {
    name: 'YOLOv11 Object Detector',
    version: '1.0.0',
    description: 'YOLOv11 object detection with YOLO-NAS support',
    author: 'OpenVision AI',
    license: 'MIT',
    keywords: ['detection', 'yolo', 'object-detection', 'yolo11'],
  },
  capabilities: {
    live_detection: true,
    batch_processing: true,
    model_reloading: true,
  },
  dependencies: {
    'onnxruntime': '^1.18.0',
  },
  permissions: ['camera:read', 'storage:read'],
};

/**
 * Example manifest for a classroom mode plugin
 */
export const classroomModePluginManifestExample: PluginManifestSchema = {
  api_version: '1.0.0',
  plugin_type: 'mode',
  plugin: {
    mode_id: 'classroom-mode-v1',
    name: 'Classroom Mode Plugin',
    version: '1.0.0',
    mode_type: 'classroom',
    capabilities: {
      config_update: true,
    },
  },
  metadata: {
    name: 'Classroom Mode',
    version: '1.0.0',
    description: 'Classroom monitoring with attendance tracking and focus detection',
    author: 'OpenVision AI',
  },
  capabilities: {
    config_update: true,
  },
};

/**
 * Example manifest for a Telegram alert plugin
 */
export const telegramAlertPluginManifestExample: PluginManifestSchema = {
  api_version: '1.0.0',
  plugin_type: 'alert',
  plugin: {
    plugin_id: 'telegram-alert-v1',
    name: 'Telegram Alert Plugin',
    version: '1.0.0',
    channel: 'telegram',
    capabilities: {
      config_update: true,
    },
  },
  metadata: {
    name: 'Telegram Alert Adapter',
    version: '1.0.0',
    description: 'Send alerts via Telegram bot notifications',
    author: 'OpenVision AI',
  },
  capabilities: {
    config_update: true,
  },
  permissions: ['network:write'],
};

/**
 * Example manifest for a chart widget plugin
 */
export const chartWidgetPluginManifestExample: PluginManifestSchema = {
  api_version: '1.0.0',
  plugin_type: 'widget',
  plugin: {
    id: 'chart-widget-v1',
    name: 'Chart Widget Plugin',
    version: '1.0.0',
    widget_type: 'chart',
    capabilities: {},
  },
  metadata: {
    name: 'Chart Widget',
    version: '1.0.0',
    description: 'Recharts-based chart visualization widget',
    author: 'OpenVision AI',
  },
};