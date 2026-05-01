// Pose Detection hook (placeholder - uses MediaPipe in real implementation)
import { PoseDetection, Keypoint } from './useLiveCamera'

export type { PoseDetection, Keypoint }

export function usePoseDetection(options?: { frequency?: number }) {
  // Placeholder for pose detection
  return {
    detect: async () => [] as PoseDetection[],
    calculateAttentionScore: (poses: PoseDetection[]) => 0,
    isLoading: false,
    error: null,
  }
}