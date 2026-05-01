"""
Test suite for Rules Engine and Scoring Engine.
"""

import unittest
from scoring_engine import (
    EngagementScore,
    DistractionScore,
    IntegrityRiskScore,
    SecurityRiskScore
)
from rules_engine import RulesEngine
from rules import CLASSROOM_RULES, EXAM_RULES, SECURITY_RULES


class TestEngagementScore(unittest.TestCase):
    """Tests for EngagementScore calculation."""

    def test_high_engagement(self):
        """Test detection with high engagement indicators."""
        detection = {
            'people_count': 3,
            'attention_proxy': 0.9,
            'phone_count': 0,
            'movement_noise': 0.1
        }
        result = EngagementScore.calculate(detection)

        self.assertGreater(result['score'], 0.7)
        self.assertIn('people_present', str(result['contributing_signals']))

    def test_low_engagement_with_phone(self):
        """Test detection with phone usage reducing engagement."""
        detection = {
            'people_count': 2,
            'attention_proxy': 0.6,
            'phone_count': 2,
            'movement_noise': 0.3
        }
        result = EngagementScore.calculate(detection)

        self.assertLess(result['score'], 0.6)
        self.assertIn('phone_usage', str(result['contributing_signals']))

    def test_empty_detection(self):
        """Test with empty detection data."""
        detection = {}
        result = EngagementScore.calculate(detection)

        self.assertEqual(result['score'], 0.5)  # Base score only
        self.assertEqual(len(result['contributing_signals']), 2)  # presence + attention

    def test_score_clamping(self):
        """Test that score is clamped between 0 and 1."""
        detection = {
            'people_count': 10,  # Would give >1.0 score
            'attention_proxy': 1.0,
            'phone_count': 0,
            'movement_noise': 0
        }
        result = EngagementScore.calculate(detection)

        self.assertLessEqual(result['score'], 1.0)
        self.assertGreaterEqual(result['score'], 0.0)


class TestDistractionScore(unittest.TestCase):
    """Tests for DistractionScore calculation."""

    def test_phone_distraction(self):
        """Test detection with phone distraction."""
        detection = {
            'phone_count': 3,
            'movement_spikes': 0,
            'looking_away_proxy': 0
        }
        result = DistractionScore.calculate(detection)

        self.assertGreater(result['score'], 0.5)
        self.assertIn('phone_count', str(result['contributing_signals']))

    def test_movement_spikes(self):
        """Test detection with movement spikes."""
        detection = {
            'phone_count': 0,
            'movement_spikes': 2,
            'looking_away_proxy': 0.3
        }
        result = DistractionScore.calculate(detection)

        self.assertGreater(result['score'], 0.4)
        self.assertIn('movement_spikes', str(result['contributing_signals']))

    def test_no_distraction(self):
        """Test with minimal distraction signals."""
        detection = {
            'phone_count': 0,
            'movement_spikes': 0,
            'looking_away_proxy': 0
        }
        result = DistractionScore.calculate(detection)

        self.assertEqual(result['score'], 0.0)


class TestIntegrityRiskScore(unittest.TestCase):
    """Tests for IntegrityRiskScore calculation."""

    def test_phone_in_exam(self):
        """Test phone detection during exam."""
        detection = {
            'phone_detected': True,
            'phone_confidence': 0.9,
            'collaboration_signal': False,
            'attention_shift_count': 0,
            'gaze_anomaly': False
        }
        result = IntegrityRiskScore.calculate(detection)

        self.assertGreater(result['score'], 0.3)
        self.assertIn('phone_detected', str(result['contributing_signals']))

    def test_collaboration_signal(self):
        """Test collaboration signal detection."""
        detection = {
            'phone_detected': False,
            'collaboration_signal': True,
            'collaboration_score': 0.85,
            'attention_shift_count': 0,
            'gaze_anomaly': False
        }
        result = IntegrityRiskScore.calculate(detection)

        self.assertGreater(result['score'], 0.2)
        self.assertIn('collaboration_signal', str(result['contributing_signals']))

    def test_multiple_risks(self):
        """Test multiple integrity risks combined."""
        detection = {
            'phone_detected': True,
            'phone_confidence': 0.9,
            'collaboration_signal': True,
            'collaboration_score': 0.8,
            'attention_shift_count': 5,
            'gaze_anomaly': True
        }
        result = IntegrityRiskScore.calculate(detection)

        self.assertGreater(result['score'], 0.5)

    def test_no_risk(self):
        """Test with no integrity risks."""
        detection = {
            'phone_detected': False,
            'collaboration_signal': False,
            'attention_shift_count': 0,
            'gaze_anomaly': False
        }
        result = IntegrityRiskScore.calculate(detection)

        self.assertEqual(result['score'], 0.0)


class TestSecurityRiskScore(unittest.TestCase):
    """Tests for SecurityRiskScore calculation."""

    def test_zone_breach(self):
        """Test zone breach detection."""
        detection = {
            'zone_breach': True,
            'breach_confidence': 0.95,
            'after_hours_person': False,
            'loitering_duration': 0,
            'abandoned_object': False,
            'perimeter_breach': False,
            'violence_detected': False
        }
        result = SecurityRiskScore.calculate(detection)

        self.assertGreater(result['score'], 0.3)
        self.assertIn('zone_breach', str(result['contributing_signals']))

    def test_after_hours(self):
        """Test after hours person detection."""
        detection = {
            'zone_breach': False,
            'after_hours_person': True,
            'loitering_duration': 0,
            'abandoned_object': False,
            'perimeter_breach': False,
            'violence_detected': False
        }
        result = SecurityRiskScore.calculate(detection)

        self.assertGreater(result['score'], 0.2)

    def test_loitering(self):
        """Test loitering detection."""
        detection = {
            'zone_breach': False,
            'after_hours_person': False,
            'loitering_duration': 300,
            'abandoned_object': False,
            'perimeter_breach': False,
            'violence_detected': False
        }
        result = SecurityRiskScore.calculate(detection)

        self.assertGreater(result['score'], 0.15)
        self.assertIn('loitering', str(result['contributing_signals']))

    def test_critical_violence(self):
        """Test violence detection returns highest risk."""
        detection = {
            'zone_breach': False,
            'after_hours_person': False,
            'loitering_duration': 0,
            'abandoned_object': False,
            'perimeter_breach': False,
            'violence_detected': True
        }
        result = SecurityRiskScore.calculate(detection)

        self.assertGreater(result['score'], 0.35)

    def test_no_security_risk(self):
        """Test with no security risks."""
        detection = {
            'zone_breach': False,
            'after_hours_person': False,
            'loitering_duration': 0,
            'abandoned_object': False,
            'perimeter_breach': False,
            'violence_detected': False
        }
        result = SecurityRiskScore.calculate(detection)

        self.assertEqual(result['score'], 0.0)


class TestRulesEngine(unittest.TestCase):
    """Tests for RulesEngine class."""

    def setUp(self):
        """Set up test fixtures."""
        self.engine = RulesEngine()

    def test_load_classroom_rules(self):
        """Test loading classroom rules."""
        rules = self.engine.load_rules_for_mode('classroom')
        self.assertEqual(len(rules), len(CLASSROOM_RULES))
        self.assertTrue(any(r['rule_id'] == 'phone_detected' for r in rules))

    def test_load_exam_rules(self):
        """Test loading exam rules."""
        rules = self.engine.load_rules_for_mode('exam')
        self.assertEqual(len(rules), len(EXAM_RULES))
        self.assertTrue(any(r['rule_id'] == 'phone_detected_exam' for r in rules))

    def test_load_security_rules(self):
        """Test loading security rules."""
        rules = self.engine.load_rules_for_mode('security')
        self.assertEqual(len(rules), len(SECURITY_RULES))
        self.assertTrue(any(r['rule_id'] == 'zone_breach' for r in rules))

    def test_load_unknown_mode(self):
        """Test loading rules for unknown mode returns empty list."""
        rules = self.engine.load_rules_for_mode('unknown')
        self.assertEqual(rules, [])

    def test_check_rule_match_label(self):
        """Test rule matching with label condition."""
        rule = {
            'rule_id': 'test',
            'condition': {'label': 'Mobile Phone', 'confidence_greater_than': 0.8}
        }
        detection = {
            'label': 'Mobile Phone',
            'confidence': 0.85
        }
        self.assertTrue(self.engine._check_rule_match(detection, rule))

    def test_check_rule_match_label_fail(self):
        """Test rule matching fails with wrong label."""
        rule = {
            'rule_id': 'test',
            'condition': {'label': 'Mobile Phone', 'confidence_greater_than': 0.8}
        }
        detection = {
            'label': 'Laptop',
            'confidence': 0.85
        }
        self.assertFalse(self.engine._check_rule_match(detection, rule))

    def test_check_rule_match_confidence_fail(self):
        """Test rule matching fails with low confidence."""
        rule = {
            'rule_id': 'test',
            'condition': {'label': 'Mobile Phone', 'confidence_greater_than': 0.8}
        }
        detection = {
            'label': 'Mobile Phone',
            'confidence': 0.7
        }
        self.assertFalse(self.engine._check_rule_match(detection, rule))

    def test_check_rule_match_movement(self):
        """Test rule matching with movement score."""
        rule = {
            'rule_id': 'test',
            'condition': {'movement_score_greater_than': 0.7}
        }
        detection = {'movement_score': 0.8}
        self.assertTrue(self.engine._check_rule_match(detection, rule))

    def test_evaluate_detection_triggers(self):
        """Test evaluation triggers matching rules."""
        detection = {
            'label': 'Mobile Phone',
            'confidence': 0.85,
            'movement_score': 0.3
        }
        rules = self.engine.load_rules_for_mode('classroom')
        triggered = self.engine.evaluate_detection(detection, rules)

        self.assertTrue(any(r['rule_id'] == 'phone_detected' for r in triggered))

    def test_calculate_scores(self):
        """Test all scores are calculated."""
        detection = {
            'people_count': 2,
            'attention_proxy': 0.7,
            'phone_count': 1,
            'movement_noise': 0.2,
            'movement_spikes': 1,
            'looking_away_proxy': 0.3
        }
        scores = self.engine.calculate_scores(detection)

        self.assertIn('engagement', scores)
        self.assertIn('distraction', scores)
        self.assertIn('integrity_risk', scores)
        self.assertIn('security_risk', scores)


class TestRulesStructure(unittest.TestCase):
    """Tests for rule structure validation."""

    def test_classroom_rules_have_required_fields(self):
        """Test all classroom rules have required fields."""
        required_fields = ['rule_id', 'mode', 'event_type', 'condition', 'severity', 'cooldown_seconds']
        for rule in CLASSROOM_RULES:
            for field in required_fields:
                self.assertIn(field, rule, f"Rule {rule.get('rule_id')} missing {field}")

    def test_exam_rules_have_required_fields(self):
        """Test all exam rules have required fields."""
        required_fields = ['rule_id', 'mode', 'event_type', 'condition', 'severity', 'cooldown_seconds']
        for rule in EXAM_RULES:
            for field in required_fields:
                self.assertIn(field, rule, f"Rule {rule.get('rule_id')} missing {field}")

    def test_security_rules_have_required_fields(self):
        """Test all security rules have required fields."""
        required_fields = ['rule_id', 'mode', 'event_type', 'condition', 'severity', 'cooldown_seconds']
        for rule in SECURITY_RULES:
            for field in required_fields:
                self.assertIn(field, rule, f"Rule {rule.get('rule_id')} missing {field}")

    def test_severity_values_valid(self):
        """Test severity values are from allowed set."""
        valid_severities = {'low', 'medium', 'high', 'critical'}
        for ruleset in [CLASSROOM_RULES, EXAM_RULES, SECURITY_RULES]:
            for rule in ruleset:
                self.assertIn(
                    rule['severity'],
                    valid_severities,
                    f"Rule {rule['rule_id']} has invalid severity: {rule['severity']}"
                )

    def test_cooldown_non_negative(self):
        """Test cooldown_seconds is non-negative."""
        for ruleset in [CLASSROOM_RULES, EXAM_RULES, SECURITY_RULES]:
            for rule in ruleset:
                self.assertGreaterEqual(
                    rule['cooldown_seconds'],
                    0,
                    f"Rule {rule['rule_id']} has negative cooldown"
                )


if __name__ == '__main__':
    unittest.main()