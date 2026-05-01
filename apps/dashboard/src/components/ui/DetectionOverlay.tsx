interface ObjectDetection {
  class: string
  score: number
  bbox: [number, number, number, number]
}

interface PoseDetection {
  keypoints: Array<{ name: string; x: number; y: number; score: number }>
  score: number
}

interface DetectionOverlayProps {
  objects: ObjectDetection[]
  poses: PoseDetection[]
  showLabels?: boolean
  className?: string
}

const CLASS_COLORS: Record<string, string> = {
  person: '#3b82f6',
  phone: '#ef4444',
  laptop: '#22c55e',
  book: '#eab308',
  default: '#8b5cf6',
}

export function DetectionOverlay({
  objects,
  poses,
  showLabels = true,
  className = '',
}: DetectionOverlayProps) {
  const boxes = objects.map((obj) => ({
    x: obj.bbox[0],
    y: obj.bbox[1],
    width: obj.bbox[2],
    height: obj.bbox[3],
    color: CLASS_COLORS[obj.class.toLowerCase()] || CLASS_COLORS.default,
    label: `${obj.class} ${Math.round(obj.score * 100)}%`,
  }))

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
    >
      {boxes.map((box, i) => (
        <g key={`box-${i}`}>
          <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            fill="none"
            stroke={box.color}
            strokeWidth={8}
            rx={4}
          />
          {showLabels && (
            <g>
              <rect
                x={box.x}
                y={box.y - 16}
                width={box.label.length * 12 + 16}
                height={28}
                fill={box.color}
                rx={4}
              />
              <text
                x={box.x + 8}
                y={box.y + 4}
                fill="white"
                fontSize={20}
                fontFamily="sans-serif"
              >
                {box.label}
              </text>
            </g>
          )}
        </g>
      ))}
    </svg>
  )
}