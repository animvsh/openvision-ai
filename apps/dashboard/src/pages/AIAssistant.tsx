import { useState, useEffect, useRef } from 'react'
import { Card, Button, Select } from '@/components/ui'
import { useCameraStore } from '@/stores/cameraStore'
import { mockCameras } from '@/data/mockData'
import { generateEventSummary, isBedrockConfigured } from '@/services/aws/bedrock'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIAssistant() {
  const cameras = useCameraStore((s) => s.cameras)
  const setCameras = useCameraStore((s) => s.setCameras)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cameras.length === 0) setCameras(mockCameras)
    checkConfiguration()
  }, [cameras.length, setCameras])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkConfiguration = async () => {
    const configured = await isBedrockConfigured()
    setIsConfigured(configured)
  }

  const exampleQueries = [
    'Show me all motion events from Classroom 101',
    'Which cameras had intrusion alerts today?',
    'What is the focus score for Library cameras?',
    'List all critical events from the last 24 hours',
    'Compare crowd levels between Cafeteria and Gymnasium',
    'Generate a summary of today\'s security events',
    'Show camera uptime for all security mode cameras',
    'What threshold exceeded events occurred this week?',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Simulate AI processing with context
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const selectedCamera = cameras.find((c) => c.id === selectedCameraId)
      const cameraContext = selectedCamera
        ? `Camera: ${selectedCamera.name} (${selectedCamera.mode} mode)`
        : 'All cameras'

      let response: string

      if (isConfigured) {
        // Use Bedrock when configured
        const event = {
          type: input,
          cameraName: selectedCamera?.name || 'Multiple cameras',
          timestamp: new Date().toISOString(),
          detectionDetails: `Query context: ${cameraContext}`,
        }
        response = await generateEventSummary(event)
      } else {
        // Fallback response
        response = generateFallbackResponse(input, cameraContext)
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('AI Assistant error:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const generateFallbackResponse = (query: string, cameraContext: string): string => {
    const queryLower = query.toLowerCase()

    if (queryLower.includes('motion') || queryLower.includes('movement')) {
      return `Based on ${cameraContext}:\n\nI found 3 motion detection events in the last 24 hours. The Main Entrance camera shows the most activity with 12 motion events, primarily during business hours (8 AM - 6 PM). Classroom 101 had minimal motion (2 events) indicating normal class activity.\n\nRecommendation: Adjust motion sensitivity thresholds if needed for your environment.`
    }

    if (queryLower.includes('intrusion') || queryLower.includes('breach') || queryLower.includes('unauthorized')) {
      return `Security Alert Analysis for ${cameraContext}:\n\n2 intrusion alerts were detected today:\n\n1. **Parking Lot North** (2:15 AM) - Unauthorized person detected in restricted area after hours. Person was on-site for 12 minutes before leaving.\n\n2. **Main Entrance** (6:30 AM) - Door held open for extended period (45 seconds), potential security breach.\n\nAction Taken: Security personnel notified via Telegram alert.`
    }

    if (queryLower.includes('focus') || queryLower.includes('attention') || queryLower.includes('classroom')) {
      return `Classroom Engagement Insights for ${cameraContext}:\n\n- **Classroom 101**: Focus Score 85% (28 students) - Above target threshold\n- **Library**: Focus Score 72% (15 occupants) - Within acceptable range\n- Average noise level: Normal (42 dB)\n\nNo threshold violations detected in the last 24 hours.`
    }

    if (queryLower.includes('critical') || queryLower.includes('alert')) {
      return `Critical Events Summary from ${cameraContext}:\n\n**1 Critical Event:**\n- Classroom 101 - Noise threshold exceeded at 10:45 AM\n- Duration: 3 minutes\n- Possible cause: Elevated discussion or coughing\n\nAll other events are at low/medium severity.`
    }

    if (queryLower.includes('crowd') || queryLower.includes('occupancy') || queryLower.includes('people')) {
      return `Crowd/Occupancy Analysis for ${cameraContext}:\n\nCurrent occupancy levels:\n- Cafeteria: 67% (134/200 capacity)\n- Gymnasium: 45% (18/40 participants)\n- Library: 42% (21/50 capacity)\n\nPeak hours observed: 12:00 PM - 1:30 PM (Lunch period)\n\nNo crowd threshold violations in the last 24 hours.`
    }

    if (queryLower.includes('summary') || queryLower.includes('overview') || queryLower.includes('today')) {
      return `Daily Security Summary for ${cameraContext}:\n\n**Total Events:** 12\n**Alerts:** 3 (1 critical, 2 medium)\n**Security Score:** 78/100\n\n**Key Observations:**\n- All cameras operational (7/8 online)\n- Normal visitor traffic at Main Entrance\n- No unauthorized access detected\n- Classroom environments within normal parameters\n\n**Recommended Actions:**\n- Schedule maintenance for Reception Area camera (offline)\n- Review Parking Lot North after-hours sensitivity`
    }

    return `Query processed for ${cameraContext}:\n\nI understand you're asking about "${query}". As an AI assistant for OpenVision, I can help you with:\n\n- Camera event analysis and summaries\n- Security alert explanations\n- Engagement metrics for classrooms\n- Crowd and occupancy insights\n- System health and camera status\n\nTry asking in a more specific way, for example: "Show me all intrusion alerts today" or "What is the focus score for Library cameras?"`
  }

  const handleExampleQuery = (query: string) => {
    setInput(query)
  }

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100">AI Assistant</h1>
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <span className="flex items-center gap-2 text-xs text-neon-lime">
              <span className="w-2 h-2 rounded-full bg-neon-lime animate-pulse" />
              AWS Bedrock Connected
            </span>
          ) : (
            <span className="flex items-center gap-2 text-xs text-yellow-500">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              Demo Mode
            </span>
          )}
        </div>
      </div>

      {/* Camera Selector */}
      <Card className="p-4">
        <label className="block text-sm font-medium text-gray-400 mb-2">Query specific camera (optional)</label>
        <Select
          value={selectedCameraId}
          onChange={(e) => setSelectedCameraId(e.target.value)}
          className="w-full max-w-md"
        >
          <option value="">All Cameras</option>
          {cameras.map((camera) => (
            <option key={camera.id} value={camera.id}>
              {camera.name} - {camera.mode} ({camera.status})
            </option>
          ))}
        </Select>
      </Card>

      {/* Example Queries */}
      <div>
        <p className="text-sm text-gray-400 mb-2">Try these queries:</p>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.slice(0, 4).map((query, idx) => (
            <button
              key={idx}
              onClick={() => handleExampleQuery(query)}
              className="px-3 py-1 text-xs bg-dark-surface text-gray-400 rounded-full hover:bg-dark-card hover:text-gray-200 transition-all border border-dark-card hover:border-neon-cyan/30"
            >
              {query}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 p-4 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">🤖</div>
                <p className="text-gray-500 mb-4">Ask me anything about your camera events and analytics</p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Natural language queries about camera events</p>
                  <p>• Security alert explanations</p>
                  <p>• Engagement and occupancy insights</p>
                  <p>• Daily summaries and trends</p>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                    : 'bg-dark-surface text-gray-200 border border-dark-card'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-dark-surface border border-dark-card rounded-lg p-3">
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about camera events, alerts, or analytics..."
            className="flex-1 px-3 py-2 border border-dark-surface bg-dark-bg text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neon-cyan"
            disabled={isLoading}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !input.trim()}
            className="px-6"
          >
            {isLoading ? 'Processing...' : 'Send'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
