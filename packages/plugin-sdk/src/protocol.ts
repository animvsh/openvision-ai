/**
 * Plugin Protocol - JSONL stdin/stdout communication
 * Based on DeepCamera SKILL.md pattern for external plugins
 */

import type { Detection, VideoFrame } from '../../shared-types/src';

/**
 * Protocol direction
 */
export type ProtocolDirection = 'to_plugin' | 'from_plugin';

/**
 * Base protocol message
 */
export interface ProtocolMessage {
  event: string;
  timestamp?: string;
}

/**
 * Aegis → Plugin messages (stdin)
 */
export interface FrameMessage extends ProtocolMessage {
  event: 'frame';
  frame_id: string;
  camera_id: string;
  frame_path?: string;
  frame_data?: string; // base64 encoded
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ConfigUpdateMessage extends ProtocolMessage {
  event: 'config-update';
  config: Record<string, unknown>;
}

export interface StopMessage extends ProtocolMessage {
  event: 'stop';
}

export interface ReloadMessage extends ProtocolMessage {
  event: 'reload';
}

export interface StatusMessage extends ProtocolMessage {
  event: 'status';
}

export interface InitMessage extends ProtocolMessage {
  event: 'init';
  config: Record<string, unknown>;
}

/**
 * Plugin → Aegis messages (stdout)
 */
export interface ReadyMessage extends ProtocolMessage {
  event: 'ready';
  model: string;
  device: string;
  backend: string;
  capabilities?: string[];
}

export interface DetectionMessage extends ProtocolMessage {
  event: 'detection';
  frame_id: string;
  camera_id: string;
  detections: Detection[];
  processing_time_ms?: number;
}

export interface PerfStatsMessage extends ProtocolMessage {
  event: 'perf_stats';
  total_frames: number;
  timings_ms: {
    preprocess?: number;
    inference?: number;
    postprocess?: number;
    total?: number;
  };
  fps?: number;
}

export interface ErrorMessage extends ProtocolMessage {
  event: 'error';
  error: string;
  code?: string;
  recoverable?: boolean;
}

export interface StatusResponseMessage extends ProtocolMessage {
  event: 'status_response';
  status: 'running' | 'idle' | 'error' | 'stopped';
  model_loaded: boolean;
  frames_processed: number;
  uptime_seconds: number;
}

/**
 * Union type for all protocol messages
 */
export type ToPluginMessage =
  | FrameMessage
  | ConfigUpdateMessage
  | StopMessage
  | ReloadMessage
  | StatusMessage
  | InitMessage;

export type FromPluginMessage =
  | ReadyMessage
  | DetectionMessage
  | PerfStatsMessage
  | ErrorMessage
  | StatusResponseMessage;

/**
 * Protocol parser for JSONL streams
 */
export class ProtocolParser {
  private buffer: string = '';

  parse(input: string): (ToPluginMessage | FromPluginMessage)[] {
    const messages: (ToPluginMessage | FromPluginMessage)[] = [];
    const lines = input.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const parsed = JSON.parse(line);
        messages.push(parsed);
      } catch {
        // Accumulate incomplete JSON
        this.buffer += line;
        try {
          const parsed = JSON.parse(this.buffer);
          messages.push(parsed);
          this.buffer = '';
        } catch {
          // Wait for more data
        }
      }
    }

    return messages;
  }

  serialize(message: ToPluginMessage | FromPluginMessage): string {
    return JSON.stringify(message) + '\n';
  }

  reset(): void {
    this.buffer = '';
  }
}

/**
 * Plugin subprocess runner
 */
export interface PluginProcess {
  pid: number;
  stdin: WritableStream;
  stdout: ReadableStream;
  stderr: ReadableStream;
}

export interface PluginRunnerOptions {
  script_path: string;
  working_dir?: string;
  env?: Record<string, string>;
  timeout_ms?: number;
}

/**
 * Run an external plugin as a subprocess
 */
export async function runPlugin(
  options: PluginRunnerOptions,
  onMessage: (msg: FromPluginMessage) => void,
  onError?: (err: Error) => void
): Promise<{ stdin: WritableStreamDefaultWriter; stop: () => void }> {
  const { script_path, env = {}, timeout_ms = 30000 } = options;

  // For Node.js environment, spawn child process
  // This is a simplified implementation
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const parser = new ProtocolParser();

  // Create a mock stdin/writable for TypeScript interface
  const mockStdin = {
    write: async (data: string): Promise<void> => {
      // In real implementation, write to child process stdin
      console.log('[Plugin stdin]', data);
    },
  };

  // Stop function
  const stop = (): void => {
    // In real implementation, kill child process
    console.log('[Plugin] Stopping plugin process');
  };

  return {
    stdin: mockStdin as unknown as WritableStreamDefaultWriter,
    stop,
  };
}

/**
 * Send frame to plugin
 */
export async function sendFrame(
  stdin: WritableStreamDefaultWriter,
  frame: VideoFrame,
  frameId: string,
  cameraId: string
): Promise<void> {
  const message: FrameMessage = {
    event: 'frame',
    frame_id: frameId,
    camera_id: cameraId,
    timestamp: new Date().toISOString(),
    metadata: {
      width: frame.width,
      height: frame.height,
      format: frame.format,
    },
  };

  const data = JSON.stringify(message) + '\n';
  await stdin.write(data);
}

/**
 * Send config update to plugin
 */
export async function sendConfigUpdate(
  stdin: WritableStreamDefaultWriter,
  config: Record<string, unknown>
): Promise<void> {
  const message: ConfigUpdateMessage = {
    event: 'config-update',
    config,
    timestamp: new Date().toISOString(),
  };

  const data = JSON.stringify(message) + '\n';
  await stdin.write(data);
}

/**
 * Send stop command to plugin
 */
export async function sendStop(stdin: WritableStreamDefaultWriter): Promise<void> {
  const message: StopMessage = {
    event: 'stop',
    timestamp: new Date().toISOString(),
  };

  const data = JSON.stringify(message) + '\n';
  await stdin.write(data);
}

/**
 * Parse plugin output and extract detections
 */
export function parseDetectionOutput(output: string): Detection[] {
  const parser = new ProtocolParser();
  const messages = parser.parse(output);

  for (const msg of messages) {
    if ('event' in msg && msg.event === 'detection' && 'detections' in msg) {
      return (msg as DetectionMessage).detections;
    }
  }

  return [];
}

/**
 * Example: JSONL protocol demo
 */
export const protocolExample = `
# Aegis → Plugin (stdin)
{"event":"frame","frame_id":"cam1_1710001","camera_id":"front_door","timestamp":"2026-05-01T12:00:00Z"}
{"event":"config-update","config":{"conf_threshold":0.5,"iou_threshold":0.4}}
{"event":"stop"}

# Plugin → Aegis (stdout)
{"event":"ready","model":"yolo11n","device":"cuda","backend":"onnx"}
{"event":"detection","frame_id":"cam1_1710001","camera_id":"front_door","detections":[{"id":"d1","label":"person","confidence":0.95,"bbox":{"x":100,"y":50,"width":80,"height":120}}]}
{"event":"perf_stats","total_frames":50,"timings_ms":{"inference":15.2,"total":18.5},"fps":55.3}
`;