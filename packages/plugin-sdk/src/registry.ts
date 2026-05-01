import type {
  DetectionPlugin,
  ModePlugin,
  AlertPlugin,
  DashboardWidget,
} from './index';

export interface Registry {
  registerDetection(plugin: DetectionPlugin): void;
  registerMode(plugin: ModePlugin): void;
  registerAlert(plugin: AlertPlugin): void;
  registerWidget(plugin: DashboardWidget): void;
  deregister(pluginId: string): void;
  getDetection(pluginId: string): DetectionPlugin | undefined;
  getMode(pluginId: string): ModePlugin | undefined;
  getAlert(pluginId: string): AlertPlugin | undefined;
  getWidget(pluginId: string): DashboardWidget | undefined;
  listDetection(): DetectionPlugin[];
  listMode(): ModePlugin[];
  listAlert(): AlertPlugin[];
  listWidget(): DashboardWidget[];
}

// Global registry instance
const registry: {
  detection: Map<string, DetectionPlugin>;
  mode: Map<string, ModePlugin>;
  alert: Map<string, AlertPlugin>;
  widget: Map<string, DashboardWidget>;
} = {
  detection: new Map(),
  mode: new Map(),
  alert: new Map(),
  widget: new Map(),
};

export const pluginRegistry: Registry = {
  registerDetection(plugin: DetectionPlugin): void {
    if (!plugin.plugin_id) {
      throw new Error('Detection plugin must have a plugin_id');
    }
    registry.detection.set(plugin.plugin_id, plugin);
  },

  registerMode(plugin: ModePlugin): void {
    if (!plugin.mode_id) {
      throw new Error('Mode plugin must have a mode_id');
    }
    registry.mode.set(plugin.mode_id, plugin);
  },

  registerAlert(plugin: AlertPlugin): void {
    if (!plugin.plugin_id) {
      throw new Error('Alert plugin must have a plugin_id');
    }
    registry.alert.set(plugin.plugin_id, plugin);
  },

  registerWidget(plugin: DashboardWidget): void {
    if (!plugin.id) {
      throw new Error('Widget plugin must have an id');
    }
    registry.widget.set(plugin.id, plugin);
  },

  deregister(pluginId: string): void {
    registry.detection.delete(pluginId);
    registry.mode.delete(pluginId);
    registry.alert.delete(pluginId);
    registry.widget.delete(pluginId);
  },

  getDetection(pluginId: string): DetectionPlugin | undefined {
    return registry.detection.get(pluginId);
  },

  getMode(pluginId: string): ModePlugin | undefined {
    return registry.mode.get(pluginId);
  },

  getAlert(pluginId: string): AlertPlugin | undefined {
    return registry.alert.get(pluginId);
  },

  getWidget(pluginId: string): DashboardWidget | undefined {
    return registry.widget.get(pluginId);
  },

  listDetection(): DetectionPlugin[] {
    return Array.from(registry.detection.values());
  },

  listMode(): ModePlugin[] {
    return Array.from(registry.mode.values());
  },

  listAlert(): AlertPlugin[] {
    return Array.from(registry.alert.values());
  },

  listWidget(): DashboardWidget[] {
    return Array.from(registry.widget.values());
  },
};

export default pluginRegistry;