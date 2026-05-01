import { useState, useEffect, useRef, useCallback } from 'react'

export interface YOLODetection {
  class: string
  score: number
  bbox: [number, number, number, number] // [x, y, width, height] in pixels
}

export interface PPEDetection extends YOLODetection {
  isCompliant: boolean
  violations: string[]
}

export interface UseYOLO26Options {
  frequency?: number
  minScore?: number
  classes?: string[]
  onDetection?: (detections: YOLODetection[]) => void
}

const DEFAULT_CLASSES = [
  'person', 'hardhat', 'mask', 'no-hardhat', 'no-mask', 'no-safety-vest',
  'safety-vest', 'safety-cone', 'machinery', 'vehicle'
]

export function useYOLO26(options: UseYOLO26Options = {}) {
  const {
    frequency = 200,
    minScore = 0.5,
    classes = DEFAULT_CLASSES,
    onDetection,
  } = options

  const [detections, setDetections] = useState<YOLODetection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const modelRef = useRef<unknown>(null)
  const lastDetectionTime = useRef(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const initModel = useCallback(async () => {
    if (modelRef.current || isInitialized) return

    setIsLoading(true)
    setError(null)

    try {
      // Dynamic imports for browser-compatible YOLO implementation
      const [tf, cocoSsd] = await Promise.all([
        import('@tensorflow/tfjs'),
        import('@tensorflow-models/coco-ssd'),
      ])

      await tf.ready()

      // Load COCO-SSD model (placeholder for YOLO26 - would need custom YOLO model)
      // In production, replace with YOLO26 model loading
      const model = await cocoSsd.load({
        base: 'lite_mobilenet_v2',
      })

      modelRef.current = model
      setIsInitialized(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize YOLO26 model'
      setError(message)
      console.error('YOLO26 initialization error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isInitialized])

  const detect = useCallback(async (video: HTMLVideoElement): Promise<YOLODetection[]> => {
    if (!modelRef.current) {
      await initModel()
    }

    if (!video || video.readyState < 2) {
      return detections
    }

    const currentTime = Date.now()
    if (currentTime - lastDetectionTime.current < frequency) {
      return detections
    }
    lastDetectionTime.current = currentTime

    try {
      // @ts-expect-error model has predict method
      const predictions = await modelRef.current?.predict(video)

      if (!predictions || predictions.length === 0) {
        setDetections([])
        onDetection?.([])
        return []
      }

      const detectedObjects: YOLODetection[] = predictions
        .filter((pred: { score: number; class: string }) => pred.score >= minScore)
        .filter((pred: { class: string }) => classes.some(c => pred.class.toLowerCase().includes(c)))
        .map((pred: { class: string; score: number; bbox: [number, number, number, number] }) => ({
          class: pred.class,
          score: pred.score,
          bbox: pred.bbox as [number, number, number, number],
        }))

      setDetections(detectedObjects)
      onDetection?.(detectedObjects)
      return detectedObjects
    } catch (err) {
      console.error('YOLO26 detection error:', err)
      return detections
    }
  }, [detections, frequency, minScore, classes, onDetection, initModel])

  const setVideo = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video
  }, [])

  useEffect(() => {
    initModel()
  }, [initModel])

  useEffect(() => {
    return () => {
      modelRef.current = null
    }
  }, [])

  return {
    detections,
    detect,
    setVideo,
    isLoading,
    isInitialized,
    error,
  }
}

// PPE Detection function that analyzes detections for safety compliance
export function detectPPECompliance(detections: YOLODetection[]): PPEDetection[] {
  const ppeResults: PPEDetection[] = []

  // Group detections by type
  const persons = detections.filter(d => d.class.toLowerCase() === 'person')
  const hardhats = detections.filter(d => d.class.toLowerCase().includes('hardhat'))
  const vests = detections.filter(d => d.class.toLowerCase().includes('vest'))
  const masks = detections.filter(d => d.class.toLowerCase().includes('mask'))

  for (const person of persons) {
    const violations: string[] = []
    let hasHardhat = false
    let hasVest = false
    let hasMask = false

    const [px, py, pw, ph] = person.bbox

    // Check if PPE items are inside the person's bounding box
    for (const hardhat of hardhats) {
      const [hx, hy, hw, hh] = hardhat.bbox
      if (hx >= px && hy >= py && hx + hw <= px + pw && hy + hh <= py + ph) {
        hasHardhat = true
      }
    }

    for (const vest of vests) {
      const [vx, vy, vw, vh] = vest.bbox
      if (vx >= px && vy >= py && vx + vw <= px + pw && vy + vh <= py + ph) {
        hasVest = true
      }
    }

    for (const mask of masks) {
      const [mx, my, mw, mh] = mask.bbox
      if (mx >= px && my >= py && mx + mw <= px + pw && my + mh <= py + ph) {
        hasMask = true
      }
    }

    // Determine compliance
    const isCompliant = hasHardhat && hasVest && hasMask

    if (!hasHardhat) violations.push('no-hardhat')
    if (!hasVest) violations.push('no-safety-vest')
    if (!hasMask) violations.push('no-mask')

    ppeResults.push({
      ...person,
      isCompliant,
      violations,
    })
  }

  return ppeResults
}

// Proximity detection between persons and machinery/vehicles
export interface ProximityAlert {
  person: YOLODetection
  hazard: YOLODetection
  type: 'machinery' | 'vehicle'
}

export function detectProximity(
  detections: YOLODetection[],
  options: { checkMachinery?: boolean; checkVehicles?: boolean } = {}
): ProximityAlert[] {
  const { checkMachinery = true, checkVehicles = true } = options
  const alerts: ProximityAlert[] = []

  const persons = detections.filter(d => d.class.toLowerCase() === 'person')
  const hazards = detections.filter(d => {
    if (checkMachinery && d.class.toLowerCase() === 'machinery') return true
    if (checkVehicles && d.class.toLowerCase() === 'vehicle') return true
    return false
  })

  for (const person of persons) {
    const [px, py, pw, ph] = person.bbox

    for (const hazard of hazards) {
      const [hx, hy, hw, hh] = hazard.bbox

      // Check for bounding box overlap
      if (hx < px + pw && hx + hw > px && hy < py + ph && hy + hh > py) {
        alerts.push({
          person,
          hazard,
          type: hazard.class.toLowerCase() as 'machinery' | 'vehicle',
        })
      }
    }
  }

  return alerts
}

export default useYOLO26