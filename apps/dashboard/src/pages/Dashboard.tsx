import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCameraStore } from '@/stores/cameraStore'
import { useEventStore } from '@/stores/eventStore'
import { useAlertStore } from '@/stores/alertStore'
import { Card, Badge } from '@/components/ui'
import { ScoreGauge } from '@/components/ScoreGauge'
import { mockCameras, mockEvents, mockOrgStats } from '@/data/mockData'
import { useWebSocket } from '@/hooks'

export default function Dashboard() {
  const cameras = useCameraStore((s) => s.cameras)
  const setCameras = useCameraStore((s) => s.setCameras)
  const events = useEventStore((s) => s.events)
  const setEvents = useEventStore((s) => s.setEvents)
  const thresholds = useAlertStore((s) => s.thresholds)

  // Initialize with mock data
  useEffect(() => {
    if (cameras.length === 0) setCameras(mockCameras)
    if (events.length === 0) setEvents(mockEvents)
  }, [cameras.length, events.length, setCameras, setEvents])

  // WebSocket for real-time updates
  useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
    onMessage: (message) => {
      if (message.type === 'camera_update') {
        const payload = message.payload as { id: string; status: 'online' | 'offline' }
        useCameraStore.getState().updateCamera(payload.id, { status: payload.status })
      } else if (message.type === 'new_event') {
        const newEvent = message.payload as typeof mockEvents[0]
        useEventStore.getState().addEvent(newEvent)
      }
    },
    onOpen: () => console.log('Dashboard WebSocket connected'),
    onClose: () => console.log('Dashboard WebSocket disconnected'),
  })

  const activeCameras = cameras.filter((c) => c.status === 'online').length
  const recentAlerts = events.filter((e) => e.severity === 'high' || e.severity === 'critical').length
  const securityCameras = cameras.filter((c) => c.mode === 'security')
  const classroomCameras = cameras.filter((c) => c.mode === 'classroom')
  const analyticsCameras = cameras.filter((c) => c.mode === 'analytics')

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100">Organization Dashboard</h1>
        <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-400">Active Cameras</p>
          <p className="text-3xl font-bold text-neon-cyan">{activeCameras}/{cameras.length}</p>
          <div className="mt-2 flex gap-1">
            {cameras.map((cam) => (
              <span key={cam.id} className={`w-2 h-2 rounded-full ${cam.status === 'online' ? 'bg-neon-lime shadow-[0_0_6px_rgba(0,255,0,0.8)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]'}`} />
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-400">Security Score</p>
          <p className="text-3xl font-bold text-neon-lime">{mockOrgStats.securityScore}</p>
        </Card>
        <Link to="/events">
          <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer border-neon-magenta/30">
            <p className="text-sm text-gray-400">Recent Alerts</p>
            <p className="text-3xl font-bold text-red-400">{recentAlerts}</p>
          </Card>
        </Link>
        <Card className="p-4">
          <p className="text-sm text-gray-400">Events Today</p>
          <p className="text-3xl font-bold text-gray-200">{mockOrgStats.eventsToday}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Overall Security Score</h2>
          <div className="flex justify-center"><ScoreGauge score={mockOrgStats.securityScore} size={200} /></div>
          <div className="mt-4 text-center text-sm text-gray-500">
            Based on {activeCameras} active cameras and {events.length} recent events
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Mode Distribution</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Security Mode</span>
              <div className="flex items-center gap-2">
                <Badge variant="high">{securityCameras.length} cameras</Badge>
                <span className="text-sm text-gray-500">{securityCameras.filter(c => c.status === 'online').length} online</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Classroom Mode</span>
              <div className="flex items-center gap-2">
                <Badge variant="medium">{classroomCameras.length} cameras</Badge>
                <span className="text-sm text-gray-500">{classroomCameras.filter(c => c.status === 'online').length} online</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Analytics Mode</span>
              <div className="flex items-center gap-2">
                <Badge variant="low">{analyticsCameras.length} cameras</Badge>
                <span className="text-sm text-gray-500">{analyticsCameras.filter(c => c.status === 'online').length} online</span>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-dark-surface">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Alert Thresholds</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Motion Sensitivity</span><span className="font-medium text-neon-cyan">{thresholds.motionSensitivity}%</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Noise Threshold</span><span className="font-medium text-neon-cyan">{thresholds.noiseThreshold}%</span></div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-100">Recent Activity</h2>
          <Link to="/events" className="text-sm text-neon-cyan hover:underline hover:shadow-[0_0_10px_rgba(0,255,255,0.5)]">View all events</Link>
        </div>
        <div className="space-y-3">
          {events.slice(0, 5).map((event) => (
            <div key={event.id} className="flex justify-between items-center py-2 border-b border-dark-surface last:border-0">
              <div>
                <p className="font-medium text-gray-200">{event.type}</p>
                <p className="text-sm text-gray-500">{event.cameraName}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</span>
                <Badge variant={event.severity}>{event.severity}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/cameras"><Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer text-center border-neon-cyan/30 hover:border-neon-cyan/60"><div className="text-3xl mb-2">📹</div><p className="font-medium text-gray-200">View Camera Grid</p><p className="text-sm text-gray-500">{cameras.length} cameras</p></Card></Link>
        <Link to="/analytics"><Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer text-center border-neon-magenta/30 hover:border-neon-magenta/60"><div className="text-3xl mb-2">📊</div><p className="font-medium text-gray-200">View Analytics</p><p className="text-sm text-gray-500">Engagement insights</p></Card></Link>
        <Link to="/settings"><Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer text-center border-neon-lime/30 hover:border-neon-lime/60"><div className="text-3xl mb-2">⚙️</div><p className="font-medium text-gray-200">Settings</p><p className="text-sm text-gray-500">Configure thresholds</p></Card></Link>
      </div>
    </div>
  )
}
