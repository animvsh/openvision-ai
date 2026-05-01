import { useEffect, useRef, useState, useCallback } from 'react'
import { ObjectDetection } from '@/hooks/useLiveCamera'
import { YOLODetection, PPEDetection, detectPPECompliance, detectProximity, ProximityAlert } from '@/hooks/useYOLO26'
import { Zone, ZoneViolation, renderZoneOverlay } from '@/hooks/useZoneMonitoring'

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
  yoloDetections?: YOLODetection[]
  ppeDetections?: PPEDetection[]
  proximityAlerts?: ProximityAlert[]
  zones?: Zone[]
  zoneViolations?: ZoneViolation[]
  showFps?: boolean
  fps?: number
}

// Color scheme for different detection types
const DETECTION_COLORS = {
  face: '#00ffff',
  person: '#22c55e',
  phone: '#ef4444',
  hardhat: '#eab308',    // Yellow for hardhat
  safetyVest: '#22c55e', // Green for safety vest
  mask: '#3b82f6',       // Blue for mask
  noHardhat: '#ef4444',  // Red for no hardhat violation
  noSafetyVest: '#dc2626', // Dark red for no vest violation
  noMask: '#f97316',     // Orange for no mask violation
  machinery: '#8b5cf6',  // Purple for machinery
  vehicle: '#6366f1',    // Indigo for vehicles
  compliant: '#22c55e',  // Green for compliant PPE
  violation: '#ef4444',  // Red for PPE violation
  proximity: '#ff6b6b',  // Coral for proximity warning
  default: '#a855f7',
  exclusionZone: 'rgba(255, 0, 0, 0.2)',
  inclusionZone: 'rgba(0, 255, 0, 0.2)',
}

function getDetectionColor(className: string): string {
  const lowerClass = className.toLowerCase()
  if (lowerClass === 'person') return DETECTION_COLORS.person
  if (lowerClass.includes('phone')) return DETECTION_COLORS.phone
  if (lowerClass.includes('face')) return DETECTION_COLORS.face
  if (lowerClass.includes('hardhat') && !lowerClass.includes('no')) return DETECTION_COLORS.hardhat
  if (lowerClass.includes('vest')) return DETECTION_COLORS.safetyVest
  if (lowerClass.includes('mask')) return DETECTION_COLORS.mask
  if (lowerClass.includes('no-hardhat')) return DETECTION_COLORS.noHardhat
  if (lowerClass.includes('no-safety-vest')) return DETECTION_COLORS.noSafetyVest
  if (lowerClass.includes('no-mask')) return DETECTION_COLORS.noMask
  if (lowerClass.includes('machinery')) return DETECTION_COLORS.machinery
  if (lowerClass.includes('vehicle')) return DETECTION_COLORS.vehicle
  return DETECTION_COLORS.default
}

export function VideoPlayer({
  stream,
  isLive,
  faceDetections = [],
  objectDetections = [],
  yoloDetections = [],
  ppeDetections = [],
  proximityAlerts = [],
  zones = [],
  zoneViolations = [],
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
        canvas.width = video.videoWidth || video.clientWidth
        canvas.height = video.videoHeight || video.clientHeight
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw zone overlays first (behind detections)
        if (zones.length > 0) {
          renderZoneOverlay(ctx, zones, canvas.width, canvas.height, zoneViolations)
        }

        // Draw face detections with neon cyan glow
        for (const face of faceDetections) {
          const box = face.boundingBox
          const x = box.x * canvas.width
          const y = box.y * canvas.height
          const width = box.width * canvas.width
          const height = box.height * canvas.height

          ctx.shadowColor = DETECTION_COLORS.face
          ctx.shadowBlur = 15
          ctx.strokeStyle = DETECTION_COLORS.face
          ctx.lineWidth = 2
          ctx.strokeRect(x, y, width, height)

          ctx.shadowBlur = 8
          ctx.fillStyle = DETECTION_COLORS.face
          ctx.font = 'bold 12px sans-serif'
          ctx.fillText(
            `Face ${Math.round(face.score * 100)}%`,
            x,
            y > 20 ? y - 8 : y + height + 16
          )
          ctx.shadowBlur = 0
        }

        // Draw object detections with colored neon glow
        for (const detection of objectDetections) {
          const [x, y, width, height] = detection.bbox
          const color = getDetectionColor(detection.class)

          ctx.shadowColor = color
          ctx.shadowBlur = 15
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.strokeRect(x, y, width, height)

          ctx.fillStyle = `${color}20`
          ctx.fillRect(x, y, width, height)

          ctx.shadowBlur = 8
          ctx.fillStyle = color
          ctx.font = 'bold 12px sans-serif'
          ctx.fillText(
            `${detection.class} ${Math.round(detection.score * 100)}%`,
            x,
            y > 20 ? y - 8 : y + height + 16
          )

          drawCorners(ctx, x, y, width, height, color, 5)
          ctx.shadowBlur = 0
        }

        // Draw YOLO/PPE detections with compliance coloring
        for (const detection of yoloDetections) {
          const [x, y, width, height] = detection.bbox
          const color = getDetectionColor(detection.class)

          ctx.shadowColor = color
          ctx.shadowBlur = 15
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.strokeRect(x, y, width, height)

          ctx.fillStyle = `${color}20`
          ctx.fillRect(x, y, width, height)

          ctx.shadowBlur = 8
          ctx.fillStyle = color
          ctx.font = 'bold 12px sans-serif'
          ctx.fillText(
            `${detection.class} ${Math.round(detection.score * 100)}%`,
            x,
            y > 20 ? y - 8 : y + height + 16
          )

          drawCorners(ctx, x, y, width, height, color, 10)
          ctx.shadowBlur = 0
        }

        // Draw PPE detections with compliance/violation coloring
        for (const detection of ppeDetections) {
          const [x, y, width, height] = detection.bbox
          const color = detection.isCompliant
            ? DETECTION_COLORS.compliant
            : DETECTION_COLORS.violation

          ctx.shadowColor = color
          ctx.shadowBlur = 20
          ctx.strokeStyle = color
          ctx.lineWidth = 3
          ctx.strokeRect(x, y, width, height)

          // Thicker fill for PPE visibility
          ctx.fillStyle = `${color}30`
          ctx.fillRect(x, y, width, height)

          ctx.shadowBlur = 10
          ctx.fillStyle = color
          ctx.font = 'bold 14px sans-serif'

          const label = detection.isCompliant
            ? `PPE OK ${Math.round(detection.score * 100)}%`
            : `PPE VIOLATION ${detection.violations.join(', ')}`

          ctx.fillText(label, x, y > 30 ? y - 10 : y + height + 20)

          drawCorners(ctx, x, y, width, height, color, 15)
          ctx.shadowBlur = 0
        }

        // Draw proximity alerts with warning indicators
        for (const alert of proximityAlerts) {
          const [px, py, pw, ph] = alert.person.bbox
          const [hx, hy, hw, hh] = alert.hazard.bbox

          // Draw warning line between person and hazard
          const personCenterX = px + pw / 2
          const personCenterY = py + ph / 2
          const hazardCenterX = hx + hw / 2
          const hazardCenterY = hy + hh / 2

          ctx.shadowColor = DETECTION_COLORS.proximity
          ctx.shadowBlur = 20
          ctx.strokeStyle = DETECTION_COLORS.proximity
          ctx.lineWidth = 4
          ctx.setLineDash([10, 5])
          ctx.beginPath()
          ctx.moveTo(personCenterX, personCenterY)
          ctx.lineTo(hazardCenterX, hazardCenterY)
          ctx.stroke()
          ctx.setLineDash([])

          // Draw warning icon at person location
          const warningX = px + pw / 2
          const warningY = py - 30

          ctx.fillStyle = DETECTION_COLORS.proximity
          ctx.font = 'bold 16px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('⚠ PROXIMITY', warningX, warningY)

          ctx.fillStyle = DETECTION_COLORS.proximity
          ctx.font = '12px sans-serif'
          ctx.fillText(`${alert.type.toUpperCase()} DETECTED`, warningX, warningY + 15)
          ctx.textAlign = 'left'
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
  }, [
    faceDetections,
    objectDetections,
    yoloDetections,
    ppeDetections,
    proximityAlerts,
    zones,
    zoneViolations,
    isLive,
  ])

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
      {zoneViolations.length > 0 && isLive && (
        <div className="absolute bottom-2 left-2 bg-red-600/80 text-white text-xs px-2 py-1 rounded">
          {zoneViolations.length} Zone Violation{zoneViolations.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

// Helper function to draw styled corners on detection boxes
function drawCorners(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  cornerLength: number
) {
  ctx.lineWidth = 3
  ctx.shadowBlur = 5

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
}

export default VideoPlayer