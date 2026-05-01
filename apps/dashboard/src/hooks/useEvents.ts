import { useEffect } from 'react'
import { useEventStore } from '@/stores/eventStore'
import { mockEvents } from '@/data/mockData'

export function useEvents(filters?: { severity?: string; type?: string }) {
  const events = useEventStore((s) => s.events)
  const setEvents = useEventStore((s) => s.setEvents)
  const addEvent = useEventStore((s) => s.addEvent)

  useEffect(() => {
    if (events.length === 0) {
      setEvents(mockEvents)
    }
  }, [events.length, setEvents])

  let filtered = events
  if (filters?.severity && filters.severity !== 'all') {
    filtered = filtered.filter((e) => e.severity === filters.severity)
  }
  if (filters?.type && filters.type !== 'all') {
    const typeFilter = filters.type
    filtered = filtered.filter((e) => e.type.toLowerCase().includes(typeFilter))
  }

  return {
    events: filtered,
    allEvents: events,
    addEvent,
    isLoading: false,
    error: null,
  }
}