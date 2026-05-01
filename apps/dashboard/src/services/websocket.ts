// WebSocket service for real-time updates
type MessageHandler = (data: unknown) => void

interface WebSocketService {
  connect: (url: string) => void
  disconnect: () => void
  send: (message: { type: string; payload: unknown }) => void
  on: (event: string, handler: MessageHandler) => void
  off: (event: string, handler: MessageHandler) => void
  isConnected: () => boolean
}

class WebSocketServiceImpl implements WebSocketService {
  private ws: WebSocket | null = null
  private handlers: Map<string, Set<MessageHandler>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private currentUrl: string | null = null

  connect(url: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    this.currentUrl = url

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.emit('connected', null)
      }

      this.ws.onclose = () => {
        this.emit('disconnected', null)
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        this.emit('error', error)
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.emit(message.type, message.payload)
        } catch {
          console.error('Failed to parse WebSocket message')
        }
      }
    } catch {
      this.attemptReconnect()
    }
  }

  disconnect(): void {
    this.maxReconnectAttempts = 0
    this.ws?.close()
    this.ws = null
  }

  send(message: { type: string; payload: unknown }): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  on(event: string, handler: MessageHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
  }

  off(event: string, handler: MessageHandler): void {
    this.handlers.get(event)?.delete(handler)
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private emit(event: string, data: unknown): void {
    this.handlers.get(event)?.forEach((handler) => handler(data))
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }

    this.reconnectAttempts++
    setTimeout(() => {
      if (this.currentUrl) {
        this.connect(this.currentUrl)
      }
    }, this.reconnectDelay)
  }
}

export const websocketService = new WebSocketServiceImpl()
