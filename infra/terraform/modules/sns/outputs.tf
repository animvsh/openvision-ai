# SNS Module Outputs

output "critical_alerts_topic_arn" {
  description = "ARN of critical alerts topic"
  value       = aws_sns_topic.critical_alerts.arn
}

output "high_alerts_topic_arn" {
  description = "ARN of high alerts topic"
  value       = aws_sns_topic.high_alerts.arn
}

output "medium_alerts_topic_arn" {
  description = "ARN of medium alerts topic"
  value       = aws_sns_topic.medium_alerts.arn
}

output "topic_arns" {
  description = "ARNs of all SNS alert topics"
  value       = [
    aws_sns_topic.critical_alerts.arn,
    aws_sns_topic.high_alerts.arn,
    aws_sns_topic.medium_alerts.arn
  ]
}
