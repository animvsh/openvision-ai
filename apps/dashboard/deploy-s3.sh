#!/bin/bash
# OpenVision AI - S3 Deployment Script

set -e

# Configuration
BUCKET_NAME="${S3_BUCKET:-openvision-ai-dashboard}"
DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"
REGION="${AWS_REGION:-us-east-1}"

echo "Deploying OpenVision AI Dashboard to S3..."
echo "Bucket: $BUCKET_NAME"
echo "Region: $REGION"

# Build the dashboard
echo "Building dashboard..."
npm run build

# Upload to S3
echo "Uploading to S3..."
aws s3 sync ./dist/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.map" \
  --region $REGION

# Upload index.html with no-cache for freshness
echo "Updating index.html..."
aws s3 cp ./dist/index.html s3://$BUCKET_NAME/index.html \
  --cache-control "public, no-cache, must-revalidate" \
  --region $REGION

# Invalidate CloudFront if configured
if [ -n "$DISTRIBUTION_ID" ]; then
  echo "Invalidating CloudFront distribution..."
  aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*" \
    --region $REGION
fi

echo "Deployment complete!"
echo "Dashboard URL: https://$BUCKET_NAME.s3-website.$REGION.amazonaws.com"
