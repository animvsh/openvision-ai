import { useEffect, useState } from 'react'
import { Card } from '@/components/ui'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { mockAnalyticsData, mockOrgStats, weeklyEventsData, modeDistributionData, securityScoreTrendData, eventTypesDistributionData } from '@/data/mockData'
import { useAlertStore } from '@/stores/alertStore'

const COLORS = ['#00FFFF', '#FF00FF', '#eab308', '#22c55e']

export default function Analytics() {
  const thresholds = useAlertStore((s) => s.thresholds)
  const [data, setData] = useState(mockAnalyticsData)

  useEffect(() => {
    // Simulate loading
    setData(mockAnalyticsData)
  }, [])

  const totalEvents = data.reduce((sum, d) => sum + d.events, 0)
  const totalAlerts = data.reduce((sum, d) => sum + d.alerts, 0)
  const avgEngagement = Math.round(data.reduce((sum, d) => sum + d.engagement, 0) / data.length)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Analytics Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-400">Total Events</p>
          <p className="text-3xl font-bold text-gray-200">{totalEvents}</p>
          <p className="text-xs text-gray-500 mt-1">Last 14 days</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-400">Total Alerts</p>
          <p className="text-3xl font-bold text-red-400">{totalAlerts}</p>
          <p className="text-xs text-gray-500 mt-1">Last 14 days</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-400">Avg Engagement</p>
          <p className="text-3xl font-bold text-neon-lime">{avgEngagement}%</p>
          <p className="text-xs text-gray-500 mt-1">Focus score across cameras</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-400">Security Score</p>
          <p className="text-3xl font-bold text-neon-cyan">{mockOrgStats.securityScore}</p>
          <p className="text-xs text-gray-500 mt-1">Current organization score</p>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="font-semibold text-gray-100 mb-4">Events Over Time</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyEventsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A2E" />
              <XAxis dataKey="name" stroke="#888888" />
              <YAxis stroke="#888888" />
              <Tooltip contentStyle={{ backgroundColor: '#16213E', border: '1px solid #1A1A2E', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="events" stroke="#00FFFF" strokeWidth={2} />
              <Line type="monotone" dataKey="alerts" stroke="#FF00FF" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold text-gray-100 mb-4">Mode Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={modeDistributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A2E" />
              <XAxis dataKey="name" stroke="#888888" />
              <YAxis stroke="#888888" />
              <Tooltip contentStyle={{ backgroundColor: '#16213E', border: '1px solid #1A1A2E', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#00FFFF" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="font-semibold text-gray-100 mb-4">Security Score Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={securityScoreTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A2E" />
              <XAxis dataKey="name" stroke="#888888" />
              <YAxis domain={[60, 100]} stroke="#888888" />
              <Tooltip contentStyle={{ backgroundColor: '#16213E', border: '1px solid #1A1A2E', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="score" stroke="#00FF00" fill="#00FF0033" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold text-gray-100 mb-4">Event Types Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={eventTypesDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {eventTypesDistributionData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#16213E', border: '1px solid #1A1A2E', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Daily Analytics Table */}
      <Card className="p-4">
        <h2 className="font-semibold text-gray-100 mb-4">Daily Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-surface">
                <th className="text-left py-2 px-4 text-gray-400">Date</th>
                <th className="text-right py-2 px-4 text-gray-400">Events</th>
                <th className="text-right py-2 px-4 text-gray-400">Alerts</th>
                <th className="text-right py-2 px-4 text-gray-400">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.date} className="border-b border-dark-surface hover:bg-dark-surface/50">
                  <td className="py-2 px-4 text-gray-300">{row.date}</td>
                  <td className="text-right py-2 px-4 text-gray-300">{row.events}</td>
                  <td className="text-right py-2 px-4">
                    <span className={row.alerts > 15 ? 'text-red-400 font-medium' : 'text-gray-300'}>{row.alerts}</span>
                  </td>
                  <td className="text-right py-2 px-4">
                    <span className={row.engagement > 75 ? 'text-neon-lime font-medium' : 'text-gray-300'}>{row.engagement}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Alert Thresholds */}
      <Card className="p-4">
        <h2 className="font-semibold text-gray-100 mb-4">Alert Thresholds Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-dark-surface rounded-lg border border-dark-card">
            <p className="text-sm text-gray-500">Motion Sensitivity</p>
            <p className="text-2xl font-bold text-neon-cyan">{thresholds.motionSensitivity}%</p>
            <p className="text-xs text-gray-500 mt-1">Detects movement intensity</p>
          </div>
          <div className="p-4 bg-dark-surface rounded-lg border border-dark-card">
            <p className="text-sm text-gray-500">Noise Threshold</p>
            <p className="text-2xl font-bold text-neon-magenta">{thresholds.noiseThreshold}%</p>
            <p className="text-xs text-gray-500 mt-1">Classroom noise level limit</p>
          </div>
          <div className="p-4 bg-dark-surface rounded-lg border border-dark-card">
            <p className="text-sm text-gray-500">Intrusion Delay</p>
            <p className="text-2xl font-bold text-neon-lime">{thresholds.intrusionDelay}s</p>
            <p className="text-xs text-gray-500 mt-1">Seconds before alert triggers</p>
          </div>
          <div className="p-4 bg-dark-surface rounded-lg border border-dark-card">
            <p className="text-sm text-gray-500">Face Recognition</p>
            <p className="text-2xl font-bold text-yellow-400">{thresholds.faceRecognitionDistance}m</p>
            <p className="text-xs text-gray-500 mt-1">Max distance for recognition</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
