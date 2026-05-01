import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCameraStore } from '@/stores/cameraStore'
import { Card, Badge } from '@/components/ui'
import { mockCameras } from '@/data/mockData'
import { useWebSocket } from '@/hooks'

type FilterMode = 'all' | 'security' | 'classroom' | 'analytics'
type FilterStatus = 'all' | 'online' | 'offline'

export default function CameraGrid() {
  const cameras = useCameraStore((s) => s.cameras)
  const setCameras = useCameraStore((s) => s.setCameras)
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (cameras.length === 0) setCameras(mockCameras)
  }, [cameras.length, setCameras])

  // WebSocket for real-time camera status updates
  useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
    onMessage: (message) => {
      if (message.type === 'camera_status_change') {
        const payload = message.payload as { id: string; status: 'online' | 'offline' }
        useCameraStore.getState().updateCamera(payload.id, { status: payload.status })
      }
    },
  })

  const filteredCameras = cameras.filter((camera) => {
    if (filterMode !== 'all' && camera.mode !== filterMode) return false
    if (filterStatus !== 'all' && camera.status !== filterStatus) return false
    if (searchQuery && !camera.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const onlineCount = cameras.filter((c) => c.status === 'online').length
  const offlineCount = cameras.filter((c) => c.status === 'offline').length

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100">Camera Grid</h1>
        <Badge variant={onlineCount > offlineCount ? 'low' : 'high'}>
          {onlineCount} online / {offlineCount} offline
        </Badge>
      </div>

      <Card className="p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-400 mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cameras..."
              className="w-full px-3 py-2 border border-dark-surface bg-dark-bg text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neon-cyan"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-400 mb-1">Mode</label>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as FilterMode)}
              className="w-full px-3 py-2 border border-dark-surface bg-dark-bg text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neon-cyan"
            >
              <option value="all">All Modes</option>
              <option value="security">Security</option>
              <option value="classroom">Classroom</option>
              <option value="analytics">Analytics</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="w-full px-3 py-2 border border-dark-surface bg-dark-bg text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neon-cyan"
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>
      </Card>

      {filteredCameras.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCameras.map((camera) => (
            <Link key={camera.id} to={`/camera/${camera.id}`}>
              <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-dark-surface hover:border-neon-cyan/50">
                <div className="aspect-video bg-dark-surface rounded-lg mb-3 flex items-center justify-center border border-dark-card">
                  <span className="text-gray-500 text-2xl">📹</span>
                </div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-200">{camera.name}</h3>
                  <Badge variant={camera.status === 'online' ? 'low' : 'high'}>{camera.status}</Badge>
                </div>
                <p className="text-sm text-gray-500">{camera.location}</p>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-gray-500 capitalize">{camera.mode}</span>
                  {camera.insights?.[0] && (
                    <span className="text-gray-500 truncate max-w-[150px]">{camera.insights[0].label}: {camera.insights[0].value}</span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No cameras match the current filters.</p>
          <button onClick={() => { setFilterMode('all'); setFilterStatus('all'); setSearchQuery('') }} className="mt-4 text-neon-cyan hover:underline">Clear filters</button>
        </Card>
      )}
    </div>
  )
}
