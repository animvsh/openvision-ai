# SNS Module - Three alert topics: critical-alerts, high-alerts, medium-alerts

resource "aws_sns_topic" "critical_alerts" {
  name        = "${var.project_name}-${var.environment}-critical-alerts"
  description = "Critical alerts for OpenVision AI"

  tags = {
    Name        = "${var.project_name}-${var.environment}-critical-alerts"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_sns_topic" "high_alerts" {
  name        = "${var.project_name}-${var.environment}-high-alerts"
  description = "High priority alerts for OpenVision AI"

  tags = {
    Name        = "${var.project_name}-${var.environment}-high-alerts"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_sns_topic" "medium_alerts" {
  name        = "${var.project_name}-${var.environment}-medium-alerts"
  description = "Medium priority alerts for OpenVision AI"

  tags = {
    Name        = "${var.project_name}-${var.environment}-medium-alerts"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_sns_topic_subscription" "critical_email" {
  count = length(var.critical_alert_email_subscriptions)

  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "email"
  endpoint  = var.critical_alert_email_subscriptions[count.index]
}

resource "aws_sns_topic_subscription" "high_email" {
  count = length(var.high_alert_email_subscriptions)

  topic_arn = aws_sns_topic.high_alerts.arn
  protocol  = "email"
  endpoint  = var.high_alert_email_subscriptions[count.index]
}

resource "aws_sns_topic_subscription" "medium_email" {
  count = length(var.medium_alert_email_subscriptions)

  topic_arn = aws_sns_topic.medium_alerts.arn
  protocol  = "email"
  endpoint  = var.medium_alert_email_subscriptions[count.index]
}

resource "aws_ssm_parameter" "critical_alerts_arn" {
  name        = "/${var.project_name}/${var.environment}/sns/critical-alerts-arn"
  description = "ARN of critical alerts SNS topic"
  type        = "String"
  value       = aws_sns_topic.critical_alerts.arn
}

resource "aws_ssm_parameter" "high_alerts_arn" {
  name        = "/${var.project_name}/${var.environment}/sns/high-alerts-arn"
  description = "ARN of high alerts SNS topic"
  type        = "String"
  value       = aws_sns_topic.high_alerts.arn
}

resource "aws_ssm_parameter" "medium_alerts_arn" {
  name        = "/${var.project_name}/${var.environment}/sns/medium-alerts-arn"
  description = "ARN of medium alerts SNS topic"
  type        = "String"
  value       = aws_sns_topic.medium_alerts.arn
}
