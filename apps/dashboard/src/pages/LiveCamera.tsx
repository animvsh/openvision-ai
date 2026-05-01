import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { VideoPlayer } from '@/components/VideoPlayer'
import { Card, Button, Badge } from '@/components/ui'
import { useCameraStore } from '@/stores/cameraStore'
import { mockCameras } from '@/data/mockData'
import { useMediaPipe, FaceDetection } from '@/hooks/useMediaPipe'
import { useObjectDetection } from '@/hooks/useObjectDetection'
import { ObjectDetection } from '@/hooks/useLiveCamera'

// Phone alert audio context for playing sound
let phoneAlertAudioContext: AudioContext | null = null

function playPhoneAlertSound(pattern: 'single' | 'double' | 'triple' = 'double') {
  try {
    if (!phoneAlertAudioContext) {
      phoneAlertAudioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }

    const ctx = phoneAlertAudioContext
    const beepCount = pattern === 'single' ? 1 : pattern === 'double' ? 2 : 3
    const beepDelay = 150
    const beepDuration = 0.25

    for (let i = 0; i < beepCount; i++) {
      setTimeout(() => {
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)

        // A5 note for high urgency, E5 for normal
        oscillator.frequency.setValueAtTime(pattern === 'triple' ? 1046.5 : 880, ctx.currentTime)
        oscillator.type = 'sine'

        gainNode.gain.setValueAtTime(0.25, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + beepDuration)

        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + beepDuration)
      }, i * beepDelay)
    }
  } catch (err) {
    console.error('Failed to play phone alert sound:', err)
  }
}

export default function LiveCamera() {
  const { id } = useParams()
  const [mode, setMode] = useState<'live' | 'recorded'>('live')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [faceDetections, setFaceDetections] = useState<FaceDetection[]>([])
  const [objectDetections, setObjectDetections] = useState<ObjectDetection[]>([])
  const [fps, setFps] = useState(0)
  const [attentionScore, setAttentionScore] = useState(0)
  const [phoneAlert, setPhoneAlert] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number>(0)
  const phoneAlertPlayedRef = useRef<boolean>(false)

  const cameras = useCameraStore((s) => s.cameras)
  const setCameras = useCameraStore((s) => s.setCameras)

  // Initialize MediaPipe face detection
  const { detect: detectFaces, isInitialized: faceInitialized, cleanup: cleanupFaceMesh } = useMediaPipe({
    frequency: 200, // ~5 FPS
    onFaceDetection: (detectedFaces) => {
      setFaceDetections(detectedFaces)
    },
  })

  // Initialize TensorFlow.js object detection
  const { detect: detectObjects, setVideo, startDetection: startObjectDetection, stopDetection: stopObjectDetection, isInitialized: objectInitialized } = useObjectDetection({
    frequency: 200, // ~5 FPS
    onObjectDetection: (detectedObjs) => {
      setObjectDetections(detectedObjs)
    },
  })

  useEffect(() => {
    if (cameras.length === 0) setCameras(mockCameras)
  }, [cameras.length, setCameras])

  // Calculate attention score based on face centering
  const calculateAttentionScore = useCallback((faceDetectionList: FaceDetection[]): number => {
    if (faceDetectionList.length === 0) return 0

    let totalScore = 0
    for (const face of faceDetectionList) {
      const box = face.boundingBox
      const centerX = box.x + box.width / 2
      const centerY = box.y + box.height / 2

      // Ideal center is at 0.5, 0.5 (middle of frame)
      const distanceFromCenter = Math.sqrt(
        Math.pow(centerX - 0.5, 2) + Math.pow(centerY - 0.5, 2)
      )

      // Score based on proximity to center (closer = higher score)
      const centerScore = 1 - Math.min(distanceFromCenter * 2, 1)

      // Size score (larger face = more present = higher score)
      const sizeScore = Math.min((box.width * box.height) / 0.5, 1)

      totalScore += (centerScore * 0.4 + sizeScore * 0.6) * face.score
    }

    return Math.round((totalScore / faceDetectionList.length) * 100)
  }, [])

  // Detection loop running at ~5 FPS
  const runDetection = useCallback(async (video: HTMLVideoElement) => {
    const now = Date.now()
    const frameInterval = 200 // ~5 FPS

    if (now - lastFrameTimeRef.current >= frameInterval) {
      lastFrameTimeRef.current = now

      // Run both detections in parallel
      await Promise.all([
        detectFaces(video),
        detectObjects(video),
      ])

      // Update attention score based on face detections
      setAttentionScore(calculateAttentionScore(faceDetections))

      // Calculate FPS
      setFps(Math.round(1000 / frameInterval))
    }

    // Continue the loop if still active
    if (videoRef.current && isActive) {
      animationFrameRef.current = requestAnimationFrame(() => runDetection(video))
    }
  }, [detectFaces, detectObjects, calculateAttentionScore, faceDetections, isActive])

  // Start camera with CV processing
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      })
      setStream(mediaStream)
      setIsActive(true)
      setError(null)
      setPhoneAlert(false)
      phoneAlertPlayedRef.current = false

      // Wait for video to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          startObjectDetection()
          runDetection(videoRef.current)
        }
      }, 500)
    } catch (err) {
      setError('Failed to access camera. Please grant camera permissions.')
      setIsActive(false)
    }
  }, [startObjectDetection, runDetection])

  // Stop camera and cleanup
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    stopObjectDetection()
    cleanupFaceMesh()

    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsActive(false)
    setFaceDetections([])
    setObjectDetections([])
    setPhoneAlert(false)
    phoneAlertPlayedRef.current = false
  }, [stream, stopObjectDetection, cleanupFaceMesh])

  // Handle mode switch
  useEffect(() => {
    if (mode === 'live') {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [mode, startCamera, stopCamera])

  // Phone detection alert
  useEffect(() => {
    const phoneCount = objectDetections.filter(
      (d) => d.class.toLowerCase().includes('phone')
    ).length

    if (phoneCount > 0 && !phoneAlertPlayedRef.current) {
      setPhoneAlert(true)
      phoneAlertPlayedRef.current = true
      playPhoneAlertSound()

      // Auto-dismiss alert after 3 seconds
      setTimeout(() => {
        setPhoneAlert(false)
      }, 3000)
    } else if (phoneCount === 0) {
      setPhoneAlert(false)
      phoneAlertPlayedRef.current = false
    }
  }, [objectDetections])

  // Set video element reference for object detection
  const setVideoRef = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video
    if (video) {
      setVideo(video)
    }
  }, [setVideo])

  const cameraInfo = cameras.find((c) => c.id === id)
  const personCount = objectDetections.filter((d) => d.class === 'person').length
  const phoneCount = objectDetections.filter((d) => d.class.toLowerCase().includes('phone')).length

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

      {phoneAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 border-2 border-red-400">
            <span className="text-2xl">📱</span>
            <span className="font-bold">Phone Detected!</span>
            <span className="text-red-200 text-sm">Violation will be logged</span>
          </div>
        </div>
      )}

      {error && (
        <Card className="p-4 bg-red-500/10 border-red-500/30">
          <p className="text-red-400">{error}</p>
          <Button onClick={startCamera} className="mt-2">Retry</Button>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden border-dark-surface">
            <VideoPlayer
              stream={stream}
              isLive={mode === 'live'}
              faceDetections={faceDetections}
              objectDetections={objectDetections}
              showFps
              fps={fps}
            />
          </Card>
        </div>

        <Card className="p-4">
          <h2 className="font-semibold text-gray-100 mb-4">Real-time Insights</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-dark-surface">
              <span className="text-gray-400">Faces Detected</span>
              <span className="font-medium text-neon-cyan">{faceDetections.length}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dark-surface">
              <span className="text-gray-400">Persons</span>
              <span className="font-medium text-neon-cyan">{personCount}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dark-surface">
              <span className="text-gray-400">Phones Detected</span>
              <span className={`font-medium ${phoneCount > 0 ? 'text-red-400' : 'text-gray-300'}`}>
                {phoneCount}
                {phoneAlert && <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/50 animate-pulse">ALERT</span>}
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
              <span className="text-gray-400">CV Status</span>
              <Badge variant={faceInitialized && objectInitialized ? 'low' : 'medium'}>
                {faceInitialized && objectInitialized ? 'READY' : 'INIT...'}
              </Badge>
            </div>
          </div>

          {cameraInfo?.insights && cameraInfo.insights.length > 0 && (
            <div className="mt-4 pt-4 border-t border-dark-surface">
              <h3 className="text-sm font-medium text-gray-300 mb-2"> Camera Insights</h3>
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
          <h2 className="font-semibold text-gray-100 mb-4">Detected Objects ({objectDetections.length + faceDetections.length})</h2>
          <div className="flex flex-wrap gap-2">
            {faceDetections.map((face, i) => (
              <Badge key={`face-${i}`} variant="medium" className="border-cyan-500 text-cyan-400">
                Face {Math.round(face.score * 100)}%
              </Badge>
            ))}
            {objectDetections.map((det, i) => (
              <Badge key={`obj-${i}`} variant={det.score > 0.7 ? 'high' : 'medium'}>
                {det.class} ({Math.round(det.score * 100)}%)
              </Badge>
            ))}
            {objectDetections.length === 0 && faceDetections.length === 0 && (
              <span className="text-gray-500">No objects detected - Point camera at objects</span>
            )}
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
