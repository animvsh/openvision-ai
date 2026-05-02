import type { WidgetProps, WidgetConfig } from '../../shared-types/src';

/**
 * Widget Plugin Interface
 * Provides custom dashboard widgets for visualization
 */
export interface WidgetPlugin {
  id: string;
  name: string;
  description?: string;
  version?: string;
  widget_type: WidgetType;
  render(props: WidgetProps): WidgetRenderResult;
  default_config?: WidgetConfig;
  validateConfig?(config: Record<string, unknown>): boolean;
}

export type WidgetType = 'chart' | 'table' | 'counter' | 'alert' | 'map' | 'timeline' | 'custom';

/**
 * Widget render result
 */
export interface WidgetRenderResult {
  html?: string;
  component?: string;
  data?: unknown;
  error?: string;
  refresh_interval_ms?: number;
}

/**
 * Chart Widget Plugin
 */
export interface ChartWidgetConfig {
  chart_type: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter' | 'heatmap' | 'gauge';
  data_source: string;
  x_axis_field: string;
  y_axis_fields: string[];
  title?: string;
  colors?: string[];
  show_legend?: boolean;
  show_grid?: boolean;
  animation_enabled?: boolean;
  time_range?: string;
  refresh_interval_ms?: number;
  filters?: Record<string, string>;
}

export interface ChartWidgetPlugin extends WidgetPlugin {
  widget_type: 'chart';
  config: ChartWidgetConfig;
  exportChart(format: 'png' | 'svg' | 'csv'): Promise<string>;
  getChartData(): Promise<unknown>;
}

/**
 * Table Widget Plugin
 */
export interface TableWidgetConfig {
  data_source: string;
  columns: Array<{
    field: string;
    header: string;
    width?: string;
    sortable?: boolean;
    filterable?: boolean;
    formatter?: string;
  }>;
  title?: string;
  page_size?: number;
  show_search?: boolean;
  show_filter?: boolean;
  striped_rows?: boolean;
  hover_effect?: boolean;
  refresh_interval_ms?: number;
}

export interface TableWidgetPlugin extends WidgetPlugin {
  widget_type: 'table';
  config: TableWidgetConfig;
  exportData(format: 'csv' | 'json' | 'xlsx'): Promise<string>;
  getSelectedRows(): unknown[];
  setPage(page: number): void;
}

/**
 * Counter Widget Plugin
 */
export interface CounterWidgetConfig {
  data_source: string;
  value_field: string;
  label_field?: string;
  title?: string;
  format?: 'number' | 'percentage' | 'currency' | 'duration';
  prefix?: string;
  suffix?: string;
  thresholds?: {
    warning?: number;
    critical?: number;
    danger?: number;
  };
  show_trend?: boolean;
  trend_direction?: 'up' | 'down' | 'auto';
  refresh_interval_ms?: number;
}

export interface CounterWidgetPlugin extends WidgetPlugin {
  widget_type: 'counter';
  config: CounterWidgetConfig;
  getValue(): Promise<number>;
  getTrend(): Promise<{ direction: 'up' | 'down' | 'flat'; percentage: number }>;
}

/**
 * Alert Widget Plugin
 */
export interface AlertWidgetConfig {
  alert_sources: string[];
  max_alerts?: number;
  severity_filter?: Array<'info' | 'warning' | 'critical'>;
  auto_refresh?: boolean;
  show_ack_button?: boolean;
  show_resolve_button?: boolean;
  grouping?: 'none' | 'severity' | 'source' | 'time';
  refresh_interval_ms?: number;
}

export interface AlertWidgetPlugin extends WidgetPlugin {
  widget_type: 'alert';
  config: AlertWidgetConfig;
  acknowledgeAlert(alertId: string): Promise<void>;
  resolveAlert(alertId: string): Promise<void>;
  getActiveAlerts(): Promise<unknown[]>;
  getAlertStats(): Promise<AlertStats>;
}

export interface AlertStats {
  total: number;
  critical: number;
  warning: number;
  info: number;
  acknowledged: number;
  unresolved: number;
}

/**
 * Map Widget Plugin
 */
export interface MapWidgetConfig {
  map_type: 'heatmap' | 'markers' | 'zones' | 'camera_view';
  data_source: string;
  location_field: string;
  title?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  show_labels?: boolean;
  clustering_enabled?: boolean;
  refresh_interval_ms?: number;
}

export interface MapWidgetPlugin extends WidgetPlugin {
  widget_type: 'map';
  config: MapWidgetConfig;
  getLocationData(): Promise<unknown[]>;
  focusLocation(lat: number, lng: number, zoom?: number): void;
}

/**
 * Timeline Widget Plugin
 */
export interface TimelineWidgetConfig {
  data_source: string;
  time_field: string;
  event_field: string;
  category_field?: string;
  title?: string;
  time_range?: string;
  show_markers?: boolean;
  show_labels?: boolean;
  refresh_interval_ms?: number;
}

export interface TimelineWidgetPlugin extends WidgetPlugin {
  widget_type: 'timeline';
  config: TimelineWidgetConfig;
  getTimelineEvents(): Promise<unknown[]>;
  setTimeRange(start: Date, end: Date): void;
  zoomToEvent(eventId: string): void;
}

/**
 * Custom Widget Plugin
 */
export interface CustomWidgetConfig {
  component_path: string;
  data_source?: string;
  props?: Record<string, unknown>;
  title?: string;
  refresh_interval_ms?: number;
}

export interface CustomWidgetPlugin extends WidgetPlugin {
  widget_type: 'custom';
  config: CustomWidgetConfig;
  getComponent(): Promise<string>;
  getData(): Promise<unknown>;
  updateProps(props: Record<string, unknown>): void;
}

/**
 * Widget Manifest
 */
export interface WidgetManifest {
  api_version: string;
  plugin_type: 'widget';
  plugin: WidgetPlugin;
  supported_widget_types: WidgetType[];
  permissions?: string[];
}

/**
 * Widget Plugin Registry
 */
export interface WidgetPluginRegistry {
  register(plugin: WidgetPlugin): void;
  deregister(widgetId: string): boolean;
  get(widgetId: string): WidgetPlugin | undefined;
  list(): WidgetPlugin[];
  listByType(type: WidgetType): WidgetPlugin[];
}

/**
 * Factory functions for creating widget plugins
 */
export function createChartWidgetPlugin(
  id: string,
  name: string,
  config: ChartWidgetConfig
): ChartWidgetPlugin {
  return {
    id,
    name,
    description: 'Chart visualization widget',
    version: '1.0.0',
    widget_type: 'chart' as const,
    config,
    render(props: WidgetProps): WidgetRenderResult {
      return {
        component: 'ChartWidget',
        data: props.data,
        refresh_interval_ms: config.refresh_interval_ms,
      };
    },
    default_config: {
      id,
      name,
      type: 'chart',
      config,
      refresh_interval: config.refresh_interval_ms,
    },
    async exportChart(format: 'png' | 'svg' | 'csv'): Promise<string> {
      return `export-${Date.now()}.${format}`;
    },
    async getChartData(): Promise<unknown> {
      return [];
    },
  };
}

export function createTableWidgetPlugin(
  id: string,
  name: string,
  config: TableWidgetConfig
): TableWidgetPlugin {
  return {
    id,
    name,
    description: 'Table data visualization widget',
    version: '1.0.0',
    widget_type: 'table' as const,
    config,
    render(props: WidgetProps): WidgetRenderResult {
      return {
        component: 'TableWidget',
        data: props.data,
        refresh_interval_ms: config.refresh_interval_ms,
      };
    },
    default_config: {
      id,
      name,
      type: 'table',
      config,
      refresh_interval: config.refresh_interval_ms,
    },
    async exportData(format: 'csv' | 'json' | 'xlsx'): Promise<string> {
      return `export-${Date.now()}.${format}`;
    },
    getSelectedRows(): unknown[] {
      return [];
    },
    setPage(_page: number): void {},
  };
}

export function createCounterWidgetPlugin(
  id: string,
  name: string,
  config: CounterWidgetConfig
): CounterWidgetPlugin {
  return {
    id,
    name,
    description: 'Counter/KPI visualization widget',
    version: '1.0.0',
    widget_type: 'counter' as const,
    config,
    render(props: WidgetProps): WidgetRenderResult {
      return {
        component: 'CounterWidget',
        data: props.data,
        refresh_interval_ms: config.refresh_interval_ms,
      };
    },
    default_config: {
      id,
      name,
      type: 'counter',
      config,
      refresh_interval: config.refresh_interval_ms,
    },
    async getValue(): Promise<number> {
      return 0;
    },
    async getTrend(): Promise<{ direction: 'up' | 'down' | 'flat'; percentage: number }> {
      return { direction: 'flat', percentage: 0 };
    },
  };
}

export function createAlertWidgetPlugin(
  id: string,
  name: string,
  config: AlertWidgetConfig
): AlertWidgetPlugin {
  return {
    id,
    name,
    description: 'Alert display and management widget',
    version: '1.0.0',
    widget_type: 'alert' as const,
    config,
    render(props: WidgetProps): WidgetRenderResult {
      return {
        component: 'AlertWidget',
        data: props.data,
        refresh_interval_ms: config.refresh_interval_ms,
      };
    },
    default_config: {
      id,
      name,
      type: 'alert',
      config,
      refresh_interval: config.refresh_interval_ms,
    },
    async acknowledgeAlert(_alertId: string): Promise<void> {},
    async resolveAlert(_alertId: string): Promise<void> {},
    async getActiveAlerts(): Promise<unknown[]> {
      return [];
    },
    async getAlertStats(): Promise<AlertStats> {
      return { total: 0, critical: 0, warning: 0, info: 0, acknowledged: 0, unresolved: 0 };
    },
  };
}

export function createMapWidgetPlugin(
  id: string,
  name: string,
  config: MapWidgetConfig
): MapWidgetPlugin {
  return {
    id,
    name,
    description: 'Map visualization widget',
    version: '1.0.0',
    widget_type: 'map' as const,
    config,
    render(props: WidgetProps): WidgetRenderResult {
      return {
        component: 'MapWidget',
        data: props.data,
        refresh_interval_ms: config.refresh_interval_ms,
      };
    },
    default_config: {
      id,
      name,
      type: 'chart',
      config,
      refresh_interval: config.refresh_interval_ms,
    },
    async getLocationData(): Promise<unknown[]> {
      return [];
    },
    focusLocation(_lat: number, _lng: number, _zoom?: number): void {},
  };
}

export function createTimelineWidgetPlugin(
  id: string,
  name: string,
  config: TimelineWidgetConfig
): TimelineWidgetPlugin {
  return {
    id,
    name,
    description: 'Timeline visualization widget',
    version: '1.0.0',
    widget_type: 'timeline' as const,
    config,
    render(props: WidgetProps): WidgetRenderResult {
      return {
        component: 'TimelineWidget',
        data: props.data,
        refresh_interval_ms: config.refresh_interval_ms,
      };
    },
    default_config: {
      id,
      name,
      type: 'chart',
      config,
      refresh_interval: config.refresh_interval_ms,
    },
    async getTimelineEvents(): Promise<unknown[]> {
      return [];
    },
    setTimeRange(_start: Date, _end: Date): void {},
    zoomToEvent(_eventId: string): void {},
  };
}

export function createCustomWidgetPlugin(
  id: string,
  name: string,
  config: CustomWidgetConfig
): CustomWidgetPlugin {
  return {
    id,
    name,
    description: 'Custom React component widget',
    version: '1.0.0',
    widget_type: 'custom' as const,
    config,
    render(props: WidgetProps): WidgetRenderResult {
      return {
        component: config.component_path,
        data: props.data,
        refresh_interval_ms: config.refresh_interval_ms,
      };
    },
    default_config: {
      id,
      name,
      type: 'chart',
      config,
      refresh_interval: config.refresh_interval_ms,
    },
    async getComponent(): Promise<string> {
      return config.component_path;
    },
    async getData(): Promise<unknown> {
      return null;
    },
    updateProps(_props: Record<string, unknown>): void {},
  };
}