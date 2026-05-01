import { useState, useEffect, useRef, useCallback } from 'react'

export interface FaceKeypoint {
  x: number
  y: number
  z: number
  name: string
}

export interface FaceDetection {
  id: number
  score: number
  keypoints: FaceKeypoint[]
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface UseMediaPipeOptions {
  frequency?: number
  minDetectionConfidence?: number
  minTrackingConfidence?: number
  maxFaces?: number
  onFaceDetection?: (faces: FaceDetection[]) => void
}

export function useMediaPipe(options: UseMediaPipeOptions = {}) {
  const {
    frequency = 100,
    minDetectionConfidence = 0.5,
    minTrackingConfidence = 0.5,
    maxFaces = 4,
    onFaceDetection,
  } = options

  const [faces, setFaces] = useState<FaceDetection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const faceMeshRef = useRef<unknown>(null)
  const lastDetectionTime = useRef(0)

  const initFaceMesh = useCallback(async () => {
    if (faceMeshRef.current || isInitialized) return

    setIsLoading(true)
    setError(null)

    try {
      // Dynamic import to avoid SSR issues
      const [{ FaceMesh }, { Camera }] = await Promise.all([
        import('@mediapipe/face_mesh'),
        import('@mediapipe/camera_utils'),
      ])

      const faceMesh = new FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
      })

      faceMesh.setOptions({
        maxNumFaces: maxFaces,
        refineLandmarks: true,
        minDetectionConfidence: minDetectionConfidence,
        minTrackingConfidence: minTrackingConfidence,
      })

      faceMesh.onResults((results: { multiFaceLandmarks?: Array<Array<{ x: number; y: number; z: number }>>; multiFaceGeometry?: Array<unknown> }) => {
        const currentTime = Date.now()
        if (currentTime - lastDetectionTime.current < frequency) return
        lastDetectionTime.current = currentTime

        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
          setFaces([])
          onFaceDetection?.([])
          return
        }

        const detectedFaces: FaceDetection[] = results.multiFaceLandmarks.map(
          (landmarks, index) => {
            // Calculate bounding box from keypoints
            const xValues = landmarks.map((lp) => lp.x)
            const yValues = landmarks.map((lp) => lp.y)
            const minX = Math.min(...xValues)
            const minY = Math.min(...yValues)
            const maxX = Math.max(...xValues)
            const maxY = Math.max(...yValues)

            // Map MediaPipe keypoint indices to names
            const keypointNames = [
              'nose_tip', 'left_eye_inner', 'left_eye', 'left_eye_outer',
              'right_eye_inner', 'right_eye', 'right_eye_outer',
              'left_eyebrow', 'right_eyebrow', 'mouth_left', 'mouth_right',
              'left_ear', 'right_ear',
            ]

            const keypoints: FaceKeypoint[] = landmarks.map((landmark, idx) => ({
              x: landmark.x,
              y: landmark.y,
              z: landmark.z || 0,
              name: `landmark_${idx}`,
            }))

            return {
              id: index,
              score: 1.0, // MediaPipe doesn't provide per-face confidence
              keypoints,
              boundingBox: {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY,
              },
            }
          }
        )

        setFaces(detectedFaces)
        onFaceDetection?.(detectedFaces)
      })

      faceMeshRef.current = faceMesh
      setIsInitialized(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize Face Mesh'
      setError(message)
      console.error('MediaPipe Face Mesh initialization error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [frequency, maxFaces, minDetectionConfidence, minTrackingConfidence, onFaceDetection, isInitialized])

  const detect = useCallback(async (video: HTMLVideoElement): Promise<FaceDetection[]> => {
    if (!faceMeshRef.current) {
      await initFaceMesh()
    }

    if (!video || video.readyState < 2) {
      return faces
    }

    try {
      // @ts-expect-error faceMeshRef.current has send method
      faceMeshRef.current?.send({ image: video })
    } catch (err) {
      console.error('Face detection error:', err)
    }

    return faces
  }, [faces, initFaceMesh])

  const calculateFaceAttentionScore = useCallback((face: FaceDetection): number => {
    // Calculate attention based on face centering and completeness
    const centerX = face.boundingBox.x + face.boundingBox.width / 2
    const centerY = face.boundingBox.y + face.boundingBox.height / 2

    // Ideal center is at 0.5, 0.5 (middle of frame)
    const distanceFromCenter = Math.sqrt(
      Math.pow(centerX - 0.5, 2) + Math.pow(centerY - 0.5, 2)
    )

    // Score based on proximity to center (closer = higher score)
    const centerScore = 1 - Math.min(distanceFromCenter * 2, 1)

    // Size score (larger face = more present = higher score)
    const sizeScore = Math.min(
      (face.boundingBox.width * face.boundingBox.height) / 0.5,
      1
    )

    return (centerScore * 0.4 + sizeScore * 0.6) * face.score
  }, [])

  const cleanup = useCallback(() => {
    if (faceMeshRef.current) {
      // @ts-expect-error faceMesh has close method
      faceMeshRef.current?.close()
      faceMeshRef.current = null
      setIsInitialized(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    faces,
    detect,
    isLoading,
    isInitialized,
    error,
    initFaceMesh,
    calculateFaceAttentionScore,
    cleanup,
  }
}

export default useMediaPipe