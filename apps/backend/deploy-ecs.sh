#!/bin/bash
# OpenVision AI - Backend ECS Deployment Script

set -e

REGION="${AWS_REGION:-us-east-1}"
ECR_REPOSITORY="${ECR_REPOSITORY:-openvision-backend}"
CLUSTER_NAME="${CLUSTER_NAME:-openvision-cluster}"
SERVICE_NAME="${SERVICE_NAME:-openvision-backend}"
TASK_DEFINITION="${TASK_DEFINITION:-openvision-backend-task}"

echo "Deploying OpenVision AI Backend to ECS..."
echo "Region: $REGION"
echo "ECR Repository: $ECR_REPOSITORY"
echo "Cluster: $CLUSTER_NAME"

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Build and push Docker image
echo "Building Docker image..."
docker build -t $ECR_REPOSITORY:latest .

echo "Tagging image..."
docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:latest

echo "Pushing to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:latest

# Update ECS task definition
echo "Updating ECS task definition..."
aws ecs update-task-definition \
  --task-definition $TASK_DEFINITION \
  --region $REGION

# Update ECS service
echo "Updating ECS service..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --task-definition $TASK_DEFINITION \
  --region $REGION

echo "Deployment complete!"
echo "Backend API: https://api.openvision.ai"
