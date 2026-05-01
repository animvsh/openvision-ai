import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { VideoPlayer } from '@/components/VideoPlayer'
import { Card, Button, Badge } from '@/components/ui'
import { useCameraStore } from '@/stores/cameraStore'
import { mockCameras } from '@/data/mockData'

interface ObjectDetection {
  class: string
  score: number
  bbox: [number, number, number, number]
}

export default function LiveCamera() {
  const { id } = useParams()
  const [mode, setMode] = useState<'live' | 'recorded'>('live')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [detections, setDetections] = useState<ObjectDetection[]>([])
  const [fps, setFps] = useState(0)
  const [attentionScore, setAttentionScore] = useState(0)
  const [phoneAlert, setPhoneAlert] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const cameras = useCameraStore((s) => s.cameras)
  const setCameras = useCameraStore((s) => s.setCameras)

  useEffect(() => {
    if (cameras.length === 0) setCameras(mockCameras)
  }, [cameras.length, setCameras])

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })
      setStream(mediaStream)
      setIsActive(true)
      setError(null)

      // Simulate detections periodically
      const interval = setInterval(() => {
        setFps(Math.floor(Math.random() * 5) + 25)
        setDetections([
          { class: 'person', score: 0.92, bbox: [100, 50, 200, 300] },
        ])
      }, 100)

      return () => clearInterval(interval)
    } catch (err) {
      setError('Failed to access camera. Please grant camera permissions.')
      setIsActive(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsActive(false)
    setDetections([])
  }, [stream])

  useEffect(() => {
    if (mode === 'live') {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [mode, startCamera, stopCamera])

  const cameraInfo = cameras.find((c) => c.id === id)
  const personCount = detections.filter((d) => d.class === 'person').length
  const phoneCount = detections.filter((d) => d.class.toLowerCase().includes('phone')).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/cameras" className="text-gray-400 hover:text-neon-cyan transition-colors">← Back</Link>
          <h1 className="text-2xl font-bold text-gray-100">Live Feed - {cameraInfo?.name || `Camera ${id}`}</h1>
          <Badge variant={isActive ? 'low' : 'high'}>{isActive ? 'ACTIVE' : 'INACTIVE'}</Badge>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={mode === 'live' ? 'high' : 'low'}>{mode.toUpperCase()}</Badge>
          <Button variant={mode === 'live' ? 'primary' : 'secondary'} onClick={() => setMode(mode === 'live' ? 'recorded' : 'live')}>
            {mode === 'live' ? 'Switch to Recorded' : 'Switch to Live'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="p-4 bg-red-500/10 border-red-500/30">
          <p className="text-red-400">{error}</p>
          <Button onClick={startCamera} className="mt-2">Retry</Button>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden border-dark-surface">
            <VideoPlayer stream={stream} isLive={mode === 'live'} objectDetections={detections} showFps fps={fps} />
          </Card>
        </div>

        <Card className="p-4">
          <h2 className="font-semibold text-gray-100 mb-4">Real-time Insights</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-dark-surface">
              <span className="text-gray-400">Persons</span>
              <span className="font-medium text-neon-cyan">{personCount}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dark-surface">
              <span className="text-gray-400">Phones Detected</span>
              <span className={`font-medium ${phoneCount > 0 ? 'text-red-400' : 'text-gray-300'}`}>
                {phoneCount}
                {phoneAlert && <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/50">ALERT</span>}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-dark-surface">
              <span className="text-gray-400">Attention Score</span>
              <span className={`font-medium ${attentionScore > 50 ? 'text-neon-lime' : 'text-yellow-400'}`}>{attentionScore}%</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dark-surface">
              <span className="text-gray-400">FPS</span>
              <span className="font-medium text-gray-200">{fps}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dark-surface">
              <span className="text-gray-400">Status</span>
              <Badge variant={isActive ? 'low' : 'high'}>{isActive ? 'LIVE' : 'OFFLINE'}</Badge>
            </div>
          </div>

          {cameraInfo?.insights && cameraInfo.insights.length > 0 && (
            <div className="mt-4 pt-4 border-t border-dark-surface">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Camera Insights</h3>
              <div className="space-y-2">
                {cameraInfo.insights.map((insight, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-500">{insight.label}</span>
                    <span className="font-medium text-gray-300">{insight.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {mode === 'live' && (
        <Card className="p-4">
          <h2 className="font-semibold text-gray-100 mb-4">Detected Objects ({detections.length})</h2>
          <div className="flex flex-wrap gap-2">
            {detections.map((det, i) => (
              <Badge key={i} variant={det.score > 0.7 ? 'high' : 'medium'}>
                {det.class} ({Math.round(det.score * 100)}%)
              </Badge>
            ))}
            {detections.length === 0 && <span className="text-gray-500">No objects detected - Point camera at objects</span>}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h2 className="font-semibold text-gray-100 mb-2">Camera Info</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Location</span><p className="font-medium text-gray-300">{cameraInfo?.location || 'Unknown'}</p></div>
          <div><span className="text-gray-500">Mode</span><p className="font-medium text-gray-300 capitalize">{cameraInfo?.mode || 'Unknown'}</p></div>
          <div><span className="text-gray-500">Stream URL</span><p className="font-medium text-xs text-gray-400 truncate">{cameraInfo?.streamUrl || 'N/A'}</p></div>
          <div><span className="text-gray-500">Camera ID</span><p className="font-medium text-gray-400">{id}</p></div>
        </div>
      </Card>
    </div>
  )
}
