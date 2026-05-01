import { useEffect, useRef, useState } from 'react'

interface ScoreGaugeProps {
  score: number
  size?: number
}

export function ScoreGauge({ score, size = 200 }: ScoreGaugeProps) {
  const radius = (size - 20) / 2
  const circumference = radius * 2 * Math.PI
  const [displayScore, setDisplayScore] = useState(0)
  const animationRef = useRef<number>()

  const getColor = (s: number) => {
    if (s >= 80) return '#22c55e'
    if (s >= 60) return '#eab308'
    if (s >= 40) return '#f97316'
    return '#ef4444'
  }

  const getGlow = (s: number) => {
    if (s >= 80) return '0 0 20px rgba(34, 197, 94, 0.6)'
    if (s >= 60) return '0 0 20px rgba(234, 179, 8, 0.6)'
    if (s >= 40) return '0 0 20px rgba(249, 115, 22, 0.6)'
    return '0 0 20px rgba(239, 68, 68, 0.6)'
  }

  // Smooth counter animation
  useEffect(() => {
    const startScore = displayScore
    const diff = score - startScore
    const duration = 1000
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentScore = Math.round(startScore + diff * easeOut)

      setDisplayScore(currentScore)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [score])

  const offset = circumference - (displayScore / 100) * circumference
  const color = getColor(displayScore)
  const glow = getGlow(displayScore)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer glow ring */}
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
          filter: `blur(8px)`,
        }}
      />

      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1a1a2e"
          strokeWidth="12"
        />

        {/* Track glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`${color}20`}
          strokeWidth="16"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 8px ${color})`,
            transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.3s ease',
          }}
        />

        {/* Inner track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius - 16}
          fill="none"
          stroke="#0a0a15"
          strokeWidth="2"
          strokeDasharray="4 4"
          opacity="0.3"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-4xl font-bold transition-all duration-300"
          style={{
            color: color,
            textShadow: glow,
          }}
        >
          {displayScore}
        </span>
        <span className="text-xs text-gray-500 mt-1">Security Score</span>
      </div>

      {/* Animated tick marks */}
      <svg
        width={size}
        height={size}
        className="absolute inset-0 transform -rotate-90 pointer-events-none"
      >
        {[...Array(10)].map((_, i) => {
          const angle = (i / 10) * 360
          const tickRadius = radius + 8
          const x = size / 2 + tickRadius * Math.cos((angle * Math.PI) / 180)
          const y = size / 2 + tickRadius * Math.sin((angle * Math.PI) / 180)
          const innerX = size / 2 + (tickRadius - 4) * Math.cos((angle * Math.PI) / 180)
          const innerY = size / 2 + (tickRadius - 4) * Math.sin((angle * Math.PI) / 180)

          return (
            <line
              key={i}
              x1={x}
              y1={y}
              x2={innerX}
              y2={innerY}
              stroke="#333355"
              strokeWidth="1"
              opacity="0.5"
            />
          )
        })}
      </svg>
    </div>
  )
}
