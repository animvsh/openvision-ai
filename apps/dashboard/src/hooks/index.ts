// Re-export all hooks for easy imports
export { useWebSocket } from './useWebSocket'
export type { WebSocketMessage } from './useWebSocket'

export { useAuth } from './useAuth'
export { useCameras } from './useCameras'
export { useEvents } from './useEvents'
export { useLiveCamera } from './useLiveCamera'
export type { CameraStream, LiveDetectionResult, ObjectDetection, PoseDetection, Keypoint } from './useLiveCamera'

export { useObjectDetection } from './useObjectDetection'
export type { ObjectDetection as ObjectDetectionType } from './useLiveCamera'

export { usePoseDetection } from './usePoseDetection'
export type { PoseDetection as PoseDetectionType, Keypoint as PoseKeypoint } from './usePoseDetection'

export { useMediaPipe } from './useMediaPipe'
export type { FaceDetection, FaceKeypoint } from './useMediaPipe'