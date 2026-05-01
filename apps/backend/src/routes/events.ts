import { Router, Request, Response } from 'express';
import { Event, EventSeverity, EventStatus, ApiResponse } from '../types';

const router = Router();

// Mock data store
const mockEvents: Event[] = [
  {
    id: 'evt-001',
    sessionId: 'sess-001',
    cameraId: 'cam-001',
    orgId: 'org-001',
    ruleId: 'rule-001',
    severity: EventSeverity.HIGH,
    status: EventStatus.NEW,
    description: 'Unauthorized person detected at main entrance',
    aiSummary: 'A person was seen accessing the restricted area without credentials.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'evt-002',
    sessionId: 'sess-002',
    cameraId: 'cam-002',
    orgId: 'org-001',
    ruleId: 'rule-002',
    severity: EventSeverity.MEDIUM,
    status: EventStatus.ESCALATED,
    description: 'Phone usage detected during exam',
    aiSummary: 'Student was observed using a mobile device during the exam period.',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'evt-003',
    sessionId: 'sess-003',
    cameraId: 'cam-003',
    orgId: 'org-001',
    ruleId: 'rule-001',
    severity: EventSeverity.CRITICAL,
    status: EventStatus.RESOLVED,
    description: 'Tailgating attempt detected',
    aiSummary: 'An individual attempted to gain entry by following an authorized person.',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'evt-004',
    cameraId: 'cam-002',
    orgId: 'org-001',
    severity: EventSeverity.LOW,
    status: EventStatus.DISMISSED,
    description: 'Minor movement in hallway',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString()
  }
];

const isAwsConfigured = (): boolean => {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
};

// GET /events - List all events
router.get('/', async (req: Request, res: Response) => {
  try {
    // Validate pagination bounds
    let page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 10;
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const offset = (page - 1) * limit;
    const cameraId = req.query.camera_id as string;
    const severity = req.query.severity as string;
    const status = req.query.status as string;

    if (isAwsConfigured()) {
      const { getDocClient, getTableName } = await import('../aws/config');
      const { ScanCommand } = await import('@aws-sdk/client-dynamodb');

      const client = getDocClient();
      let filterExpression = '';
      const expressionValues: any = {};

      if (cameraId) {
        filterExpression += 'cameraId = :cameraId';
        expressionValues[':cameraId'] = { S: cameraId };
      }
      if (severity) {
        filterExpression += filterExpression ? ' AND ' : '';
        filterExpression += 'severity = :severity';
        expressionValues[':severity'] = { S: severity };
      }
      if (status) {
        filterExpression += filterExpression ? ' AND ' : '';
        filterExpression += '#st = :status';
        expressionValues[':status'] = { S: status };
      }

      const result = await client.send(new ScanCommand({
        TableName: getTableName('events'),
        FilterExpression: filterExpression || undefined,
        ExpressionAttributeValues: Object.keys(expressionValues).length ? expressionValues : undefined,
        ExpressionAttributeNames: status ? { '#st': 'status' } : undefined,
        Limit: limit
      }));

      const events = (result.Items || []).map((item: any) => ({
        id: item.id.S,
        sessionId: item.sessionId?.S,
        cameraId: item.cameraId.S,
        orgId: item.orgId.S,
        ruleId: item.ruleId?.S,
        severity: item.severity.S,
        status: item.status.S,
        description: item.description.S,
        aiSummary: item.aiSummary?.S,
        createdAt: item.createdAt.S,
        updatedAt: item.updatedAt.S
      }));

      return res.json({
        success: true,
        data: {
          items: events,
          total: result.Count || 0,
          page,
          limit
        }
      });
    }

    // Mock data fallback with filtering
    let items = [...mockEvents];
    if (cameraId) items = items.filter(e => e.cameraId === cameraId);
    if (severity) items = items.filter(e => e.severity === severity);
    if (status) items = items.filter(e => e.status === status);

    return res.json({
      success: true,
      data: {
        items: items.slice(offset, offset + limit),
        total: items.length,
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Error listing events:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve events',
      data: null
    });
  }
});

// GET /events/:id - Get single event
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isAwsConfigured()) {
      const { getDocClient, getTableName } = await import('../aws/config');
      const { GetItemCommand } = await import('@aws-sdk/client-dynamodb');

      const client = getDocClient();
      const result = await client.send(new GetItemCommand({
        TableName: getTableName('events'),
        Key: { id: { S: id } }
      }));

      if (!result.Item) {
        return res.status(404).json({
          success: false,
          error: 'Event not found',
          data: null
        });
      }

      const event = {
        id: result.Item.id.S,
        sessionId: result.Item.sessionId?.S,
        cameraId: result.Item.cameraId.S,
        orgId: result.Item.orgId.S,
        ruleId: result.Item.ruleId?.S,
        severity: result.Item.severity.S,
        status: result.Item.status.S,
        description: result.Item.description.S,
        aiSummary: result.Item.aiSummary?.S,
        createdAt: result.Item.createdAt.S,
        updatedAt: result.Item.updatedAt.S
      };

      return res.json({ success: true, data: event, error: null });
    }

    // Mock data fallback
    const event = mockEvents.find(e => e.id === id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        data: null
      });
    }

    return res.json({ success: true, data: event, error: null });
  } catch (error) {
    console.error('Error getting event:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve event',
      data: null
    });
  }
});

// PUT /events/:id/status - Update event status
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [EventStatus.NEW, EventStatus.ESCALATED, EventStatus.DISMISSED, EventStatus.RESOLVED];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        data: null
      });
    }

    if (isAwsConfigured()) {
      const { getDocClient, getTableName } = await import('../aws/config');
      const { UpdateItemCommand } = await import('@aws-sdk/client-dynamodb');

      const client = getDocClient();
      await client.send(new UpdateItemCommand({
        TableName: getTableName('events'),
        Key: { id: { S: id } },
        UpdateExpression: 'SET #st = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: {
          ':status': { S: status },
          ':updatedAt': { S: new Date().toISOString() }
        }
      }));

      return res.json({ success: true, data: { id, status }, error: null });
    }

    // Mock data fallback
    const eventIndex = mockEvents.findIndex(e => e.id === id);
    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        data: null
      });
    }

    mockEvents[eventIndex] = {
      ...mockEvents[eventIndex],
      status,
      updatedAt: new Date().toISOString()
    };

    // Broadcast event update
    try {
      const { broadcastEvent } = await import('../services/websocket');
      broadcastEvent(mockEvents[eventIndex]);
    } catch {
      // WebSocket not initialized
    }

    return res.json({ success: true, data: mockEvents[eventIndex], error: null });
  } catch (error) {
    console.error('Error updating event status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update event status',
      data: null
    });
  }
});

export default router;