import { create } from 'zustand'

export interface Camera {
  id: string
  name: string
  location: string
  status: 'online' | 'offline' | 'maintenance'
  mode: 'security' | 'classroom' | 'analytics'
  streamUrl?: string
  insights?: Array<{ label: string; value: string }>
}

interface CameraState {
  cameras: Camera[]
  setCameras: (cameras: Camera[]) => void
  addCamera: (camera: Camera) => void
  updateCamera: (id: string, updates: Partial<Camera>) => void
  removeCamera: (id: string) => void
}

export const useCameraStore = create<CameraState>((set) => ({
  cameras: [],
  setCameras: (cameras) => set({ cameras }),
  addCamera: (camera) => set((state) => ({ cameras: [...state.cameras, camera] })),
  updateCamera: (id, updates) =>
    set((state) => ({
      cameras: state.cameras.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeCamera: (id) =>
    set((state) => ({
      cameras: state.cameras.filter((c) => c.id !== id),
    })),
}))