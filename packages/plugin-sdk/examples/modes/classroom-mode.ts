import type { ModePlugin, Rule, WidgetConfig } from '../../src';

/**
 * Classroom Mode Plugin
 * Implements rules and dashboard widgets for classroom monitoring
 */
export const classroomModePlugin: ModePlugin = {
  mode_id: 'classroom-mode',
  name: 'Classroom Mode',
  version: '1.0.0',

  rules: [
    {
      id: 'no-phones-classroom',
      name: 'No Phones in Classroom',
      condition: 'detection.label == "mobile_phone" && detection.confidence > 0.7',
      action: 'alert',
      priority: 10,
    },
    {
      id: 'no-food-classroom',
      name: 'No Food in Classroom',
      condition: 'detection.label == "food" && detection.confidence > 0.6',
      action: 'deny',
      priority: 5,
    },
    {
      id: 'allowed-persons',
      name: 'Only Authorized Persons',
      condition: '!detection.authorized',
      action: 'alert',
      priority: 20,
    },
  ],

  dashboard_widgets: [
    {
      id: 'classroom-summary',
      name: 'Classroom Summary',
      type: 'counter',
      config: {
        title: 'Active Violations',
        refresh_interval: 5,
      },
    },
    {
      id: 'classroom-timeline',
      name: 'Violation Timeline',
      type: 'chart',
      config: {
        title: 'Last 24 Hours',
        chart_type: 'timeline',
        refresh_interval: 30,
      },
    },
    {
      id: 'classroom-alerts',
      name: 'Recent Alerts',
      type: 'table',
      config: {
        title: 'Recent Detections',
        columns: ['Time', 'Type', 'Confidence', 'Action'],
        refresh_interval: 5,
      },
    },
  ],
};

// Dashboard widget implementations would be registered separately
// These define the configuration, actual rendering happens in the dashboard

export default classroomModePlugin;