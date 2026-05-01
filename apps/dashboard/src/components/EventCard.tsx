import { Card, Badge } from '@/components/ui'
import { Event } from '@/data/mockData'

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="font-semibold">{event.type}</h3>
          <p className="text-sm text-gray-500">{event.cameraName}</p>
          <p className="text-xs text-gray-400">{new Date(event.timestamp).toLocaleString()}</p>
        </div>
        <Badge variant={event.severity}>{event.severity}</Badge>
      </div>
      <p className="mt-2 text-sm text-gray-600">{event.description}</p>
      {event.videoUrl && (
        <p className="mt-1 text-xs text-blue-600">Video available</p>
      )}
    </Card>
  )
}