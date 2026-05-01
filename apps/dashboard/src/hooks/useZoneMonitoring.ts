import { useCallback, useMemo } from 'react'

export interface ZonePoint {
  x: number
  y: number
}

export interface Zone {
  id: string
  name: string
  points: ZonePoint[]
  type: 'exclusion' | 'inclusion'
  maxAllowed?: number
  color?: string
}

export interface DetectionBox {
  x: number
  y: number
  width: number
  height: number
}

export interface ZoneViolation {
  zoneId: string
  zoneName: string
  detectedCount: number
  maxAllowed: number
  type: 'exclusion' | 'inclusion'
}

export interface UseZoneMonitoringOptions {
  zones: Zone[]
  onViolation?: (violations: ZoneViolation[]) => void
}

// Point-in-polygon test using ray casting algorithm
function pointInPolygon(x: number, y: number, polygon: ZonePoint[]): boolean {
  let inside = false
  const n = polygon.length

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }

  return inside
}

// Check if two rectangles overlap
function boxesOverlap(
  box1: DetectionBox,
  box2: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    box1.x < box2.x + box2.width &&
    box1.x + box1.width > box2.x &&
    box1.y < box2.y + box2.height &&
    box1.y + box1.height > box2.y
  )
}

// Check if a detection box intersects with a polygon zone
function boxIntersectsPolygon(box: DetectionBox, polygon: ZonePoint[]): boolean {
  // Check if box corners are inside polygon
  const corners = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height },
  ]

  for (const corner of corners) {
    if (pointInPolygon(corner.x, corner.y, polygon)) {
      return true
    }
  }

  // Check if polygon center is inside box
  const boxCenterX = box.x + box.width / 2
  const boxCenterY = box.y + box.height / 2
  if (pointInPolygon(boxCenterX, boxCenterY, polygon)) {
    return true
  }

  return false
}

export function useZoneMonitoring(options: UseZoneMonitoringOptions) {
  const { zones, onViolation } = options

  const checkZones = useCallback(
    (detections: Array<{ class: string; bbox: [number, number, number, number] }>): ZoneViolation[] => {
      const violations: ZoneViolation[] = []

      for (const zone of zones) {
        // Count detections in this zone
        let countInZone = 0
        const countedIds = new Set<string>()

        for (const detection of detections) {
          const [x, y, width, height] = detection.bbox
          const box: DetectionBox = { x, y, width, height }

          if (boxIntersectsPolygon(box, zone.points)) {
            // Only count each unique detection once per zone
            const detectionId = `${detection.class}-${x}-${y}`
            if (!countedIds.has(detectionId)) {
              countedIds.add(detectionId)

              // Filter by class type based on zone configuration
              const classLower = detection.class.toLowerCase()
              const isPerson = classLower === 'person'
              const isMachinery = classLower === 'machinery'
              const isVehicle = classLower === 'vehicle'

              if (
                (zone.type === 'exclusion' && (isPerson || isMachinery || isVehicle)) ||
                (zone.type === 'inclusion' && (isPerson || isMachinery || isVehicle))
              ) {
                countInZone++
              }
            }
          }
        }

        const maxAllowed = zone.maxAllowed ?? 0

        // Determine violation based on zone type
        let isViolation = false
        if (zone.type === 'exclusion') {
          // Exclusion zone: violation if count exceeds maxAllowed
          isViolation = maxAllowed > 0 && countInZone > maxAllowed
        } else {
          // Inclusion zone: violation if count is below maxAllowed (not enough people)
          isViolation = maxAllowed > 0 && countInZone < maxAllowed
        }

        if (isViolation) {
          violations.push({
            zoneId: zone.id,
            zoneName: zone.name,
            detectedCount: countInZone,
            maxAllowed,
            type: zone.type,
          })
        }
      }

      if (violations.length > 0) {
        onViolation?.(violations)
      }

      return violations
    },
    [zones, onViolation]
  )

  // Generate SVG path for zone polygon
  const getZonePath = useCallback(
    (zone: Zone, width: number, height: number): string => {
      if (zone.points.length === 0) return ''

      const points = zone.points
      const pathParts = points.map((point, idx) => {
        const x = point.x * width
        const y = point.y * height
        return idx === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
      })

      return pathParts.join(' ') + ' Z'
    },
    []
  )

  return {
    checkZones,
    getZonePath,
  }
}

// Render zone overlay on canvas
export function renderZoneOverlay(
  ctx: CanvasRenderingContext2D,
  zones: Zone[],
  canvasWidth: number,
  canvasHeight: number,
  violations: ZoneViolation[]
): void {
  const violationZoneIds = new Set(violations.map(v => v.zoneId))

  for (const zone of zones) {
    if (zone.points.length === 0) continue

    const isViolation = violationZoneIds.has(zone.id)
    const baseColor = zone.type === 'exclusion' ? [255, 0, 0] : [0, 255, 0]
    const color = isViolation ? `rgba(255, 0, 0, 0.3)` : `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 0.2)`
    const strokeColor = isViolation ? 'rgba(255, 0, 0, 0.8)' : `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 0.6)`

    // Draw filled polygon
    ctx.beginPath()
    ctx.moveTo(zone.points[0].x * canvasWidth, zone.points[0].y * canvasHeight)
    for (let i = 1; i < zone.points.length; i++) {
      ctx.lineTo(zone.points[i].x * canvasWidth, zone.points[i].y * canvasHeight)
    }
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()

    // Draw polygon outline
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw zone label
    const centroid = zone.points.reduce(
      (acc, point) => ({
        x: acc.x + point.x / zone.points.length,
        y: acc.y + point.y / zone.points.length,
      }),
      { x: 0, y: 0 }
    )

    const labelX = centroid.x * canvasWidth
    const labelY = centroid.y * canvasHeight

    ctx.fillStyle = strokeColor
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(
      zone.name,
      labelX,
      labelY - 10
    )

    if (zone.maxAllowed !== undefined) {
      ctx.font = '10px sans-serif'
      ctx.fillText(
        `Max: ${zone.maxAllowed}`,
        labelX,
        labelY + 5
      )
    }
  }
}

export default useZoneMonitoring