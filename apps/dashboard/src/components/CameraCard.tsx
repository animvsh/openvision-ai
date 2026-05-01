import { Link } from 'react-router-dom'
import { Card, Badge } from '@/components/ui'
import { Camera } from '@/data/mockData'

interface CameraCardProps {
  camera: Camera
}

export function CameraCard({ camera }: CameraCardProps) {
  const statusColor = camera.status === 'online' ? 'neon-lime' : 'red-400'
  const modeColors = {
    security: 'text-red-400',
    classroom: 'text-neon-magenta',
    analytics: 'text-neon-cyan',
  }

  return (
    <Link to={`/camera/${camera.id}`}>
      <Card className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border-dark-surface hover:border-neon-cyan/50 hover:scale-[1.02]">
        {/* Thumbnail */}
        <div className="aspect-video bg-dark-surface rounded-lg mb-3 flex items-center justify-center border border-dark-card relative overflow-hidden group">
          <span className="text-gray-500 text-2xl">📹</span>

          {/* Status overlay */}
          <div className="absolute top-2 right-2">
            <Badge variant={camera.status === 'online' ? 'low' : 'high'}>
              {camera.status}
            </Badge>
          </div>

          {/* Mode badge */}
          <div className="absolute bottom-2 left-2">
            <span className={`text-xs font-medium uppercase tracking-wider ${modeColors[camera.mode]}`}>
              {camera.mode}
            </span>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-neon-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-neon-cyan text-sm font-medium">View Live</span>
          </div>
        </div>

        {/* Camera info */}
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-gray-200">{camera.name}</h3>
          </div>

          <p className="text-sm text-gray-500">{camera.location}</p>

          {/* Insights grid */}
          {camera.insights.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-dark-surface">
              {camera.insights.slice(0, 4).map((insight, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{insight.label}</span>
                  <span className="text-xs font-medium text-gray-300">{insight.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Footer stats */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-dark-surface">
            <div className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  camera.status === 'online'
                    ? 'bg-neon-lime shadow-[0_0_6px_rgba(0,255,0,0.8)]'
                    : 'bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                }`}
              />
              <span className="text-xs text-gray-500 capitalize">{camera.status}</span>
            </div>
            {camera.streamUrl && (
              <span className="text-xs text-neon-cyan">RTSP</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
