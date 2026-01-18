#!/bin/bash
# ==============================================
# Get-Noticed - Production Deployment Script
# Domain: get-noticed.net
# ==============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="get-noticed"
DOMAIN="get-noticed.net"
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Get-Noticed Production Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"

    command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is required but not installed.${NC}" >&2; exit 1; }
    command -v aws >/dev/null 2>&1 || { echo -e "${RED}AWS CLI is required but not installed.${NC}" >&2; exit 1; }

    if [ -z "$AWS_ACCOUNT_ID" ]; then
        echo -e "${RED}AWS_ACCOUNT_ID environment variable is required.${NC}"
        exit 1
    fi

    echo -e "${GREEN}Prerequisites check passed.${NC}"
}

# Login to ECR
ecr_login() {
    echo -e "${YELLOW}Logging into Amazon ECR...${NC}"
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
    echo -e "${GREEN}ECR login successful.${NC}"
}

# Build and push images
build_and_push() {
    local service=$1
    local context=$2
    local dockerfile=${3:-Dockerfile}
    local build_args=${4:-""}

    echo -e "${YELLOW}Building ${service}...${NC}"

    local image_tag="${ECR_REGISTRY}/${PROJECT_NAME}-${service}:latest"
    local image_tag_sha="${ECR_REGISTRY}/${PROJECT_NAME}-${service}:$(git rev-parse --short HEAD)"

    docker build ${build_args} -f ${context}/${dockerfile} -t $image_tag -t $image_tag_sha ${context}

    echo -e "${YELLOW}Pushing ${service} to ECR...${NC}"
    docker push $image_tag
    docker push $image_tag_sha

    echo -e "${GREEN}${service} deployed successfully.${NC}"
}

# Deploy to ECS
deploy_ecs() {
    local service=$1

    echo -e "${YELLOW}Deploying ${service} to ECS...${NC}"

    aws ecs update-service \
        --cluster ${PROJECT_NAME}-production \
        --service $service \
        --force-new-deployment \
        --region $AWS_REGION

    echo -e "${GREEN}${service} deployment initiated.${NC}"
}

# Wait for service stability
wait_for_stability() {
    local service=$1

    echo -e "${YELLOW}Waiting for ${service} to stabilize...${NC}"

    aws ecs wait services-stable \
        --cluster ${PROJECT_NAME}-production \
        --services $service \
        --region $AWS_REGION

    echo -e "${GREEN}${service} is stable.${NC}"
}

# Main deployment function
deploy() {
    check_prerequisites
    ecr_login

    echo ""
    echo -e "${YELLOW}Building and pushing Docker images...${NC}"
    echo ""

    # Build and push all services
    build_and_push "api" "./talent-discovery-platform/backend" "Dockerfile"
    build_and_push "worker" "./talent-discovery-platform/backend" "Dockerfile.worker"
    build_and_push "ai" "./talent-discovery-platform/ai-services" "Dockerfile"
    build_and_push "frontend" "./talent-discovery-platform/frontend" "Dockerfile" \
        "--build-arg REACT_APP_API_URL=https://api.${DOMAIN}/api/v1 --build-arg REACT_APP_BACKEND_URL=https://api.${DOMAIN} --build-arg REACT_APP_SOCKET_URL=wss://api.${DOMAIN}"

    echo ""
    echo -e "${YELLOW}Deploying to ECS...${NC}"
    echo ""

    # Deploy all services
    deploy_ecs "api"
    deploy_ecs "worker"
    deploy_ecs "ai"

    # Wait for API to be stable before proceeding
    wait_for_stability "api"

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Deployment Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "Frontend: https://${DOMAIN}"
    echo -e "API: https://api.${DOMAIN}"
    echo ""
}

# Quick deploy (only specified service)
quick_deploy() {
    local service=$1

    if [ -z "$service" ]; then
        echo -e "${RED}Please specify a service: api, worker, ai, frontend${NC}"
        exit 1
    fi

    check_prerequisites
    ecr_login

    case $service in
        api)
            build_and_push "api" "./talent-discovery-platform/backend" "Dockerfile"
            deploy_ecs "api"
            wait_for_stability "api"
            ;;
        worker)
            build_and_push "worker" "./talent-discovery-platform/backend" "Dockerfile.worker"
            deploy_ecs "worker"
            wait_for_stability "worker"
            ;;
        ai)
            build_and_push "ai" "./talent-discovery-platform/ai-services" "Dockerfile"
            deploy_ecs "ai"
            wait_for_stability "ai"
            ;;
        frontend)
            build_and_push "frontend" "./talent-discovery-platform/frontend" "Dockerfile" \
                "--build-arg REACT_APP_API_URL=https://api.${DOMAIN}/api/v1 --build-arg REACT_APP_BACKEND_URL=https://api.${DOMAIN} --build-arg REACT_APP_SOCKET_URL=wss://api.${DOMAIN}"
            ;;
        *)
            echo -e "${RED}Unknown service: ${service}${NC}"
            exit 1
            ;;
    esac

    echo -e "${GREEN}${service} deployed successfully.${NC}"
}

# Show usage
usage() {
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  deploy          Full deployment of all services"
    echo "  quick <service> Deploy a single service (api, worker, ai, frontend)"
    echo "  help            Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  AWS_ACCOUNT_ID  AWS Account ID (required)"
    echo "  AWS_REGION      AWS Region (default: us-east-1)"
    echo ""
    echo "Examples:"
    echo "  AWS_ACCOUNT_ID=123456789012 $0 deploy"
    echo "  AWS_ACCOUNT_ID=123456789012 $0 quick api"
}

# Parse command line arguments
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    quick)
        quick_deploy $2
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        usage
        exit 1
        ;;
esac
