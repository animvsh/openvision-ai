import { Router, Request, Response } from 'express';
import { AnalyticsOverview, EngagementAnalytics } from '../types';

const router = Router();

const isAwsConfigured = (): boolean => {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
};

// Mock analytics data
const mockAnalytics: AnalyticsOverview = {
  totalEvents: 1247,
  activeSessions: 8,
  camerasOnline: 12,
  eventsBySeverity: {
    low: 523,
    medium: 412,
    high: 287,
    critical: 25
  },
  recentAlerts: 15
};

const mockEngagement: EngagementAnalytics = {
  totalEngagements: 3892,
  engagementRate: 0.78,
  averageSessionDuration: 42.5,
  topCameras: [
    { cameraId: 'cam-001', engagementCount: 847 },
    { cameraId: 'cam-002', engagementCount: 632 },
    { cameraId: 'cam-003', engagementCount: 498 }
  ],
  hourlyDistribution: {
    '0': 45, '1': 32, '2': 28, '3': 22, '4': 18, '5': 25,
    '6': 67, '7': 189, '8': 342, '9': 456, '10': 398, '11': 312,
    '12': 287, '13': 245, '14': 356, '15': 412, '16': 378, '17': 298,
    '18': 267, '19': 234, '20': 187, '21': 145, '22': 98, '23': 67
  }
};

// GET /analytics/engagement - Get engagement analytics
router.get('/engagement', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string || '24h';
    const cameraId = req.query.camera_id as string;

    if (isAwsConfigured()) {
      const { getDocClient, getTableName } = await import('../aws/config');
      const { QueryCommand } = await import('@aws-sdk/client-dynamodb');

      const client = getDocClient();

      // Calculate time range
      const now = new Date();
      let startTime: Date;
      switch (period) {
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const result = await client.send(new QueryCommand({
        TableName: getTableName('events'),
        IndexName: 'createdAt-index',
        KeyConditionExpression: 'createdAt BETWEEN :start AND :end',
        ExpressionAttributeValues: {
          ':start': { S: startTime.toISOString() },
          ':end': { S: now.toISOString() }
        }
      }));

      // Calculate engagement from events
      const events = result.Items || [];
      const totalEngagements = events.length;

      // Group by hour
      const hourlyDistribution: Record<string, number> = {};
      events.forEach((event: any) => {
        const hour = new Date(event.createdAt.S).getHours().toString();
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      });

      return res.json({
        success: true,
        data: {
          totalEngagements,
          engagementRate: totalEngagements / (24 * 60), // engagements per minute
          averageSessionDuration: totalEngagements > 0 ? totalEngagements / 60 : 0,
          topCameras: [],
          hourlyDistribution,
          period
        },
        error: null
      });
    }

    // Mock data fallback
    return res.json({
      success: true,
      data: {
        ...mockEngagement,
        period,
        cameraId: cameraId || null
      },
      error: null
    });
  } catch (error) {
    console.error('Error getting engagement analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve engagement analytics',
      data: null
    });
  }
});

// GET /analytics/events - Get events analytics
router.get('/events', async (req: Request, res: Response) => {
  try {
    const period = req.query.period as string || '24h';
    const groupBy = req.query.group_by as string || 'severity';

    // Validate groupBy parameter
    const validGroupByValues = ['severity', 'status', 'camera'];
    if (!validGroupByValues.includes(groupBy)) {
      return res.status(400).json({
        success: false,
        error: `Invalid group_by value. Must be one of: ${validGroupByValues.join(', ')}`,
        data: null
      });
    }

    if (isAwsConfigured()) {
      const { getDocClient, getTableName } = await import('../aws/config');
      const { QueryCommand, ScanCommand } = await import('@aws-sdk/client-dynamodb');

      const client = getDocClient();

      // Calculate time range
      const now = new Date();
      let startTime: Date;
      switch (period) {
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      // Build filter expression with camera_id if provided
      let filterExpression = 'createdAt >= :start';
      const expressionValues: Record<string, any> = {
        ':start': { S: startTime.toISOString() }
      };

      const cameraId = req.query.camera_id as string;
      if (cameraId) {
        filterExpression += ' AND cameraId = :cameraId';
        expressionValues[':cameraId'] = { S: cameraId };
      }

      const result = await client.send(new ScanCommand({
        TableName: getTableName('events'),
        FilterExpression: filterExpression,
        ExpressionAttributeValues: expressionValues
      }));

      const events = result.Items || [];
      const totalEvents = events.length;

      // Group by specified field
      let groupedData: Record<string, number> = {};
      if (groupBy === 'severity') {
        events.forEach((event: any) => {
          const severity = event.severity.S;
          groupedData[severity] = (groupedData[severity] || 0) + 1;
        });
      } else if (groupBy === 'status') {
        events.forEach((event: any) => {
          const status = event.status.S;
          groupedData[status] = (groupedData[status] || 0) + 1;
        });
      } else if (groupBy === 'camera') {
        events.forEach((event: any) => {
          const cameraId = event.cameraId.S;
          groupedData[cameraId] = (groupedData[cameraId] || 0) + 1;
        });
      }

      return res.json({
        success: true,
        data: {
          totalEvents,
          eventsByGroup: groupedData,
          period,
          groupBy
        },
        error: null
      });
    }

    // Mock data fallback
    let groupedData: Record<string, number> = {};

    if (groupBy === 'severity') {
      groupedData = { ...mockAnalytics.eventsBySeverity };
    } else if (groupBy === 'status') {
      groupedData = { new: 156, escalated: 89, dismissed: 234, resolved: 768 };
    } else if (groupBy === 'camera') {
      groupedData = {
        'cam-001': 423,
        'cam-002': 312,
        'cam-003': 287,
        'cam-004': 225
      };
    }

    return res.json({
      success: true,
      data: {
        totalEvents: mockAnalytics.totalEvents,
        eventsByGroup: groupedData,
        period,
        groupBy,
        eventsBySeverity: mockAnalytics.eventsBySeverity,
        recentAlerts: mockAnalytics.recentAlerts
      },
      error: null
    });
  } catch (error) {
    console.error('Error getting events analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve events analytics',
      data: null
    });
  }
});

export default router;