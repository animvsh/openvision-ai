/**
 * YOLO Detection Plugin Example
 * Demonstrates how to create a YOLOv11 detection plugin
 */

import type { VideoFrame, Detection } from '../../shared-types/src';
import { createYOLOPlugin, type YOLOConfig } from '../src/plugins/detectionPlugin';

/**
 * Example YOLO detection plugin implementation
 */
class YOLOv11Detector {
  private plugin: ReturnType<typeof createYOLOPlugin>;
  private isLoaded: boolean = false;

  constructor() {
    const config: YOLOConfig = {
      model_path: '/models/yolo11n.onnx',
      conf_threshold: 0.5,
      iou_threshold: 0.4,
      max_detections: 300,
      input_size: [640, 640],
      agnostic_nms: false,
      augment: false,
    };

    this.plugin = createYOLOPlugin('yolo-v11-detector', 'YOLOv11 Object Detector', config);
  }

  /**
   * Initialize the detector with model
   */
  async initialize(): Promise<void> {
    console.log('[YOLOv11Detector] Initializing...');

    // In real implementation, load ONNX model via onnxruntime
    // const session = await onnxruntime.InferenceSession.create(this.plugin.config.model_path);

    this.isLoaded = true;
    await this.plugin.warmup?.();
    console.log('[YOLOv11Detector] Initialized successfully');
  }

  /**
   * Process a video frame and return detections
   */
  detect(frame: VideoFrame): Detection[] {
    if (!this.isLoaded) {
      throw new Error('Detector not initialized');
    }

    // In real implementation:
    // 1. Preprocess frame (resize, normalize, convert BGR→RGB)
    // 2. Run ONNX inference
    // 3. Postprocess (NMS, filter by confidence)
    // 4. Return Detection[]

    // Mock implementation for demo
    return this.plugin.detect(frame);
  }

  /**
   * Async detection for non-blocking processing
   */
  async detectAsync(frame: VideoFrame): Promise<Detection[]> {
    return this.plugin.detectAsync(frame);
  }

  /**
   * Update confidence threshold
   */
  setConfidence(threshold: number): void {
    this.plugin.setConfidenceThreshold(threshold);
  }

  /**
   * Update IOU threshold for NMS
   */
  setIOU(threshold: number): void {
    this.plugin.setIOUThreshold(threshold);
  }

  /**
   * Cleanup resources
   */
  async unload(): Promise<void> {
    await this.plugin.unload?.();
    this.isLoaded = false;
  }
}

// Usage example
async function example() {
  const detector = new YOLOv11Detector();

  await detector.initialize();

  // Simulate frame
  const mockFrame: VideoFrame = {
    data: new Uint8Array(640 * 640 * 3),
    width: 640,
    height: 640,
    timestamp: Date.now(),
    format: 'rgb',
  };

  const detections = detector.detect(mockFrame);
  console.log(`[YOLOv11Detector] Found ${detections.length} objects`);

  await detector.unload();
}

export { YOLOv11Detector };
export default { YOLOv11Detector };