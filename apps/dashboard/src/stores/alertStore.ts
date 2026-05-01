import { create } from 'zustand'
import { Alert } from '@/data/mockData'

interface AlertState {
  alerts: Alert[]
  thresholds: {
    motionSensitivity: number
    noiseThreshold: number
    intrusionDelay: number
    faceRecognitionDistance: number
  }
  isLoading: boolean
  setAlerts: (alerts: Alert[]) => void
  addAlert: (alert: Alert) => void
  acknowledgeAlert: (id: string) => void
  updateThreshold: (key: string, value: number) => void
  setLoading: (loading: boolean) => void
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  thresholds: {
    motionSensitivity: 50,
    noiseThreshold: 70,
    intrusionDelay: 30,
    faceRecognitionDistance: 10,
  },
  isLoading: false,
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
  acknowledgeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    })),
  updateThreshold: (key, value) =>
    set((state) => ({
      thresholds: { ...state.thresholds, [key]: value },
    })),
  setLoading: (loading) => set({ isLoading: loading }),
}))