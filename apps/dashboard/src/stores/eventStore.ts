import { create } from 'zustand'
import { Event } from '@/data/mockData'

interface EventState {
  events: Event[]
  isLoading: boolean
  error: string | null
  filterSeverity: 'all' | 'low' | 'medium' | 'high' | 'critical'
  filterType: string
  setEvents: (events: Event[]) => void
  addEvent: (event: Event) => void
  setFilterSeverity: (severity: 'all' | 'low' | 'medium' | 'high' | 'critical') => void
  setFilterType: (type: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useEventStore = create<EventState>((set) => ({
  events: [],
  isLoading: false,
  error: null,
  filterSeverity: 'all',
  filterType: 'all',
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((state) => ({ events: [event, ...state.events] })),
  setFilterSeverity: (severity) => set({ filterSeverity: severity }),
  setFilterType: (type) => set({ filterType: type }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}))