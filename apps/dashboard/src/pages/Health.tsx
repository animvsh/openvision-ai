import { useState, useEffect } from 'react'
import { Card } from '@/components/ui'

interface SystemMetrics {
  cpu: number
  memory: number
  storage: number
  network: number
  uptime: string
}

interface ServiceHealth {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latency: number
  lastCheck: Date
}

export default function Health() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 32,
    memory: 45,
    storage: 67,
    network: 12,
    uptime: '14 days, 7 hours',
  })

  const [services, setServices] = useState<ServiceHealth[]>([
    { name: 'API Server', status: 'healthy', latency: 45, lastCheck: new Date() },
    { name: 'WebSocket Server', status: 'healthy', latency: 12, lastCheck: new Date() },
    { name: 'CV Engine', status: 'healthy', latency: 89, lastCheck: new Date() },
    { name: 'Database', status: 'healthy', latency: 23, lastCheck: new Date() },
    { name: 'Storage Service', status: 'degraded', latency: 156, lastCheck: new Date() },
    { name: 'AI/ML Service', status: 'healthy', latency: 234, lastCheck: new Date() },
  ])

  const [cameraHealth, setCameraHealth] = useState([
    { name: 'Main Entrance', status: 'online', cpu: 23, memory: 31 },
    { name: 'Classroom 101', status: 'online', cpu: 18, memory: 24 },
    { name: 'Parking Lot North', status: 'online', cpu: 34, memory: 42 },
    { name: 'Reception Area', status: 'offline', cpu: 0, memory: 0 },
    { name: 'Cafeteria', status: 'online', cpu: 28, memory: 35 },
    { name: 'Server Room', status: 'online', cpu: 45, memory: 52 },
    { name: 'Library', status: 'online', cpu: 15, memory: 19 },
    { name: 'Gymnasium', status: 'online', cpu: 22, memory: 28 },
  ])

  useEffect(() => {
    // Simulate metric updates
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        cpu: Math.max(5, Math.min(95, prev.cpu + (Math.random() * 10 - 5))),
        memory: Math.max(20, Math.min(90, prev.memory + (Math.random() * 6 - 3))),
        network: Math.max(1, Math.min(50, prev.network + (Math.random() * 8 - 4))),
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: 'healthy' | 'degraded' | 'down' | 'online' | 'offline') => {
    if (status === 'healthy' || status === 'online') return 'text-neon-lime'
    if (status === 'degraded') return 'text-yellow-500'
    return 'text-red-400'
  }

  const getStatusBg = (status: 'healthy' | 'degraded' | 'down' | 'online' | 'offline') => {
    if (status === 'healthy' || status === 'online') return 'bg-neon-lime/20 border-neon-lime/50'
    if (status === 'degraded') return 'bg-yellow-500/20 border-yellow-500/50'
    return 'bg-red-500/20 border-red-500/50'
  }

  const getMetricColor = (value: number) => {
    if (value < 50) return 'text-neon-lime'
    if (value < 75) return 'text-yellow-500'
    return 'text-red-400'
  }

  const getOverallHealth = () => {
    const healthyServices = services.filter((s) => s.status === 'healthy').length
    const percentage = (healthyServices / services.length) * 100
    if (percentage >= 80) return { status: 'healthy', label: 'Healthy', color: 'text-neon-lime' }
    if (percentage >= 60) return { status: 'degraded', label: 'Degraded', color: 'text-yellow-500' }
    return { status: 'down', label: 'Critical', color: 'text-red-400' }
  }

  const overallHealth = getOverallHealth()

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100">System Health</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
          <span className={`flex items-center gap-2 text-sm font-medium ${overallHealth.color}`}>
            <span className={`w-3 h-3 rounded-full ${
              overallHealth.status === 'healthy' ? 'bg-neon-lime animate-pulse' :
              overallHealth.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-400 animate-pulse'
            }`} />
            {overallHealth.label}
          </span>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-400">CPU Usage</p>
            <span className="text-xs text-gray-500">{Math.round(metrics.cpu)}%</span>
          </div>
          <div className="relative h-2 bg-dark-surface rounded-full overflow-hidden">
            <div
              className={`absolute h-full rounded-full transition-all duration-500 ${
                metrics.cpu < 50 ? 'bg-neon-lime' : metrics.cpu < 75 ? 'bg-yellow-500' : 'bg-red-400'
              }`}
              style={{ width: `${metrics.cpu}%` }}
            />
          </div>
          <p className={`text-2xl font-bold mt-2 ${getMetricColor(metrics.cpu)}`}>
            {Math.round(metrics.cpu)}%
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-400">Memory Usage</p>
            <span className="text-xs text-gray-500">{Math.round(metrics.memory)}%</span>
          </div>
          <div className="relative h-2 bg-dark-surface rounded-full overflow-hidden">
            <div
              className={`absolute h-full rounded-full transition-all duration-500 ${
                metrics.memory < 50 ? 'bg-neon-lime' : metrics.memory < 75 ? 'bg-yellow-500' : 'bg-red-400'
              }`}
              style={{ width: `${metrics.memory}%` }}
            />
          </div>
          <p className={`text-2xl font-bold mt-2 ${getMetricColor(metrics.memory)}`}>
            {Math.round(metrics.memory)}%
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-400">Storage Usage</p>
            <span className="text-xs text-gray-500">{metrics.storage}%</span>
          </div>
          <div className="relative h-2 bg-dark-surface rounded-full overflow-hidden">
            <div
              className={`absolute h-full rounded-full ${
                metrics.storage < 50 ? 'bg-neon-lime' : metrics.storage < 75 ? 'bg-yellow-500' : 'bg-red-400'
              }`}
              style={{ width: `${metrics.storage}%` }}
            />
          </div>
          <p className={`text-2xl font-bold mt-2 ${getMetricColor(metrics.storage)}`}>
            {metrics.storage}%
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-400">Network I/O</p>
            <span className="text-xs text-gray-500">{Math.round(metrics.network)} MB/s</span>
          </div>
          <div className="relative h-2 bg-dark-surface rounded-full overflow-hidden">
            <div
              className="absolute h-full rounded-full bg-neon-cyan transition-all duration-500"
              style={{ width: `${(metrics.network / 50) * 100}%` }}
            />
          </div>
          <p className="text-2xl font-bold text-neon-cyan mt-2">
            {Math.round(metrics.network)} MB/s
          </p>
        </Card>
      </div>

      {/* Services Health */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.name}
              className={`p-4 rounded-lg border ${getStatusBg(service.status)}`}
            >
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium text-gray-200">{service.name}</p>
                <span className={`text-xs font-medium ${getStatusColor(service.status)}`}>
                  {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Latency</span>
                <span className={service.latency < 100 ? 'text-neon-lime' : service.latency < 200 ? 'text-yellow-500' : 'text-red-400'}>
                  {service.latency}ms
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Last check: {service.lastCheck.toLocaleTimeString()}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Camera Health */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Camera Health</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-surface">
                <th className="text-left py-2 px-4 text-gray-400">Camera</th>
                <th className="text-center py-2 px-4 text-gray-400">Status</th>
                <th className="text-center py-2 px-4 text-gray-400">CPU</th>
                <th className="text-center py-2 px-4 text-gray-400">Memory</th>
              </tr>
            </thead>
            <tbody>
              {cameraHealth.map((camera) => (
                <tr key={camera.name} className="border-b border-dark-surface hover:bg-dark-surface/30">
                  <td className="py-2 px-4 text-gray-200">{camera.name}</td>
                  <td className="text-center py-2 px-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${getStatusColor(camera.status as 'online' | 'offline')}`}>
                      <span className={`w-2 h-2 rounded-full ${camera.status === 'online' ? 'bg-neon-lime' : 'bg-red-400'}`} />
                      {camera.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="text-center py-2 px-4">
                    {camera.status === 'offline' ? (
                      <span className="text-gray-600">-</span>
                    ) : (
                      <span className={getMetricColor(camera.cpu)}>{camera.cpu}%</span>
                    )}
                  </td>
                  <td className="text-center py-2 px-4">
                    {camera.status === 'offline' ? (
                      <span className="text-gray-600">-</span>
                    ) : (
                      <span className={getMetricColor(camera.memory)}>{camera.memory}%</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* System Uptime */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">System Uptime</p>
            <p className="text-2xl font-bold text-gray-200">{metrics.uptime}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Active Sessions</p>
            <p className="text-2xl font-bold text-neon-cyan">24</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
