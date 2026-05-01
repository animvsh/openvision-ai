import type { VideoFrame, Detection, BoundingBox } from '../../shared-types/src';

/**
 * Detection Plugin Interface
 * Provides object detection capabilities for camera frames
 */
export interface DetectionPlugin {
  plugin_id: string;
  name: string;
  version?: string;
  model_type: 'yolo' | 'custom' | 'ssd' | 'centerpoint';
  detect(frame: VideoFrame): Detection[];
  detectAsync(frame: VideoFrame): Promise<Detection[]>;
  warmup?(): Promise<void>;
  unload?(): Promise<void>;
}

/**
 * YOLO Detection Plugin
 * Object detection using YOLO models (YOLOv5-YOLOv11)
 */
export interface YOLOConfig {
  model_path: string;
  conf_threshold: number;
  iou_threshold: number;
  max_detections: number;
  input_size?: [number, number];
  agnostic_nms?: boolean;
  augment?: boolean;
}

export interface YOLODetectionPlugin extends DetectionPlugin {
  model_type: 'yolo';
  config: YOLOConfig;
  loadModel(modelPath: string, config?: Partial<YOLOConfig>): Promise<void>;
  setConfidenceThreshold(threshold: number): void;
  setIOUThreshold(threshold: number): void;
}

/**
 * Custom Model Detection Plugin
 * Wrapper for ONNX, TensorFlow, PyTorch models
 */
export interface CustomModelConfig {
  model_path: string;
  model_format: 'onnx' | 'tensorflow' | 'pytorch' | 'tflite' | 'coreml';
  input_names: string[];
  output_names: string[];
  input_shape: number[];
  output_shape: number[];
  label_path?: string;
  preprocess?: string;
  postprocess?: string;
}

export interface CustomModelDetectionPlugin extends DetectionPlugin {
  model_type: 'custom';
  config: CustomModelConfig;
  loadModel(modelPath: string, config?: Partial<CustomModelConfig>): Promise<void>;
  getInputNames(): string[];
  getOutputNames(): string[];
}

/**
 * Detection Plugin Manifest
 */
export interface DetectionManifest {
  api_version: string;
  plugin_type: 'detection';
  plugin: DetectionPlugin;
  capabilities: {
    live_detection: boolean;
    batch_processing: boolean;
    model_reloading: boolean;
  };
  models?: string[];
  labels?: string[];
}

/**
 * Protocol Types (JSONL stdin/stdout for external plugins)
 */
export interface DetectionProtocolConfig {
  script_path: string;
  working_dir?: string;
  env?: Record<string, string>;
  timeout_ms?: number;
}

export interface DetectionProtocolFrame {
  event: 'frame';
  frame_id: string;
  camera_id: string;
  frame_path?: string;
  frame_data?: string; // base64 encoded
  timestamp: string;
}

export interface DetectionProtocolCommand {
  command: 'config-update' | 'stop' | 'reload' | 'status';
  config?: Record<string, unknown>;
}

export interface DetectionProtocolResponse {
  event: 'ready' | 'detection' | 'perf_stats' | 'error';
  frame_id?: string;
  camera_id?: string;
  detections?: Detection[];
  model?: string;
  device?: string;
  backend?: string;
  total_frames?: number;
  timings_ms?: {
    preprocess?: number;
    inference?: number;
    postprocess?: number;
    total?: number;
  };
  error?: string;
}

/**
 * Plugin Registry Functions
 */
export interface DetectionPluginRegistry {
  register(plugin: DetectionPlugin): void;
  deregister(pluginId: string): boolean;
  get(pluginId: string): DetectionPlugin | undefined;
  list(): DetectionPlugin[];
  getByModelType(type: DetectionPlugin['model_type']): DetectionPlugin[];
}

/**
 * Factory function for creating YOLO detection plugins
 */
export function createYOLOPlugin(
  pluginId: string,
  name: string,
  config: YOLOConfig
): YOLODetectionPlugin {
  return {
    plugin_id: pluginId,
    name,
    version: '1.0.0',
    model_type: 'yolo' as const,
    config,
    detect(frame: VideoFrame): Detection[] {
      // Implementation in separate module or external process
      const mockDetections: Detection[] = [];
      return mockDetections;
    },
    async detectAsync(frame: VideoFrame): Promise<Detection[]> {
      return this.detect(frame);
    },
    async warmup(): Promise<void> {
      // Warmup inference
    },
    async unload(): Promise<void> {
      // Cleanup model resources
    },
    loadModel(modelPath: string, config?: Partial<YOLOConfig>): Promise<void> {
      this.config = { ...this.config, model_path: modelPath, ...config };
    },
    setConfidenceThreshold(threshold: number): void {
      this.config.conf_threshold = threshold;
    },
    setIOUThreshold(threshold: number): void {
      this.config.iou_threshold = threshold;
    },
  };
}

/**
 * Factory function for creating custom model detection plugins
 */
export function createCustomModelPlugin(
  pluginId: string,
  name: string,
  config: CustomModelConfig
): CustomModelDetectionPlugin {
  return {
    plugin_id: pluginId,
    name,
    version: '1.0.0',
    model_type: 'custom' as const,
    config,
    detect(frame: VideoFrame): Detection[] {
      // Implementation delegates to loaded model
      return [];
    },
    async detectAsync(frame: VideoFrame): Promise<Detection[]> {
      return this.detect(frame);
    },
    async warmup(): Promise<void> {
      // Warmup model
    },
    async unload(): Promise<void> {
      // Cleanup model resources
    },
    loadModel(modelPath: string, config?: Partial<CustomModelConfig>): Promise<void> {
      this.config = { ...this.config, model_path: modelPath, ...config };
    },
    getInputNames(): string[] {
      return this.config.input_names;
    },
    getOutputNames(): string[] {
      return this.config.output_names;
    },
  };
}