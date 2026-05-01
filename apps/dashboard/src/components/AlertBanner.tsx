import { Link } from 'react-router-dom'
import { Alert } from '@/data/mockData'
import { Card, Badge } from '@/components/ui'

interface AlertBannerProps {
  alert: Alert
  onAcknowledge?: (id: string) => void
}

export function AlertBanner({ alert, onAcknowledge }: AlertBannerProps) {
  const severityConfig = {
    low: {
      bg: 'bg-neon-lime/10',
      border: 'border-neon-lime/30',
      icon: '✓',
      iconColor: 'text-neon-lime',
    },
    medium: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      icon: '!',
      iconColor: 'text-yellow-500',
    },
    high: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      icon: '⚠',
      iconColor: 'text-red-400',
    },
    critical: {
      bg: 'bg-red-600/20',
      border: 'border-red-500/50',
      icon: '✕',
      iconColor: 'text-red-300 animate-pulse',
    },
  }

  const config = severityConfig[alert.severity]

  return (
    <Card
      className={`p-4 ${config.bg} border ${config.border} transition-all duration-300 hover:shadow-lg`}
    >
      <div className="flex items-start gap-3">
        {/* Severity indicator */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${config.bg} ${config.border} border ${config.iconColor}`}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-200">{alert.message}</p>
              <p className="text-sm text-gray-400 mt-1">
                {alert.cameraName} • {new Date(alert.timestamp).toLocaleString()}
              </p>
            </div>
            <Badge variant={alert.severity}>{alert.severity}</Badge>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2 mt-3">
            {!alert.acknowledged && onAcknowledge && (
              <button
                onClick={() => onAcknowledge(alert.id)}
                className="px-3 py-1 text-xs font-medium bg-dark-surface text-gray-300 rounded hover:bg-dark-card hover:text-gray-100 transition-all border border-dark-card"
              >
                Acknowledge
              </button>
            )}
            <Link
              to={`/camera/${alert.cameraId}`}
              className="px-3 py-1 text-xs font-medium text-neon-cyan hover:underline"
            >
              View Camera
            </Link>
            {alert.acknowledged && (
              <span className="text-xs text-gray-500">Acknowledged</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
