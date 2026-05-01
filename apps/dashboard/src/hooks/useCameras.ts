import { useEffect } from 'react'
import { useCameraStore } from '@/stores/cameraStore'
import { mockCameras } from '@/data/mockData'

export function useCameras() {
  const cameras = useCameraStore((s) => s.cameras)
  const setCameras = useCameraStore((s) => s.setCameras)
  const updateCamera = useCameraStore((s) => s.updateCamera)

  useEffect(() => {
    if (cameras.length === 0) {
      setCameras(mockCameras)
    }
  }, [cameras.length, setCameras])

  return {
    cameras,
    updateCamera,
    isLoading: false,
    error: null,
  }
}