import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Dashboard, CameraGrid, LiveCamera, Events, Analytics, AIAssistant, Settings, Health } from './pages'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-bg">
        <nav className="bg-dark-surface border-b border-dark-card px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="text-xl font-bold text-neon-cyan hover:shadow-[0_0_15px_rgba(0,255,255,0.5)] transition-all">
                OpenVision AI
              </Link>
              <div className="flex gap-4 text-sm">
                <Link to="/" className="text-gray-400 hover:text-neon-cyan transition-colors">Dashboard</Link>
                <Link to="/cameras" className="text-gray-400 hover:text-neon-cyan transition-colors">Cameras</Link>
                <Link to="/events" className="text-gray-400 hover:text-neon-cyan transition-colors">Events</Link>
                <Link to="/analytics" className="text-gray-400 hover:text-neon-cyan transition-colors">Analytics</Link>
                <Link to="/ai" className="text-gray-400 hover:text-neon-cyan transition-colors">AI Assistant</Link>
                <Link to="/health" className="text-gray-400 hover:text-neon-cyan transition-colors">Health</Link>
                <Link to="/settings" className="text-gray-400 hover:text-neon-cyan transition-colors">Settings</Link>
              </div>
            </div>
            <div className="text-sm text-gray-500">OpenVision AI Dashboard</div>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cameras" element={<CameraGrid />} />
          <Route path="/camera/:id" element={<LiveCamera />} />
          <Route path="/events" element={<Events />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai" element={<AIAssistant />} />
          <Route path="/health" element={<Health />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
