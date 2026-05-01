/**
 * AI Assistant API Routes
 * Natural language queries for camera data
 */

import { Router, Request, Response } from 'express';
import { queryCamera, AIQueryRequest } from '../services/aiAssistant';

const router = Router();

const successResponse = <T>(data: T) => ({
  success: true,
  data,
  error: null,
});

const errorResponse = (error: string) => ({
  success: false,
  data: null,
  error,
});

router.post('/query', async (req: Request, res: Response) => {
  try {
    const { cameraId, cameraName, query, includeImage } = req.body;

    if (!cameraId || !query) {
      res.status(400).json(errorResponse('Missing required fields: cameraId, query'));
      return;
    }

    const aiRequest: AIQueryRequest = {
      cameraId,
      cameraName,
      query,
      includeImage: includeImage || false,
    };

    const result = await queryCamera(aiRequest);

    if (!result.success) {
      res.status(500).json(errorResponse(result.error || 'AI query failed'));
      return;
    }

    res.json(successResponse({
      response: result.response,
      cameraId: result.cameraId,
      cameraName: result.cameraName,
      timestamp: result.timestamp,
      model: result.model,
    }));
  } catch (error) {
    res.status(500).json(errorResponse(error instanceof Error ? error.message : 'AI query failed'));
  }
});

router.get('/camera/:cameraId/context', async (req: Request, res: Response) => {
  try {
    const { cameraId } = req.params;
    const { getCameraContext } = await import('../services/aiAssistant');

    const context = await getCameraContext(cameraId);

    res.json(successResponse(context));
  } catch (error) {
    res.status(500).json(errorResponse(error instanceof Error ? error.message : 'Failed to get camera context'));
  }
});

router.get('/models', (req: Request, res: Response) => {
  res.json(successResponse([
    { id: 'anthropic.claude-3-sonnet-4-20250514', name: 'Claude 3 Sonnet', provider: 'AWS Bedrock' },
    { id: 'mockClaude', name: 'Mock Claude (Demo)', provider: 'Local Mock' },
  ]));
});

export default router;