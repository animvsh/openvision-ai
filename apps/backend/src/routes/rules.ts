/**
 * Rules API Routes
 * CRUD operations for automation rules
 */

import { Router, Request, Response } from 'express';
import {
  createRule,
  getRules,
  getRuleById,
  getRulesByCameraId,
  updateRule,
  deleteRule,
  Rule,
} from '../services/rulesEngine';

const router = Router();

const successResponse = <T>(data: T, meta?: { total: number; page: number; limit: number }) => ({
  success: true,
  data,
  error: null,
  meta,
});

const errorResponse = (error: string) => ({
  success: false,
  data: null,
  error,
});

router.get('/', (req: Request, res: Response) => {
  const { cameraId, event, enabled } = req.query;

  let rules = getRules();

  if (cameraId && typeof cameraId === 'string') {
    rules = getRulesByCameraId(cameraId);
  }

  if (event && typeof event === 'string') {
    rules = rules.filter((r) => r.event === event);
  }

  if (enabled !== undefined) {
    const isEnabled = enabled === 'true';
    rules = rules.filter((r) => r.enabled === isEnabled);
  }

  res.json(successResponse(rules, { total: rules.length, page: 1, limit: rules.length }));
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const rule = getRuleById(id);

  if (!rule) {
    res.status(404).json(errorResponse('Rule not found'));
    return;
  }

  res.json(successResponse(rule));
});

router.post('/', (req: Request, res: Response) => {
  try {
    const ruleData = req.body;

    if (!ruleData.name || !ruleData.event || !ruleData.action) {
      res.status(400).json(errorResponse('Missing required fields: name, event, action'));
      return;
    }

    const rule = createRule({
      name: ruleData.name,
      cameraId: ruleData.cameraId,
      cameraName: ruleData.cameraName,
      event: ruleData.event,
      condition: ruleData.condition || { type: 'general', data: { description: 'Default rule' } },
      action: ruleData.action,
      enabled: ruleData.enabled !== undefined ? ruleData.enabled : true,
      schedule: ruleData.schedule || 'always',
      days: ruleData.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    });

    res.status(201).json(successResponse(rule));
  } catch (error) {
    res.status(500).json(errorResponse(error instanceof Error ? error.message : 'Failed to create rule'));
  }
});

router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedRule = updateRule(id, updates);

    if (!updatedRule) {
      res.status(404).json(errorResponse('Rule not found'));
      return;
    }

    res.json(successResponse(updatedRule));
  } catch (error) {
    res.status(500).json(errorResponse(error instanceof Error ? error.message : 'Failed to update rule'));
  }
});

router.patch('/:id', (req: Request, res: Response) => {
  router.put('/:id')(req, res);
});

router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = deleteRule(id);

    if (!deleted) {
      res.status(404).json(errorResponse('Rule not found'));
      return;
    }

    res.json(successResponse({ deleted: true }));
  } catch (error) {
    res.status(500).json(errorResponse(error instanceof Error ? error.message : 'Failed to delete rule'));
  }
});

router.post('/:id/toggle', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    const updatedRule = updateRule(id, { enabled });

    if (!updatedRule) {
      res.status(404).json(errorResponse('Rule not found'));
      return;
    }

    res.json(successResponse(updatedRule));
  } catch (error) {
    res.status(500).json(errorResponse(error instanceof Error ? error.message : 'Failed to toggle rule'));
  }
});

export default router;