import { Router, Request, Response } from 'express';
import { Camera, CameraStatus } from '../types';

const router = Router();

// Mock data store
const mockCameras: Camera[] = [
  {
    id: 'cam-001',
    name: 'Main Entrance',
    location: 'Building A, Floor 1',
    orgId: 'org-001',
    status: CameraStatus.ACTIVE,
    mode: 'security',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cam-002',
    name: 'Classroom A101',
    location: 'Building A, Floor 2',
    orgId: 'org-001',
    status: CameraStatus.ACTIVE,
    mode: 'classroom',
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cam-003',
    name: 'Parking Lot North',
    location: 'Parking Structure B',
    orgId: 'org-001',
    status: CameraStatus.ACTIVE,
    mode: 'security',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cam-004',
    name: 'Cafeteria',
    location: 'Building B, Ground Floor',
    orgId: 'org-001',
    status: CameraStatus.MAINTENANCE,
    mode: 'monitoring',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const isAwsConfigured = (): boolean => {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
};

// GET /cameras - List all cameras
router.get('/', async (req: Request, res: Response) => {
  try {
    // Validate pagination params
    let page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 10;

    // Ensure valid ranges
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const offset = (page - 1) * limit;

    if (isAwsConfigured()) {
      // Use DynamoDB
      const { getDocClient, getTableName } = await import('../aws/config');
      const { ScanCommand } = await import('@aws-sdk/client-dynamodb');

      const client = getDocClient();
      const result = await client.send(new ScanCommand({
        TableName: getTableName('cameras'),
        Limit: limit,
        ExclusiveStartKey: offset > 0 ? { id: { S: `cam-${offset}` } } : undefined
      }));

      const cameras = (result.Items || []).map((item: any) => ({
        id: item.id.S,
        name: item.name.S,
        location: item.location.S,
        orgId: item.orgId.S,
        status: item.status.S,
        mode: item.mode?.S,
        createdAt: item.createdAt.S,
        updatedAt: item.updatedAt.S
      }));

      return res.json({
        success: true,
        data: {
          items: cameras,
          total: result.Count || 0,
          page,
          limit
        }
      });
    }

    // Mock data fallback
    const items = mockCameras.slice(offset, offset + limit);
    return res.json({
      success: true,
      data: {
        items,
        total: mockCameras.length,
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Error listing cameras:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve cameras',
      data: null
    });
  }
});

// Helper to extract user orgId from token (simplified for demo)
const getUserOrgId = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  try {
    const jwt = require('jsonwebtoken');
    const token = authHeader.replace('Bearer ', '');
    const secret = process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production';
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    return decoded.orgId || null;
  } catch {
    return null;
  }
};

// GET /cameras/:id - Get single camera
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userOrgId = getUserOrgId(req);

    if (isAwsConfigured()) {
      const { getDocClient, getTableName } = await import('../aws/config');
      const { GetItemCommand } = await import('@aws-sdk/client-dynamodb');

      const client = getDocClient();
      const result = await client.send(new GetItemCommand({
        TableName: getTableName('cameras'),
        Key: { id: { S: id } }
      }));

      if (!result.Item) {
        return res.status(404).json({
          success: false,
          error: 'Camera not found',
          data: null
        });
      }

      const camera = {
        id: result.Item.id.S,
        name: result.Item.name.S,
        location: result.Item.location.S,
        orgId: result.Item.orgId.S,
        status: result.Item.status.S,
        mode: result.Item.mode?.S,
        createdAt: result.Item.createdAt.S,
        updatedAt: result.Item.updatedAt.S
      };

      return res.json({ success: true, data: camera, error: null });
    }

    // Mock data fallback
    const camera = mockCameras.find(c => c.id === id);
    if (!camera) {
      return res.status(404).json({
        success: false,
        error: 'Camera not found',
        data: null
      });
    }

    // Check org authorization
    if (userOrgId && camera.orgId !== userOrgId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this camera',
        data: null
      });
    }

    return res.json({ success: true, data: camera, error: null });
  } catch (error) {
    console.error('Error getting camera:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve camera',
      data: null
    });
  }
});

// PUT /cameras/:id/mode - Update camera mode
router.put('/:id/mode', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { mode } = req.body;
    const userOrgId = getUserOrgId(req);

    if (!mode || !['security', 'classroom', 'monitoring', 'exam'].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mode. Must be: security, classroom, monitoring, or exam',
        data: null
      });
    }

    // Find camera first for org check
    const existingCamera = mockCameras.find(c => c.id === id);
    if (existingCamera && userOrgId && existingCamera.orgId !== userOrgId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this camera',
        data: null
      });
    }

    if (!mode || !['security', 'classroom', 'monitoring', 'exam'].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mode. Must be: security, classroom, monitoring, or exam',
        data: null
      });
    }

    if (isAwsConfigured()) {
      const { getDocClient, getTableName } = await import('../aws/config');
      const { UpdateItemCommand } = await import('@aws-sdk/client-dynamodb');

      const client = getDocClient();
      await client.send(new UpdateItemCommand({
        TableName: getTableName('cameras'),
        Key: { id: { S: id } },
        UpdateExpression: 'SET #m = :mode, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#m': 'mode' },
        ExpressionAttributeValues: {
          ':mode': { S: mode },
          ':updatedAt': { S: new Date().toISOString() }
        }
      }));

      return res.json({ success: true, data: { id, mode }, error: null });
    }

    // Mock data fallback
    const cameraIndex = mockCameras.findIndex(c => c.id === id);
    if (cameraIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Camera not found',
        data: null
      });
    }

    mockCameras[cameraIndex] = {
      ...mockCameras[cameraIndex],
      mode,
      updatedAt: new Date().toISOString()
    };

    // Broadcast camera update
    try {
      const { broadcastCameraUpdate } = await import('../services/websocket');
      broadcastCameraUpdate(mockCameras[cameraIndex]);
    } catch {
      // WebSocket not initialized
    }

    return res.json({ success: true, data: mockCameras[cameraIndex], error: null });
  } catch (error) {
    console.error('Error updating camera mode:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update camera mode',
      data: null
    });
  }
});

export default router;