import { Badge } from '@/components/ui'

interface SeverityBadgeProps {
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const variantMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    critical: 'critical',
  }

  const labelMap: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  }

  return <Badge variant={variantMap[severity] as 'low' | 'medium' | 'high' | 'critical'}>{labelMap[severity]}</Badge>
}