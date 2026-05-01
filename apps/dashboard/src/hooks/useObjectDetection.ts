import { useState, useEffect, useRef, useCallback } from 'react'
import { ObjectDetection } from './useLiveCamera'

export interface UseObjectDetectionOptions {
  frequency?: number
  minScore?: number
  onObjectDetection?: (objects: ObjectDetection[]) => void
}

export function useObjectDetection(options: UseObjectDetectionOptions = {}) {
  const {
    frequency = 200, // Run detection every 200ms (~5 FPS)
    minScore = 0.5,
    onObjectDetection,
  } = options

  const [objects, setObjects] = useState<ObjectDetection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const modelRef = useRef<unknown>(null)
  const lastDetectionTime = useRef(0)
  const animationFrameRef = useRef<number | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Initialize TensorFlow.js COCO-SSD model
  const initModel = useCallback(async () => {
    if (modelRef.current || isInitialized) return

    setIsLoading(true)
    setError(null)

    try {
      // Dynamically import TensorFlow.js and COCO-SSD to avoid SSR issues
      const [tf, cocoSsd] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@tensorflow-models/coco-ssd'),
      ])

      // Wait for TensorFlow.js to be ready
      await tf.ready()

      // Load COCO-SSD model
      const model = await cocoSsd.load({
        base: 'lite_mobilenet_v2', // Faster model for real-time detection
      })

      modelRef.current = model
      setIsInitialized(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize object detection model'
      setError(message)
      console.error('TensorFlow.js COCO-SSD initialization error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isInitialized])

  // Detect objects in a video frame
  const detect = useCallback(async (video: HTMLVideoElement): Promise<ObjectDetection[]> => {
    if (!modelRef.current) {
      await initModel()
    }

    if (!video || video.readyState < 2) {
      return objects
    }

    const currentTime = Date.now()
    if (currentTime - lastDetectionTime.current < frequency) {
      return objects
    }
    lastDetectionTime.current = currentTime

    try {
      // @ts-expect-error modelRef.current has predict method
      const predictions = await modelRef.current?.detect(video)

      if (!predictions || predictions.length === 0) {
        setObjects([])
        onObjectDetection?.([])
        return []
      }

      // Filter by minimum score and map to our format
      const detectedObjects: ObjectDetection[] = predictions
        .filter((pred: { score: number }) => pred.score >= minScore)
        .map((pred: { class: string; score: number; bbox: [number, number, number, number] }) => ({
          class: pred.class,
          score: pred.score,
          bbox: pred.bbox as [number, number, number, number],
        }))

      setObjects(detectedObjects)
      onObjectDetection?.(detectedObjects)
      return detectedObjects
    } catch (err) {
      console.error('Object detection error:', err)
      return objects
    }
  }, [objects, frequency, minScore, onObjectDetection, initModel])

  // Set video element reference
  const setVideo = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video
  }, [])

  // Start detection loop
  const startDetection = useCallback(() => {
    if (!videoRef.current || animationFrameRef.current) return

    const detectFrame = async () => {
      if (videoRef.current) {
        await detect(videoRef.current)
      }
      animationFrameRef.current = requestAnimationFrame(detectFrame)
    }

    detectFrame()
  }, [detect])

  // Stop detection loop
  const stopDetection = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection()
      if (modelRef.current) {
        // TensorFlow.js models don't have a dispose method in the same way
        // But we can clear references
        modelRef.current = null
      }
    }
  }, [stopDetection])

  // Auto-initialize on mount
  useEffect(() => {
    initModel()
  }, [initModel])

  return {
    objects,
    detect,
    setVideo,
    startDetection,
    stopDetection,
    isLoading,
    isInitialized,
    error,
  }
}

export default useObjectDetection
