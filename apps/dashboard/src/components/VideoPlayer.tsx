import { useEffect, useRef } from 'react'
import { ObjectDetection } from '@/hooks/useLiveCamera'

interface FaceDetection {
  id: number
  score: number
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface VideoPlayerProps {
  stream: MediaStream | null
  isLive: boolean
  faceDetections?: FaceDetection[]
  objectDetections?: ObjectDetection[]
  showFps?: boolean
  fps?: number
}

// Color scheme for different detection types
const DETECTION_COLORS = {
  face: '#00ffff', // Cyan for faces
  person: '#22c55e', // Green for people
  phone: '#ef4444', // Red for phones
  default: '#a855f7', // Purple for other objects
}

// Get color for object class
function getDetectionColor(className: string): string {
  const lowerClass = className.toLowerCase()
  if (lowerClass === 'person') return DETECTION_COLORS.person
  if (lowerClass.includes('phone')) return DETECTION_COLORS.phone
  if (lowerClass.includes('face')) return DETECTION_COLORS.face
  return DETECTION_COLORS.default
}

export function VideoPlayer({
  stream,
  isLive,
  faceDetections = [],
  objectDetections = [],
  showFps = false,
  fps = 0,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return

    video.srcObject = stream

    return () => {
      // Clean up MediaStream when component unmounts or stream changes
      if (video.srcObject) {
        const tracks = (video.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
        video.srcObject = null
      }
    }
  }, [stream])

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number

    const draw = () => {
      if (video.readyState >= 2) {
        // Update canvas size to match video
        canvas.width = video.videoWidth || video.clientWidth
        canvas.height = video.videoHeight || video.clientHeight
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw face detections with neon cyan glow
        for (const face of faceDetections) {
          const box = face.boundingBox
          const x = box.x * canvas.width
          const y = box.y * canvas.height
          const width = box.width * canvas.width
          const height = box.height * canvas.height

          // Glow effect using shadow blur
          ctx.shadowColor = DETECTION_COLORS.face
          ctx.shadowBlur = 15
          ctx.strokeStyle = DETECTION_COLORS.face
          ctx.lineWidth = 2
          ctx.strokeRect(x, y, width, height)

          // Draw face label
          ctx.shadowBlur = 8
          ctx.fillStyle = DETECTION_COLORS.face
          ctx.font = 'bold 12px sans-serif'
          ctx.fillText(
            `Face ${Math.round(face.score * 100)}%`,
            x,
            y > 20 ? y - 8 : y + height + 16
          )

          // Reset shadow for next draw
          ctx.shadowBlur = 0
        }

        // Draw object detections with colored neon glow
        for (const detection of objectDetections) {
          const [x, y, width, height] = detection.bbox
          const color = getDetectionColor(detection.class)

          // Glow effect using shadow blur
          ctx.shadowColor = color
          ctx.shadowBlur = 15
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.strokeRect(x, y, width, height)

          // Draw box fill with transparency
          ctx.fillStyle = `${color}20`
          ctx.fillRect(x, y, width, height)

          // Draw label with glow
          ctx.shadowBlur = 8
          ctx.fillStyle = color
          ctx.font = 'bold 12px sans-serif'
          ctx.fillText(
            `${detection.class} ${Math.round(detection.score * 100)}%`,
            x,
            y > 20 ? y - 8 : y + height + 16
          )

          // Draw corner accents for a more styled look
          ctx.shadowBlur = 5
          const cornerLength = 10
          ctx.lineWidth = 3

          // Top-left corner
          ctx.beginPath()
          ctx.moveTo(x, y + cornerLength)
          ctx.lineTo(x, y)
          ctx.lineTo(x + cornerLength, y)
          ctx.stroke()

          // Top-right corner
          ctx.beginPath()
          ctx.moveTo(x + width - cornerLength, y)
          ctx.lineTo(x + width, y)
          ctx.lineTo(x + width, y + cornerLength)
          ctx.stroke()

          // Bottom-left corner
          ctx.beginPath()
          ctx.moveTo(x, y + height - cornerLength)
          ctx.lineTo(x, y + height)
          ctx.lineTo(x + cornerLength, y + height)
          ctx.stroke()

          // Bottom-right corner
          ctx.beginPath()
          ctx.moveTo(x + width - cornerLength, y + height)
          ctx.lineTo(x + width, y + height)
          ctx.lineTo(x + width, y + height - cornerLength)
          ctx.stroke()

          // Reset shadow for next draw
          ctx.shadowBlur = 0
        }
      }
      animationId = requestAnimationFrame(draw)
    }

    if (isLive) {
      draw()
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [faceDetections, objectDetections, isLive])

  return (
    <div className="relative bg-black aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain"
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />
      {showFps && isLive && (
        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-mono">
          {fps} FPS
        </div>
      )}
      {isLive && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      )}
    </div>
  )
}

export default VideoPlayer
