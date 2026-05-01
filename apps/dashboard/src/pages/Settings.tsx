import { useState } from 'react'
import { Card, Button, Input, Select } from '@/components/ui'
import { useAlertStore } from '@/stores/alertStore'

type Tab = 'thresholds' | 'rules' | 'notifications' | 'integrations'

interface Rule {
  id: string
  name: string
  condition: string
  action: string
  enabled: boolean
  cameraId?: string
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('rules')
  const thresholds = useAlertStore((s) => s.thresholds)
  const updateThreshold = useAlertStore((s) => s.updateThreshold)
  const [rules, setRules] = useState<Rule[]>([
    { id: '1', name: 'After-Hours Motion', condition: 'Motion detected after 10PM', action: 'Send Telegram Alert', enabled: true, cameraId: '1' },
    { id: '2', name: 'Noise Threshold', condition: 'Noise > 70% for 30s', action: 'Send Email + Dashboard Alert', enabled: true, cameraId: '2' },
    { id: '3', name: 'Intrusion Detection', condition: 'Person detected in restricted zone', action: 'Send SMS + Telegram Alert', enabled: true },
    { id: '4', name: 'Phone Detection', condition: 'Cell phone detected during exam', action: 'Dashboard Alert Only', enabled: false, cameraId: '2' },
    { id: '5', name: 'Crowd Warning', condition: 'Occupancy > 80%', action: 'Send Telegram Alert', enabled: true },
  ])
  const [showRuleBuilder, setShowRuleBuilder] = useState(false)
  const [newRule, setNewRule] = useState<Partial<Rule>>({
    name: '',
    condition: '',
    action: '',
    enabled: true,
  })

  const tabs = [
    { id: 'thresholds' as Tab, label: 'Thresholds' },
    { id: 'rules' as Tab, label: 'Rules' },
    { id: 'notifications' as Tab, label: 'Notifications' },
    { id: 'integrations' as Tab, label: 'Integrations' },
  ]

  const handleAddRule = () => {
    if (!newRule.name || !newRule.condition || !newRule.action) return

    const rule: Rule = {
      id: `rule-${Date.now()}`,
      name: newRule.name,
      condition: newRule.condition,
      action: newRule.action,
      enabled: true,
      cameraId: newRule.cameraId,
    }

    setRules((prev) => [...prev, rule])
    setNewRule({ name: '', condition: '', action: '', enabled: true })
    setShowRuleBuilder(false)
  }

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    )
  }

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== id))
  }

  const conditionOptions = [
    'Motion detected',
    'Person detected',
    'Noise threshold exceeded',
    'Intrusion in zone',
    'Cell phone detected',
    'Crowd threshold exceeded',
    'Object left behind',
    'Low attention detected',
  ]

  const actionOptions = [
    'Send Telegram Alert',
    'Send Email Notification',
    'Send SMS',
    'Dashboard Alert Only',
    'Trigger Webhook',
    'Record Video Clip',
  ]

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-surface">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
              activeTab === tab.id
                ? 'text-neon-cyan border-neon-cyan'
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Thresholds Tab */}
      {activeTab === 'thresholds' && (
        <div className="space-y-6">
          <Card className="p-4">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Alert Thresholds</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Motion Sensitivity</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={thresholds.motionSensitivity}
                    onChange={(e) => updateThreshold('motionSensitivity', Number(e.target.value))}
                    className="flex-1 h-2 bg-dark-surface rounded-full appearance-none cursor-pointer accent-neon-cyan"
                  />
                  <span className="w-12 text-center font-medium text-neon-cyan">
                    {thresholds.motionSensitivity}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">Detects movement intensity and triggers alerts</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Noise Threshold</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={thresholds.noiseThreshold}
                    onChange={(e) => updateThreshold('noiseThreshold', Number(e.target.value))}
                    className="flex-1 h-2 bg-dark-surface rounded-full appearance-none cursor-pointer accent-neon-magenta"
                  />
                  <span className="w-12 text-center font-medium text-neon-magenta">
                    {thresholds.noiseThreshold}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">Classroom noise level limit before triggering alerts</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Intrusion Delay</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="5"
                    max="120"
                    value={thresholds.intrusionDelay}
                    onChange={(e) => updateThreshold('intrusionDelay', Number(e.target.value))}
                    className="flex-1 h-2 bg-dark-surface rounded-full appearance-none cursor-pointer accent-neon-lime"
                  />
                  <span className="w-12 text-center font-medium text-neon-lime">
                    {thresholds.intrusionDelay}s
                  </span>
                </div>
                <p className="text-xs text-gray-500">Seconds before intrusion alert triggers</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Face Recognition Distance</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={thresholds.faceRecognitionDistance}
                    onChange={(e) => updateThreshold('faceRecognitionDistance', Number(e.target.value))}
                    className="flex-1 h-2 bg-dark-surface rounded-full appearance-none cursor-pointer accent-yellow-400"
                  />
                  <span className="w-12 text-center font-medium text-yellow-400">
                    {thresholds.faceRecognitionDistance}m
                  </span>
                </div>
                <p className="text-xs text-gray-500">Maximum distance for face recognition</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-100">Alert Rules</h2>
            <Button variant="primary" onClick={() => setShowRuleBuilder(!showRuleBuilder)}>
              {showRuleBuilder ? 'Cancel' : '+ Add Rule'}
            </Button>
          </div>

          {/* Rule Builder */}
          {showRuleBuilder && (
            <Card className="p-4 border border-neon-cyan/30">
              <h3 className="font-medium text-gray-100 mb-4">Create New Rule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Rule Name</label>
                  <Input
                    value={newRule.name || ''}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="e.g., After-Hours Motion Alert"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Condition</label>
                  <Select
                    value={newRule.condition || ''}
                    onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                    className="w-full"
                  >
                    <option value="">Select condition...</option>
                    {conditionOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Action</label>
                  <Select
                    value={newRule.action || ''}
                    onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                    className="w-full"
                  >
                    <option value="">Select action...</option>
                    {actionOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Camera (Optional)</label>
                  <Select
                    value={newRule.cameraId || ''}
                    onChange={(e) => setNewRule({ ...newRule, cameraId: e.target.value })}
                    className="w-full"
                  >
                    <option value="">All Cameras</option>
                    <option value="1">Main Entrance</option>
                    <option value="2">Classroom 101</option>
                    <option value="3">Parking Lot North</option>
                    <option value="5">Cafeteria</option>
                  </Select>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowRuleBuilder(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleAddRule}>
                  Create Rule
                </Button>
              </div>
            </Card>
          )}

          {/* Rules List */}
          <div className="space-y-4">
            {rules.map((rule) => (
              <Card key={rule.id} className={`p-4 transition-all ${rule.enabled ? 'border-dark-surface' : 'border-dark-surface opacity-60'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                        rule.enabled
                          ? 'bg-neon-cyan border-neon-cyan'
                          : 'bg-transparent border-dark-card'
                      }`}
                    >
                      {rule.enabled && (
                        <svg className="w-3 h-3 text-dark-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <div>
                      <h3 className="font-medium text-gray-200">{rule.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{rule.condition}</p>
                      <p className="text-sm text-neon-cyan mt-1">Action: {rule.action}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">Notification Channels</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-dark-surface rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                  💬
                </div>
                <div>
                  <p className="font-medium text-gray-200">Telegram</p>
                  <p className="text-sm text-gray-500">Connected @OpenVisionBot</p>
                </div>
              </div>
              <span className="text-sm text-neon-lime">Active</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-dark-surface rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center text-red-400">
                  ✉️
                </div>
                <div>
                  <p className="font-medium text-gray-200">Email (SES)</p>
                  <p className="text-sm text-gray-500">alerts@openvision.ai</p>
                </div>
              </div>
              <span className="text-sm text-neon-lime">Active</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-dark-surface rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-400">
                  📱
                </div>
                <div>
                  <p className="font-medium text-gray-200">SMS (SNS)</p>
                  <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
                </div>
              </div>
              <Button variant="secondary" className="text-xs py-1 px-2">Configure</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">External Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-dark-surface rounded-lg border border-dark-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                  🤖
                </div>
                <div>
                  <p className="font-medium text-gray-200">AWS Bedrock AI</p>
                  <p className="text-xs text-gray-500">Claude 3 Sonnet</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">AI-powered event summaries and natural language queries</p>
              <div className="mt-3">
                <span className="text-xs text-neon-lime">● Connected</span>
              </div>
            </div>
            <div className="p-4 bg-dark-surface rounded-lg border border-dark-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400">
                  📊
                </div>
                <div>
                  <p className="font-medium text-gray-200">Analytics</p>
                  <p className="text-xs text-gray-500">Local Analytics Engine</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">Engagement insights and trend analysis</p>
              <div className="mt-3">
                <span className="text-xs text-neon-lime">● Active</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
