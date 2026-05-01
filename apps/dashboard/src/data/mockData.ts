// Mock Data for OpenVision AI Dashboard Demo

export interface Camera {
  id: string
  name: string
  status: 'online' | 'offline'
  mode: 'security' | 'classroom' | 'analytics'
  location: string
  streamUrl: string
  insights: Array<{ label: string; value: string }>
}

export interface Event {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  cameraName: string
  timestamp: string
  description: string
  videoUrl?: string
}

export interface Alert {
  id: string
  type: 'motion' | 'intrusion' | 'threshold' | 'phone' | 'crowd'
  severity: 'low' | 'medium' | 'high' | 'critical'
  cameraId: string
  cameraName: string
  message: string
  timestamp: string
  acknowledged: boolean
}

export interface AnalyticsData {
  date: string
  events: number
  alerts: number
  engagement: number
}

export const mockCameras: Camera[] = [
  {
    id: '1',
    name: 'Main Entrance',
    status: 'online',
    mode: 'security',
    location: 'Building A - Floor 1',
    streamUrl: 'rtsp://camera1.local/stream',
    insights: [
      { label: 'People Count', value: '12' },
      { label: 'Alert Level', value: 'Low' },
      { label: 'Motion', value: 'Active' },
    ],
  },
  {
    id: '2',
    name: 'Classroom 101',
    status: 'online',
    mode: 'classroom',
    location: 'Building A - Floor 2',
    streamUrl: 'rtsp://camera2.local/stream',
    insights: [
      { label: 'Students', value: '28' },
      { label: 'Focus Score', value: '85%' },
      { label: 'Noise Level', value: 'Normal' },
    ],
  },
  {
    id: '3',
    name: 'Parking Lot North',
    status: 'online',
    mode: 'security',
    location: 'Building B - Exterior',
    streamUrl: 'rtsp://camera3.local/stream',
    insights: [
      { label: 'Vehicles', value: '45' },
      { label: 'Alert Level', value: 'Medium' },
    ],
  },
  {
    id: '4',
    name: 'Reception Area',
    status: 'offline',
    mode: 'analytics',
    location: 'Building A - Floor 1',
    streamUrl: 'rtsp://camera4.local/stream',
    insights: [],
  },
  {
    id: '5',
    name: 'Cafeteria',
    status: 'online',
    mode: 'analytics',
    location: 'Building C - Floor 1',
    streamUrl: 'rtsp://camera5.local/stream',
    insights: [
      { label: 'Occupancy', value: '67%' },
      { label: 'Peak Hour', value: '12:30 PM' },
    ],
  },
  {
    id: '6',
    name: 'Server Room',
    status: 'online',
    mode: 'security',
    location: 'Building B - Basement',
    streamUrl: 'rtsp://camera6.local/stream',
    insights: [
      { label: 'Access Events', value: '3' },
      { label: 'Alert Level', value: 'Low' },
    ],
  },
  {
    id: '7',
    name: 'Library',
    status: 'online',
    mode: 'classroom',
    location: 'Building A - Floor 3',
    streamUrl: 'rtsp://camera7.local/stream',
    insights: [
      { label: 'Occupancy', value: '42%' },
      { label: 'Quiet Level', value: 'High' },
    ],
  },
  {
    id: '8',
    name: 'Gymnasium',
    status: 'online',
    mode: 'analytics',
    location: 'Building D - Floor 1',
    streamUrl: 'rtsp://camera8.local/stream',
    insights: [
      { label: 'Activity', value: 'Basketball' },
      { label: 'Participants', value: '18' },
    ],
  },
]

export const mockEvents: Event[] = [
  {
    id: '1',
    type: 'Motion Detected',
    severity: 'medium',
    cameraName: 'Main Entrance',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    description: 'Motion detected near entrance door after hours',
    videoUrl: '/videos/event1.mp4',
  },
  {
    id: '2',
    type: 'Intrusion Alert',
    severity: 'high',
    cameraName: 'Parking Lot North',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    description: 'Unauthorized person detected in restricted area after hours',
    videoUrl: '/videos/event2.mp4',
  },
  {
    id: '3',
    type: 'Threshold Exceeded',
    severity: 'critical',
    cameraName: 'Classroom 101',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    description: 'Noise level exceeded exam threshold - possible cheating',
    videoUrl: '/videos/event3.mp4',
  },
  {
    id: '4',
    type: 'Motion Detected',
    severity: 'low',
    cameraName: 'Reception Area',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    description: 'Normal visitor traffic during business hours',
  },
  {
    id: '5',
    type: 'Intrusion Alert',
    severity: 'high',
    cameraName: 'Main Entrance',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    description: 'Door held open for extended period - security breach',
    videoUrl: '/videos/event5.mp4',
  },
  {
    id: '6',
    type: 'Person Detected',
    severity: 'medium',
    cameraName: 'Server Room',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 15).toISOString(),
    description: 'Authorized personnel detected in server room',
  },
  {
    id: '7',
    type: 'Crowd Forming',
    severity: 'medium',
    cameraName: 'Cafeteria',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    description: 'Occupancy approaching safety limit',
  },
  {
    id: '8',
    type: 'Object Left',
    severity: 'high',
    cameraName: 'Parking Lot North',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
    description: 'Unattended bag detected in parking area',
    videoUrl: '/videos/event8.mp4',
  },
  {
    id: '9',
    type: 'Phone Detected',
    severity: 'medium',
    cameraName: 'Classroom 101',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    description: 'Cell phone detected during exam',
  },
  {
    id: '10',
    type: 'Low Attention',
    severity: 'low',
    cameraName: 'Library',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    description: 'Student attention level below threshold',
  },
]

export const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'intrusion',
    severity: 'high',
    cameraId: '3',
    cameraName: 'Parking Lot North',
    message: 'Unauthorized person detected after hours',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    acknowledged: false,
  },
  {
    id: '2',
    type: 'threshold',
    severity: 'critical',
    cameraId: '2',
    cameraName: 'Classroom 101',
    message: 'Noise level exceeded exam threshold',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    acknowledged: false,
  },
  {
    id: '3',
    type: 'phone',
    severity: 'medium',
    cameraId: '2',
    cameraName: 'Classroom 101',
    message: 'Cell phone detected during exam',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    acknowledged: true,
  },
]

export const mockAnalyticsData: AnalyticsData[] = [
  { date: '2024-01-01', events: 45, alerts: 12, engagement: 72 },
  { date: '2024-01-02', events: 52, alerts: 8, engagement: 78 },
  { date: '2024-01-03', events: 38, alerts: 15, engagement: 65 },
  { date: '2024-01-04', events: 61, alerts: 22, engagement: 81 },
  { date: '2024-01-05', events: 55, alerts: 18, engagement: 76 },
  { date: '2024-01-06', events: 29, alerts: 5, engagement: 58 },
  { date: '2024-01-07', events: 33, alerts: 9, engagement: 62 },
  { date: '2024-01-08', events: 48, alerts: 14, engagement: 74 },
  { date: '2024-01-09', events: 56, alerts: 19, engagement: 79 },
  { date: '2024-01-10', events: 42, alerts: 11, engagement: 70 },
  { date: '2024-01-11', events: 51, alerts: 16, engagement: 77 },
  { date: '2024-01-12', events: 47, alerts: 13, engagement: 75 },
  { date: '2024-01-13', events: 39, alerts: 7, engagement: 68 },
  { date: '2024-01-14', events: 58, alerts: 21, engagement: 82 },
]

export const mockOrgStats = {
  activeCameras: 7,
  totalCameras: 8,
  securityScore: 78,
  recentAlerts: 3,
  eventsToday: 12,
}

export const weeklyEventsData = [
  { name: 'Mon', events: 12, alerts: 4 },
  { name: 'Tue', events: 19, alerts: 6 },
  { name: 'Wed', events: 15, alerts: 3 },
  { name: 'Thu', events: 22, alerts: 8 },
  { name: 'Fri', events: 18, alerts: 5 },
  { name: 'Sat', events: 10, alerts: 2 },
  { name: 'Sun', events: 8, alerts: 1 },
]

export const modeDistributionData = [
  { name: 'Security', value: 45 },
  { name: 'Classroom', value: 30 },
  { name: 'Analytics', value: 25 },
]

export const securityScoreTrendData = [
  { name: 'Week 1', score: 72 },
  { name: 'Week 2', score: 75 },
  { name: 'Week 3', score: 78 },
  { name: 'Week 4', score: 82 },
]

export const eventTypesDistributionData = [
  { name: 'Motion', value: 55 },
  { name: 'Intrusion', value: 25 },
  { name: 'Threshold', value: 20 },
]

// API functions that simulate network requests
export async function fetchCameras(): Promise<Camera[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return mockCameras
}

export async function fetchEvents(filters?: { severity?: string; type?: string }): Promise<Event[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  let filtered = [...mockEvents]
  if (filters?.severity && filters.severity !== 'all') {
    filtered = filtered.filter((e) => e.severity === filters.severity)
  }
  if (filters?.type && filters.type !== 'all') {
    const typeFilter = filters.type
    filtered = filtered.filter((e) => e.type.toLowerCase().includes(typeFilter))
  }
  return filtered
}

export async function fetchAlerts(): Promise<Alert[]> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return mockAlerts
}

export async function fetchOrgStats() {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return mockOrgStats
}

export async function fetchAnalyticsData(): Promise<AnalyticsData[]> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return mockAnalyticsData
}