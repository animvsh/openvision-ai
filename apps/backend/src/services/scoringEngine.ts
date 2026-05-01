/**
 * Scoring Engine Service
 * Attention, engagement, and threat scoring for camera analytics
 */

import { broadcastAnalytics } from './websocket';

export interface AttentionMetrics {
  faceCentering: number;
  faceSize: number;
  gazeDirection: number;
  duration: number;
}

export interface EngagementMetrics {
  interactionCount: number;
  movementIntensity: number;
  proximityDuration: number;
  multiplePeople: boolean;
}

export interface ThreatMetrics {
  unauthorizedAccess: boolean;
  weaponDetected: boolean;
  suspiciousBehavior: boolean;
  restrictedArea: boolean;
}

export interface ScoringResult {
  cameraId: string;
  timestamp: string;
  attention: {
    score: number;
    metrics: AttentionMetrics;
  };
  engagement: {
    score: number;
    metrics: EngagementMetrics;
  };
  threat: {
    score: number;
    level: 'none' | 'low' | 'medium' | 'high' | 'critical';
    metrics: ThreatMetrics;
  };
  overall: {
    score: number;
    summary: string;
  };
}

const calculateAttentionScore = (metrics: AttentionMetrics): number => {
  const centeringWeight = 0.3;
  const sizeWeight = 0.25;
  const gazeWeight = 0.25;
  const durationWeight = 0.2;

  const centeringScore = Math.max(0, 100 - Math.abs(50 - metrics.faceCentering) * 2);
  const sizeScore = Math.min(100, metrics.faceSize * 2);
  const gazeScore = metrics.gazeDirection > 0.7 ? 100 : metrics.gazeDirection * 100;
  const durationScore = Math.min(100, metrics.duration / 30 * 100);

  return Math.round(
    centeringScore * centeringWeight +
    sizeScore * sizeWeight +
    gazeScore * gazeWeight +
    durationScore * durationWeight
  );
};

const calculateEngagementScore = (metrics: EngagementMetrics): number => {
  const interactionWeight = 0.35;
  const movementWeight = 0.25;
  const proximityWeight = 0.25;
  const multiPersonWeight = 0.15;

  const interactionScore = Math.min(100, metrics.interactionCount * 20);
  const movementScore = metrics.movementIntensity * 100;
  const proximityScore = Math.min(100, metrics.proximityDuration / 60 * 100);
  const multiPersonScore = metrics.multiplePeople ? 100 : 50;

  return Math.round(
    interactionScore * interactionWeight +
    movementScore * movementWeight +
    proximityScore * proximityWeight +
    multiPersonScore * multiPersonWeight
  );
};

const calculateThreatScore = (metrics: ThreatMetrics): { score: number; level: 'none' | 'low' | 'medium' | 'high' | 'critical' } => {
  let score = 0;
  const weights = {
    unauthorizedAccess: 30,
    weaponDetected: 40,
    suspiciousBehavior: 20,
    restrictedArea: 10,
  };

  if (metrics.unauthorizedAccess) score += weights.unauthorizedAccess;
  if (metrics.weaponDetected) score += weights.weaponDetected;
  if (metrics.suspiciousBehavior) score += weights.suspiciousBehavior;
  if (metrics.restrictedArea) score += weights.restrictedArea;

  let level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  if (score === 0) level = 'none';
  else if (score <= 20) level = 'low';
  else if (score <= 50) level = 'medium';
  else if (score <= 80) level = 'high';
  else level = 'critical';

  return { score: Math.min(100, score), level };
};

const generateSummary = (attentionScore: number, engagementScore: number, threatScore: number, threatLevel: string): string => {
  if (threatLevel === 'critical' || threatLevel === 'high') {
    return 'High priority alert - immediate attention required';
  }

  const avgScore = (attentionScore + engagementScore) / 2;

  if (avgScore >= 80) {
    return 'High engagement detected - positive interaction';
  } else if (avgScore >= 60) {
    return 'Moderate engagement - normal activity';
  } else if (avgScore >= 40) {
    return 'Low engagement - subject may be distracted';
  } else {
    return 'Minimal engagement - no significant activity';
  }
};

export const calculateScores = (
  cameraId: string,
  attentionMetrics: AttentionMetrics,
  engagementMetrics: EngagementMetrics,
  threatMetrics: ThreatMetrics
): ScoringResult => {
  const timestamp = new Date().toISOString();

  const attentionScore = calculateAttentionScore(attentionMetrics);
  const engagementScore = calculateEngagementScore(engagementMetrics);
  const threatResult = calculateThreatScore(threatMetrics);

  const overallScore = Math.round(
    attentionScore * 0.3 +
    engagementScore * 0.3 +
    (100 - threatResult.score) * 0.4
  );

  const result: ScoringResult = {
    cameraId,
    timestamp,
    attention: {
      score: attentionScore,
      metrics: attentionMetrics,
    },
    engagement: {
      score: engagementScore,
      metrics: engagementMetrics,
    },
    threat: {
      score: threatResult.score,
      level: threatResult.level,
      metrics: threatMetrics,
    },
    overall: {
      score: overallScore,
      summary: generateSummary(attentionScore, engagementScore, threatResult.score, threatResult.level),
    },
  };

  return result;
};

export const broadcastScores = (scores: ScoringResult): void => {
  broadcastAnalytics({
    type: 'scoring',
    payload: scores,
    timestamp: new Date().toISOString(),
  });
};

export const calculateAndBroadcastScores = (
  cameraId: string,
  attentionMetrics: AttentionMetrics,
  engagementMetrics: EngagementMetrics,
  threatMetrics: ThreatMetrics
): ScoringResult => {
  const result = calculateScores(cameraId, attentionMetrics, engagementMetrics, threatMetrics);
  broadcastScores(result);
  return result;
};