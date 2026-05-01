# SNS Module Variables

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "critical_alert_email_subscriptions" {
  description = "Email addresses for critical alerts"
  type        = list(string)
  default     = []
}

variable "high_alert_email_subscriptions" {
  description = "Email addresses for high alerts"
  type        = list(string)
  default     = []
}

variable "medium_alert_email_subscriptions" {
  description = "Email addresses for medium alerts"
  type        = list(string)
  default     = []
}
