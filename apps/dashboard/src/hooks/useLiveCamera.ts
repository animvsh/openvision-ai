import { useState, useRef, useCallback, useEffect } from 'react'

export interface ObjectDetection {
  class: string
  score: number
  bbox: [number, number, number, number]
}

export interface Keypoint {
  name: string
  x: number
  y: number
  score: number
}

export interface PoseDetection {
  keypoints: Keypoint[]
  score: number
}

export interface CameraStream {
  stream: MediaStream | null
  isActive: boolean
  error: string | null
  startCamera: (constraints?: MediaStreamConstraints) => Promise<void>
  stopCamera: () => void
}

export interface LiveDetectionResult {
  objects: ObjectDetection[]
  poses: PoseDetection[]
  timestamp: number
}

interface UseLiveCameraOptions {
  onFrame?: (video: HTMLVideoElement) => void
  onDetection?: (result: LiveDetectionResult) => void
}

export function useLiveCamera(options: UseLiveCameraOptions = {}) {
  const { onFrame, onDetection } = options

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [])

  // Keep streamRef in sync with state
  useEffect(() => {
    streamRef.current = stream
  }, [stream])

  const startCamera = useCallback(async (constraints: MediaStreamConstraints = { video: true, audio: false }) => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      setIsActive(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access camera'
      setError(message)
      throw err
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setStream(null)
    setIsActive(false)
  }, [])

  const attachVideo = useCallback((video: HTMLVideoElement) => {
    videoRef.current = video
    if (stream && video) {
      video.srcObject = stream
    }
  }, [stream])

  const startProcessing = useCallback(() => {
    // Placeholder for actual CV processing
    // In real implementation, this would integrate with TensorFlow models
  }, [])

  const stopProcessing = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  return {
    stream,
    isActive,
    error,
    startCamera,
    stopCamera,
    attachVideo,
    startProcessing,
    stopProcessing,
    calculateAttentionScore: (poses: PoseDetection[]) => {
      if (poses.length === 0) return 0
      const importantKeypoints = ['left_eye', 'right_eye', 'left_ear', 'right_ear', 'nose']
      let totalScore = 0
      let count = 0
      for (const pose of poses) {
        for (const kp of pose.keypoints) {
          if (importantKeypoints.includes(kp.name) && kp.score > 0.3) {
            totalScore += kp.score
            count++
          }
        }
      }
      return count > 0 ? Math.round((totalScore / count) * 100) : 0
    },
  }
}