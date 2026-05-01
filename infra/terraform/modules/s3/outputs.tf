# S3 Module Outputs

output "videos_bucket_name" {
  description = "Name of openvision-videos bucket"
  value       = aws_s3_bucket.videos.id
}

output "videos_bucket_arn" {
  description = "ARN of openvision-videos bucket"
  value       = aws_s3_bucket.videos.arn
}

output "snippets_bucket_name" {
  description = "Name of openvision-snippets bucket"
  value       = aws_s3_bucket.snippets.id
}

output "snippets_bucket_arn" {
  description = "ARN of openvision-snippets bucket"
  value       = aws_s3_bucket.snippets.arn
}
