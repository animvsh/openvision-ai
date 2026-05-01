"""
Scoring Engine for computing engagement, distraction, integrity risk, and security risk scores.
"""

from typing import Any


class ScoreResult:
    """Result object for scoring methods."""

    def __init__(self, score: float, contributing_signals: list, explanation: str):
        self.score = score
        self.contributing_signals = contributing_signals
        self.explanation = explanation

    def to_dict(self) -> dict:
        return {
            'score': self.score,
            'contributing_signals': self.contributing_signals,
            'explanation': self.explanation
        }


class EngagementScore:
    """Calculate engagement score based on presence, attention, and disruptions."""

    @staticmethod
    def calculate(detection: dict) -> dict:
        """
        Calculate engagement score.
        Formula: people_present + attention_proxy - phone_usage - movement_noise

        Score range: 0.0 to 1.0 (higher = more engaged)
        """
        signals = []
        base_score = 0.5

        # Positive signals
        people_present = detection.get('people_count', 0)
        if people_present > 0:
            presence_contribution = min(people_present * 0.1, 0.3)
            signals.append(f"people_present({people_present})={presence_contribution:.2f}")
            base_score += presence_contribution

        attention_proxy = detection.get('attention_proxy', 0.5)
        attention_contribution = attention_proxy * 0.4
        signals.append(f"attention_proxy({attention_proxy:.2f})={attention_contribution:.2f}")
        base_score += attention_contribution

        # Negative signals
        phone_usage = detection.get('phone_count', 0)
        if phone_usage > 0:
            phone_penalty = min(phone_usage * 0.15, 0.4)
            signals.append(f"phone_usage({phone_usage})=-{phone_penalty:.2f}")
            base_score -= phone_penalty

        movement_noise = detection.get('movement_noise', 0)
        if movement_noise > 0:
            noise_penalty = movement_noise * 0.3
            signals.append(f"movement_noise({movement_noise:.2f})=-{noise_penalty:.2f}")
            base_score -= noise_penalty

        # Clamp score between 0 and 1
        final_score = max(0.0, min(1.0, base_score))

        explanation = (
            f"Engagement = 0.5 base + presence + attention - phone_usage - movement_noise. "
            f"People: {people_present}, Attention: {attention_proxy:.2f}, "
            f"Phone: {phone_usage}, Movement: {movement_noise:.2f}"
        )

        return ScoreResult(final_score, signals, explanation).to_dict()


class DistractionScore:
    """Calculate distraction score based on behavioral disruptions."""

    @staticmethod
    def calculate(detection: dict) -> dict:
        """
        Calculate distraction score.
        Formula: phone_count + movement_spikes + looking_away_proxy

        Score range: 0.0 to 1.0 (higher = more distracted)
        """
        signals = []

        # Phone distractions
        phone_count = detection.get('phone_count', 0)
        phone_contribution = min(phone_count * 0.3, 0.5)
        signals.append(f"phone_count({phone_count})={phone_contribution:.2f}")

        # Movement spikes
        movement_spikes = detection.get('movement_spikes', 0)
        spike_contribution = min(movement_spikes * 0.25, 0.4)
        signals.append(f"movement_spikes({movement_spikes})={spike_contribution:.2f}")

        # Looking away proxy
        looking_away_proxy = detection.get('looking_away_proxy', 0)
        away_contribution = looking_away_proxy * 0.3
        signals.append(f"looking_away_proxy({looking_away_proxy:.2f})={away_contribution:.2f}")

        final_score = min(1.0, phone_contribution + spike_contribution + away_contribution)

        explanation = (
            f"Distraction = phone + movement_spikes + looking_away. "
            f"Phone events: {phone_count}, Movement spikes: {movement_spikes}, "
            f"Looking away: {looking_away_proxy:.2f}"
        )

        return ScoreResult(final_score, signals, explanation).to_dict()


class IntegrityRiskScore:
    """Calculate integrity risk score for exam monitoring."""

    @staticmethod
    def calculate(detection: dict) -> dict:
        """
        Calculate integrity risk score for exam mode.
        Weighted sum of: phone detection, collaboration signals, attention shifts

        Score range: 0.0 to 1.0 (higher = higher integrity risk)
        """
        signals = []
        weighted_sum = 0.0

        # Phone detection (high weight)
        phone_detected = detection.get('phone_detected', False)
        if phone_detected:
            phone_confidence = detection.get('phone_confidence', 0.8)
            phone_risk = phone_confidence * 0.4
            signals.append(f"phone_detected(conf={phone_confidence:.2f})={phone_risk:.2f}")
            weighted_sum += phone_risk

        # Collaboration signal
        collaboration_signal = detection.get('collaboration_signal', False)
        if collaboration_signal:
            collab_score = detection.get('collaboration_score', 0.5)
            collab_risk = collab_score * 0.3
            signals.append(f"collaboration_signal(score={collab_score:.2f})={collab_risk:.2f}")
            weighted_sum += collab_risk

        # Attention shift
        attention_shift = detection.get('attention_shift_count', 0)
        if attention_shift > 0:
            shift_risk = min(attention_shift * 0.1, 0.25)
            signals.append(f"attention_shift(count={attention_shift})={shift_risk:.2f}")
            weighted_sum += shift_risk

        # Gaze pattern anomaly
        gaze_anomaly = detection.get('gaze_anomaly', False)
        if gaze_anomaly:
            gaze_risk = 0.15
            signals.append(f"gaze_anomaly={gaze_risk:.2f}")
            weighted_sum += gaze_risk

        final_score = min(1.0, weighted_sum)

        explanation = (
            f"Integrity Risk = weighted_sum(phone, collaboration, attention_shift, gaze). "
            f"Phone: {phone_detected}, Collaboration: {collaboration_signal}, "
            f"Attention shifts: {attention_shift}, Gaze anomaly: {gaze_anomaly}"
        )

        return ScoreResult(final_score, signals, explanation).to_dict()


class SecurityRiskScore:
    """Calculate security risk score for physical security monitoring."""

    @staticmethod
    def calculate(detection: dict) -> dict:
        """
        Calculate security risk score.
        Sum of: zone_breach + after_hours + loitering + abandoned_object

        Score range: 0.0 to 1.0 (higher = higher security risk)
        """
        signals = []
        risk_sum = 0.0

        # Zone breach
        zone_breach = detection.get('zone_breach', False)
        if zone_breach:
            breach_confidence = detection.get('breach_confidence', 0.9)
            breach_risk = breach_confidence * 0.35
            signals.append(f"zone_breach(conf={breach_confidence:.2f})={breach_risk:.2f}")
            risk_sum += breach_risk

        # After hours person
        after_hours = detection.get('after_hours_person', False)
        if after_hours:
            after_hours_risk = 0.25
            signals.append(f"after_hours_person={after_hours_risk:.2f}")
            risk_sum += after_hours_risk

        # Loitering
        loitering_duration = detection.get('loitering_duration', 0)
        if loitering_duration > 60:
            loitering_risk = min(loitering_duration / 600, 0.2)
            signals.append(f"loitering(duration={loitering_duration}s)={loitering_risk:.2f}")
            risk_sum += loitering_risk

        # Abandoned object
        abandoned_object = detection.get('abandoned_object', False)
        if abandoned_object:
            abandoned_duration = detection.get('abandoned_duration', 0)
            abandoned_risk = min(abandoned_duration / 300 * 0.2, 0.2)
            signals.append(f"abandoned_object(duration={abandoned_duration}s)={abandoned_risk:.2f}")
            risk_sum += abandoned_risk

        # Perimeter breach
        perimeter_breach = detection.get('perimeter_breach', False)
        if perimeter_breach:
            perimeter_risk = 0.3
            signals.append(f"perimeter_breach={perimeter_risk:.2f}")
            risk_sum += perimeter_risk

        # Violence detection
        violence_detected = detection.get('violence_detected', False)
        if violence_detected:
            violence_risk = 0.4
            signals.append(f"violence_detected={violence_risk:.2f}")
            risk_sum += violence_risk

        final_score = min(1.0, risk_sum)

        explanation = (
            f"Security Risk = sum(zone_breach, after_hours, loitering, abandoned_object, perimeter, violence). "
            f"Zone breach: {zone_breach}, After hours: {after_hours}, "
            f"Loitering: {loitering_duration}s, Abandoned: {abandoned_object}, "
            f"Perimeter: {perimeter_breach}, Violence: {violence_detected}"
        )

        return ScoreResult(final_score, signals, explanation).to_dict()