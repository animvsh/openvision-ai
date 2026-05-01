import { useEffect, useState } from 'react'
import { Card, Badge } from '@/components/ui'
import { useEventStore } from '@/stores/eventStore'
import { EventCard } from '@/components/EventCard'
import { mockEvents } from '@/data/mockData'

type SeverityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical'
type TypeFilter = 'all' | 'motion' | 'intrusion' | 'threshold' | 'person' | 'crowd' | 'object' | 'phone'
type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d'

export default function Events() {
  const events = useEventStore((s) => s.events)
  const setEvents = useEventStore((s) => s.setEvents)
  const [filterType, setFilterType] = useState<TypeFilter>('all')
  const [filterSeverity, setFilterSeverity] = useState<SeverityFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')

  useEffect(() => {
    if (events.length === 0) setEvents(mockEvents)
  }, [events.length, setEvents])

  const getTimeRangeStart = (range: TimeRange): Date => {
    const now = new Date()
    switch (range) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000)
      case '6h': return new Date(now.getTime() - 6 * 60 * 60 * 1000)
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  const filteredEvents = events
    .filter((event) => {
      // Time range filter
      const eventTime = new Date(event.timestamp)
      if (eventTime < getTimeRangeStart(timeRange)) return false

      // Type filter
      if (filterType !== 'all') {
        const eventTypeLower = event.type.toLowerCase()
        if (filterType === 'motion' && !eventTypeLower.includes('motion')) return false
        if (filterType === 'intrusion' && !eventTypeLower.includes('intrusion')) return false
        if (filterType === 'threshold' && !eventTypeLower.includes('threshold')) return false
        if (filterType === 'person' && !eventTypeLower.includes('person')) return false
        if (filterType === 'crowd' && !eventTypeLower.includes('crowd')) return false
        if (filterType === 'object' && !eventTypeLower.includes('object')) return false
        if (filterType === 'phone' && !eventTypeLower.includes('phone')) return false
      }

      // Severity filter
      if (filterSeverity !== 'all' && event.severity !== filterSeverity) return false

      // Search query
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

  const severityCounts = {
    all: filteredEvents.length,
    critical: filteredEvents.filter((e) => e.severity === 'critical').length,
    high: filteredEvents.filter((e) => e.severity === 'high').length,
    medium: filteredEvents.filter((e) => e.severity === 'medium').length,
    low: filteredEvents.filter((e) => e.severity === 'low').length,
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100">Events</h1>
        <div className="flex items-center gap-4">
          <Badge variant="high">{filteredEvents.length} events</Badge>
          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="text-sm text-neon-cyan hover:underline"
          >
            Sort: {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Time Range:</span>
          <div className="flex gap-2">
            {(['1h', '6h', '24h', '7d', '30d'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded transition-all ${
                  timeRange === range
                    ? 'bg-neon-cyan text-dark-bg font-medium shadow-[0_0_10px_rgba(0,255,255,0.4)]'
                    : 'bg-dark-surface text-gray-400 hover:text-gray-200 hover:bg-dark-card'
                }`}
              >
                {range === '1h' ? '1 Hour' :
                 range === '6h' ? '6 Hours' :
                 range === '24h' ? '24 Hours' :
                 range === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Filters */}
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
              <option value="all">All Events</option>
              <option value="motion">Motion Detected</option>
              <option value="intrusion">Intrusion Alert</option>
              <option value="threshold">Threshold Exceeded</option>
              <option value="person">Person Detected</option>
              <option value="crowd">Crowd Forming</option>
              <option value="object">Object Event</option>
              <option value="phone">Phone Detected</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-400 mb-1">Severity</label>
            <div className="flex gap-2">
              {(['all', 'critical', 'high', 'medium', 'low'] as SeverityFilter[]).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`flex-1 px-2 py-2 text-xs rounded transition-all ${
                    filterSeverity === sev
                      ? sev === 'critical' ? 'bg-red-600 text-white' :
                        sev === 'high' ? 'bg-red-500 text-white' :
                        sev === 'medium' ? 'bg-yellow-500 text-dark-bg' :
                        'bg-neon-lime text-dark-bg'
                      : 'bg-dark-surface text-gray-400 hover:bg-dark-card'
                  }`}
                >
                  {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
                  {sev !== 'all' && (
                    <span className="ml-1 opacity-70">
                      ({sev === 'critical' ? severityCounts.critical :
                        sev === 'high' ? severityCounts.high :
                        sev === 'medium' ? severityCounts.medium :
                        severityCounts.low})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Severity Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-3 text-center border-l-4 border-l-red-500">
          <p className="text-2xl font-bold text-red-400">{severityCounts.critical}</p>
          <p className="text-xs text-gray-500">Critical</p>
        </Card>
        <Card className="p-3 text-center border-l-4 border-l-orange-500">
          <p className="text-2xl font-bold text-orange-400">{severityCounts.high}</p>
          <p className="text-xs text-gray-500">High</p>
        </Card>
        <Card className="p-3 text-center border-l-4 border-l-yellow-500">
          <p className="text-2xl font-bold text-yellow-400">{severityCounts.medium}</p>
          <p className="text-xs text-gray-500">Medium</p>
        </Card>
        <Card className="p-3 text-center border-l-4 border-l-green-500">
          <p className="text-2xl font-bold text-neon-lime">{severityCounts.low}</p>
          <p className="text-xs text-gray-500">Low</p>
        </Card>
      </div>

      {/* Event List */}
      <div className="space-y-4">
        {filteredEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No events match the current filters.</p>
          <button
            onClick={() => {
              setFilterType('all')
              setFilterSeverity('all')
              setSearchQuery('')
              setTimeRange('24h')
            }}
            className="mt-4 text-neon-cyan hover:underline"
          >
            Clear filters
          </button>
        </Card>
      )}
    </div>
  )
}
