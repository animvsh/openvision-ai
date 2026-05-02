/**
 * Plugin SDK Examples
 * Usage examples for all plugin types
 */

// Detection Plugins
export { YOLOv11Detector } from './yoloDetectionPlugin';

// Mode Plugins
export { ClassroomModeHandler } from './classroomModePlugin';

// Alert Plugins
export { TelegramAlertHandler } from './telegramAlertPlugin';

/**
 * Example: Registering all plugins to the registry
 */
async function registerAllPluginsExample() {
  const { pluginRegistry } = await import('../src/registry');
  const { YOLOv11Detector } = await import('./yoloDetectionPlugin');
  const { ClassroomModeHandler } = await import('./classroomModePlugin');
  const { TelegramAlertHandler } = await import('./telegramAlertPlugin');

  // Create plugin instances
  const detector = new YOLOv11Detector();
  const classroom = new ClassroomModeHandler();
  const telegram = new TelegramAlertHandler();

  // Register to global registry
  // pluginRegistry.registerDetection(detector.plugin);
  // pluginRegistry.registerMode(classroom.plugin);
  // pluginRegistry.registerAlert(telegram.plugin);

  console.log('[PluginRegistry] All plugins registered');
}

export { registerAllPluginsExample };