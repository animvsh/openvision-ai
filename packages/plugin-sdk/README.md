# SecureOS Plugin SDK

A TypeScript SDK for building plugins for the SecureOS surveillance platform.

## Installation

```bash
npm install @secureos/plugin-sdk
```

## Plugin Types

SecureOS supports four types of plugins:

### 1. Detection Plugins

Detection plugins analyze video frames to identify objects, activities, or events.

```typescript
import type { DetectionPlugin, VideoFrame, Detection } from '@secureos/plugin-sdk';

const myDetectionPlugin: DetectionPlugin = {
  plugin_id: 'my-detection',
  name: 'My Detection Plugin',
  version: '1.0.0',

  detect(frame: VideoFrame): Detection[] {
    // Your detection logic here
    return [];
  },
};
```

### 2. Mode Plugins

Mode plugins define rules and dashboard configurations for specific monitoring scenarios.

```typescript
import type { ModePlugin, Rule, WidgetConfig } from '@secureos/plugin-sdk';

const myModePlugin: ModePlugin = {
  mode_id: 'my-mode',
  name: 'My Mode',
  rules: [
    {
      id: 'rule-1',
      name: 'My Rule',
      condition: 'detection.label == "phone"',
      action: 'alert',
      priority: 10,
    },
  ],
  dashboard_widgets: [
    {
      id: 'widget-1',
      name: 'My Widget',
      type: 'chart',
      config: {},
    },
  ],
};
```

### 3. Alert Plugins

Alert plugins handle notification delivery for detected events.

```typescript
import type { AlertPlugin, Alert } from '@secureos/plugin-sdk';

const myAlertPlugin: AlertPlugin = {
  plugin_id: 'my-alert',
  name: 'My Alert Plugin',
  version: '1.0.0',

  async send(alert: Alert): Promise<void> {
    // Send alert via your notification channel
  },
};
```

### 4. Dashboard Widget Plugins

Dashboard widget plugins provide custom visualizations for the monitoring dashboard.

```typescript
import type { DashboardWidget, WidgetProps } from '@secureos/plugin-sdk';

const myWidget: DashboardWidget = {
  id: 'my-widget',
  name: 'My Widget',

  render(props: WidgetProps): unknown {
    // Return your React component or similar
    return { type: 'div', props: { children: 'Hello' } };
  },
};
```

## Plugin Registry

The SDK provides a global registry for managing plugins:

```typescript
import { pluginRegistry } from '@secureos/plugin-sdk';

// Register plugins
pluginRegistry.registerDetection(myDetectionPlugin);
pluginRegistry.registerMode(myModePlugin);
pluginRegistry.registerAlert(myAlertPlugin);
pluginRegistry.registerWidget(myWidget);

// Query plugins
const detector = pluginRegistry.getDetection('my-detection');
const allModes = pluginRegistry.listMode();

// Deregister
pluginRegistry.deregister('my-detection');
```

## Creating a Custom Plugin

### Step 1: Create the plugin package

```bash
mkdir my-plugin && cd my-plugin
npm init -y
npm install @secureos/plugin-sdk typescript
```

### Step 2: Create your plugin

```typescript
// src/index.ts
import type { DetectionPlugin, VideoFrame, Detection } from '@secureos/plugin-sdk';

export const myPlugin: DetectionPlugin = {
  plugin_id: 'my-unique-plugin-id',
  name: 'My Custom Plugin',
  version: '1.0.0',

  detect(frame: VideoFrame): Detection[] {
    // Your detection logic
    return [];
  },
};
```

### Step 3: Configure your package.json

```json
{
  "name": "my-secureos-plugin",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

### Step 4: Build and publish

```bash
npm run build
npm publish
```

## Examples

See the `examples/` directory for complete plugin examples:

- `examples/detection/phone-detection.ts` - Phone detection plugin
- `examples/modes/classroom-mode.ts` - Classroom monitoring mode
- `examples/alerts/sns-alert.ts` - AWS SNS alert integration

## Type Definitions

Core types are defined in `@secureos/shared-types`:

```typescript
import type {
  VideoFrame,
  Detection,
  Rule,
  Alert,
  WidgetConfig,
  WidgetProps,
} from '@secureos/shared-types';
```

## API Reference

### DetectionPlugin

| Property | Type | Description |
|----------|------|-------------|
| `plugin_id` | `string` | Unique identifier for the plugin |
| `name` | `string` | Human-readable name |
| `version` | `string` (optional) | Plugin version |
| `detect(frame)` | `(frame: VideoFrame) => Detection[]` | Detection function |

### ModePlugin

| Property | Type | Description |
|----------|------|-------------|
| `mode_id` | `string` | Unique identifier for the mode |
| `name` | `string` | Human-readable name |
| `version` | `string` (optional) | Plugin version |
| `rules` | `Rule[]` | Array of detection rules |
| `dashboard_widgets` | `WidgetConfig[]` | Dashboard widget configurations |

### AlertPlugin

| Property | Type | Description |
|----------|------|-------------|
| `plugin_id` | `string` | Unique identifier for the plugin |
| `name` | `string` | Human-readable name |
| `version` | `string` (optional) | Plugin version |
| `send(alert)` | `(alert: Alert) => Promise<void>` | Send alert notification |

### DashboardWidget

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier for the widget |
| `name` | `string` | Human-readable name |
| `render(props)` | `(props: WidgetProps) => unknown` | Render function |

## License

Proprietary - SecureOS AI