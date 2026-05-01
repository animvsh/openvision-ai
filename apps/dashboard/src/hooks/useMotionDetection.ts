import { useState, useEffect, useRef, useCallback } from 'react'

export interface MotionDetectionResult {
  motionDetected: boolean
  contours: Array<{
    x: number
    y: number
    width: number
    height: number
  }>
  timestamp: number
}

export interface UseMotionDetectionOptions {
  minArea?: number
  blurSize?: { x: number; y: number }
  threshold?: number
  cooldown?: number
  onMotionDetected?: (result: MotionDetectionResult) => void
}

export function useMotionDetection(options: UseMotionDetectionOptions = {}) {
  const {
    minArea = 500,
    blurSize = { x: 21, y: 21 },
    threshold = 25,
    cooldown = 1000,
    onMotionDetected,
  } = options

  const [isActive, setIsActive] = useState(false)
  const [lastMotionTime, setLastMotionTime] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const previousFrameRef = useRef<ImageData | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)

  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx || video.readyState < 2) return

    // Ensure canvas matches video dimensions
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }

    // Draw current frame to canvas
    ctx.drawImage(video, 0, 0)
    const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height)

    if (previousFrameRef.current) {
      const prev = previousFrameRef.current
      const curr = currentFrame

      // Convert to grayscale and compute difference
      const diffData = computeFrameDifference(prev, curr, blurSize, threshold)

      // Find contours in the difference
      const contours = findContours(diffData, minArea)

      const motionDetected = contours.length > 0
      const now = Date.now()

      if (motionDetected && now - lastMotionTime > cooldown) {
        setLastMotionTime(now)
        onMotionDetected?.({
          motionDetected: true,
          contours,
          timestamp: now,
        })
      }

      // Store current frame for next comparison
      previousFrameRef.current = currentFrame
    } else {
      previousFrameRef.current = currentFrame
    }

    if (isActive) {
      animationRef.current = requestAnimationFrame(processFrame)
    }
  }, [blurSize, threshold, minArea, cooldown, lastMotionTime, onMotionDetected, isActive])

  const start = useCallback(() => {
    setIsActive(true)
    setError(null)
  }, [])

  const stop = useCallback(() => {
    setIsActive(false)
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    previousFrameRef.current = null
  }, [])

  const setVideo = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video
  }, [])

  useEffect(() => {
    if (isActive) {
      processFrame()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, processFrame])

  return {
    isActive,
    start,
    stop,
    setVideo,
    canvasRef,
    lastMotionTime,
    error,
  }
}

// Compute frame difference with Gaussian blur
function computeFrameDifference(
  prev: ImageData,
  curr: ImageData,
  blurSize: { x: number; y: number },
  threshold: number
): Uint8Array {
  const width = prev.width
  const height = prev.height
  const diff = new Uint8Array(width * height)

  // Simple Gaussian-like blur using box blur approximation
  const blurX = Math.floor(blurSize.x / 2)
  const blurY = Math.floor(blurSize.y / 2)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let prevSum = 0
      let currSum = 0
      let count = 0

      // Box blur approximation
      for (let dy = -blurY; dy <= blurY; dy++) {
        for (let dx = -blurX; dx <= blurX; dx++) {
          const nx = Math.min(Math.max(x + dx, 0), width - 1)
          const ny = Math.min(Math.max(y + dy, 0), height - 1)
          const idx = (ny * width + nx) * 4

          prevSum += (prev.data[idx] + prev.data[idx + 1] + prev.data[idx + 2]) / 3
          currSum += (curr.data[idx] + curr.data[idx + 1] + curr.data[idx + 2]) / 3
          count++
        }
      }

      const prevGray = prevSum / count
      const currGray = currSum / count

      const diffVal = Math.abs(currGray - prevGray)
      diff[y * width + x] = diffVal > threshold ? 255 : 0
    }
  }

  return diff
}

// Find bounding boxes of significant motion contours
function findContours(diff: Uint8Array, minArea: number): Array<{ x: number; y: number; width: number; height: number }> {
  const width = 640 // Assuming standard width, adjust based on actual video
  const height = Math.floor(diff.length / width)
  const contours: Array<{ x: number; y: number; width: number; height: number }> = []

  // Simple connected component analysis
  const visited = new Set<number>()
  const threshold = minArea / 10

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (diff[idx] > 0 && !visited.has(idx)) {
        // BFS to find connected region
        let minX = x, minY = y, maxX = x, maxY = y
        const queue = [idx]
        let pixelCount = 0

        while (queue.length > 0) {
          const current = queue.shift()!
          if (visited.has(current)) continue
          visited.add(current)

          const cy = Math.floor(current / width)
          const cx = current % width

          minX = Math.min(minX, cx)
          maxX = Math.max(maxX, cx)
          minY = Math.min(minY, cy)
          maxY = Math.max(maxY, cy)
          pixelCount++

          // Check 4-connected neighbors
          const neighbors = [
            current - width,
            current + width,
            current - 1,
            current + 1,
          ]

          for (const n of neighbors) {
            if (n >= 0 && n < diff.length && diff[n] > 0 && !visited.has(n)) {
              queue.push(n)
            }
          }
        }

        if (pixelCount >= threshold) {
          contours.push({
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
          })
        }
      }
    }
  }

  return contours
}

export default useMotionDetection