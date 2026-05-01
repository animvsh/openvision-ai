import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EventCard } from '@/components/EventCard'
import { useEventStore } from '@/stores/eventStore'
import { Card, Badge } from '@/components/ui'
import { mockEvents } from '@/data/mockData'
import { useWebSocket } from '@/hooks'

type SeverityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical'
type TypeFilter = 'all' | 'motion' | 'intrusion' | 'threshold' | 'person' | 'crowd' | 'object'

export default function EventTimeline() {
  const events = useEventStore((s) => s.events)
  const setEvents = useEventStore((s) => s.setEvents)
  const [filterType, setFilterType] = useState<TypeFilter>('all')
  const [filterSeverity, setFilterSeverity] = useState<SeverityFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  useEffect(() => {
    if (events.length === 0) setEvents(mockEvents)
  }, [events.length, setEvents])

  // WebSocket for real-time event updates
  useWebSocket({
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
    onMessage: (message) => {
      if (message.type === 'new_event') {
        const newEvent = message.payload as typeof mockEvents[0]
        useEventStore.getState().addEvent(newEvent)
      }
    },
  })

  const filteredEvents = events
    .filter((event) => {
      if (filterType !== 'all') {
        const eventTypeLower = event.type.toLowerCase()
        if (filterType === 'motion' && !eventTypeLower.includes('motion')) return false
        if (filterType === 'intrusion' && !eventTypeLower.includes('intrusion')) return false
        if (filterType === 'threshold' && !eventTypeLower.includes('threshold')) return false
        if (filterType === 'person' && !eventTypeLower.includes('person')) return false
        if (filterType === 'crowd' && !eventTypeLower.includes('crowd')) return false
        if (filterType === 'object' && !eventTypeLower.includes('object')) return false
      }
      if (filterSeverity !== 'all' && event.severity !== filterSeverity) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          event.type.toLowerCase().includes(query) ||
          event.cameraName.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query)
        )
      }
      return true
    })
    .sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime()
      const timeB = new Date(b.timestamp).getTime()
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB
    })

  const typeCounts = {
    all: events.length,
    motion: events.filter((e) => e.type.toLowerCase().includes('motion')).length,
    intrusion: events.filter((e) => e.type.toLowerCase().includes('intrusion')).length,
    threshold: events.filter((e) => e.type.toLowerCase().includes('threshold')).length,
    person: events.filter((e) => e.type.toLowerCase().includes('person')).length,
    crowd: events.filter((e) => e.type.toLowerCase().includes('crowd')).length,
    object: events.filter((e) => e.type.toLowerCase().includes('object')).length,
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100">Event Timeline</h1>
        <div className="flex items-center gap-2">
          <Badge variant="high">{filteredEvents.length} events</Badge>
          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="text-sm text-neon-cyan hover:underline"
          >
            Sort: {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
          </button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-400 mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full px-3 py-2 border border-dark-surface bg-dark-bg text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neon-cyan"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-400 mb-1">Event Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as TypeFilter)}
              className="w-full px-3 py-2 border border-dark-surface bg-dark-bg text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neon-cyan"
            >
              <option value="all">All Events ({typeCounts.all})</option>
              <option value="motion">Motion Detected ({typeCounts.motion})</option>
              <option value="intrusion">Intrusion Alert ({typeCounts.intrusion})</option>
              <option value="threshold">Threshold Exceeded ({typeCounts.threshold})</option>
              <option value="person">Person Detected ({typeCounts.person})</option>
              <option value="crowd">Crowd Forming ({typeCounts.crowd})</option>
              <option value="object">Object Event ({typeCounts.object})</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-400 mb-1">Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as SeverityFilter)}
              className="w-full px-3 py-2 border border-dark-surface bg-dark-bg text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neon-cyan"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredEvents.map((event) => (
          <Link key={event.id} to={`/event/${event.id}`}>
            <EventCard event={event} />
          </Link>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No events match the current filters.</p>
          <button
            onClick={() => { setFilterType('all'); setFilterSeverity('all'); setSearchQuery('') }}
            className="mt-4 text-neon-cyan hover:underline"
          >
            Clear filters
          </button>
        </Card>
      )}
    </div>
  )
}
