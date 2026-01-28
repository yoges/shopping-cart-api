# Shopping Cart API - Terraform Infrastructure

This directory contains Terraform code to provision the AWS infrastructure for the Shopping Cart API.

## Architecture Overview

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                         VPC                             │
                    │  ┌─────────────────────────────────────────────────┐   │
                    │  │              Public Subnets                      │   │
                    │  │  ┌─────────────┐      ┌─────────────┐           │   │
Internet ──────────►│  │  │   ALB       │      │   NAT GW    │           │   │
                    │  │  │  (Port 80)  │      │             │           │   │
                    │  │  └──────┬──────┘      └──────┬──────┘           │   │
                    │  └─────────│────────────────────│───────────────────┘   │
                    │            │                    │                       │
                    │  ┌─────────│────────────────────│───────────────────┐   │
                    │  │         │   Private Subnets  │                   │   │
                    │  │         ▼                    │                   │   │
                    │  │  ┌─────────────────────────────────────────┐    │   │
                    │  │  │           ECS Fargate Tasks              │    │   │
                    │  │  │  ┌─────────┐  ┌─────────┐               │    │   │
                    │  │  │  │ Task 1  │  │ Task 2  │  (Auto-scale) │    │   │
                    │  │  │  │ :3000   │  │ :3000   │               │    │   │
                    │  │  │  └─────────┘  └─────────┘               │    │   │
                    │  │  └─────────────────────────────────────────┘    │   │
                    │  └──────────────────────────────────────────────────┘   │
                    └─────────────────────────────────────────────────────────┘
```

## Components

### Network Layer (`vpc.tf`)

- **VPC**: Isolated network with CIDR `10.0.0.0/16`
- **Public Subnets**: Host ALB and NAT Gateways (internet accessible)
- **Private Subnets**: Host ECS tasks (no direct internet access)
- **NAT Gateways**: Allow private resources to access internet (pull images, etc.)
- **VPC Flow Logs**: Security auditing and troubleshooting

### Security (`security-groups.tf`)

- **ALB Security Group**: 
  - Inbound: HTTP (80), HTTPS (443) from anywhere
  - Outbound: All traffic
- **ECS Tasks Security Group**:
  - Inbound: Only from ALB on container port (3000)
  - Outbound: All traffic (for pulling images, external APIs)

### Load Balancer (`alb.tf`)

- **Application Load Balancer**: Public-facing, distributes traffic
- **Target Group**: Health checks on `/health` endpoint
- **Listeners**: HTTP (80), with HTTPS redirect for production

### Container Registry (`ecr.tf`)

- **ECR Repository**: Private Docker image storage
- **Lifecycle Policy**: Auto-cleanup of old images
- **Image Scanning**: Automatic vulnerability scanning

### Compute (`ecs.tf`)

- **ECS Cluster**: Container orchestration with Container Insights
- **Task Definition**: Container configuration, resources, logging
- **ECS Service**: Manages running tasks, rolling deployments
- **Auto-scaling**: Based on CPU/memory utilization
- **IAM Roles**: Least-privilege permissions

## Security Measures

1. **Network Isolation**
   - ECS tasks run in private subnets
   - No direct internet access to containers
   - Traffic flows only through ALB

2. **Security Groups**
   - Minimal ingress rules
   - ECS tasks only accept traffic from ALB

3. **IAM Least Privilege**
   - Task execution role: Only pull images, write logs
   - Task role: Minimal application permissions

4. **Encryption**
   - ECR images encrypted at rest
   - VPC Flow Logs for auditing

5. **Container Security**
   - Image scanning on push
   - Non-root user in container
   - Read-only filesystem support

## Deployment Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   GitHub     │     │    ECR       │     │    ECS       │
│   Actions    │────►│  Push Image  │────►│   Deploy     │
│   (CD)       │     │              │     │   Service    │
└──────────────┘     └──────────────┘     └──────────────┘
       │                                         │
       │         ┌──────────────┐                │
       └────────►│  Terraform   │────────────────┘
                 │    Apply     │
                 └──────────────┘
```

1. CD pipeline builds Docker image
2. Image pushed to ECR with git SHA tag
3. Terraform updates ECS task definition with new image
4. ECS performs rolling deployment
5. Health checks verify new tasks
6. Old tasks deregistered gracefully

## Usage

### Prerequisites

- AWS CLI configured
- Terraform >= 1.0.0
- S3 bucket for Terraform state

### Initialize

```bash
terraform init \
  -backend-config="bucket=your-tf-state-bucket" \
  -backend-config="key=shopping-cart/terraform.tfstate" \
  -backend-config="region=us-east-1"
```

### Plan

```bash
terraform plan \
  -var="environment=staging" \
  -var="image_tag=latest"
```

### Apply

```bash
terraform apply \
  -var="environment=staging" \
  -var="image_tag=abc123"
```

### Destroy (Caution!)

```bash
terraform destroy -var="environment=staging"
```

## Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region | `us-east-1` |
| `environment` | Environment (staging/production) | `staging` |
| `image_tag` | Docker image tag | `latest` |
| `vpc_cidr` | VPC CIDR block | `10.0.0.0/16` |
| `ecs_task_cpu` | CPU units (1024 = 1 vCPU) | `256` |
| `ecs_task_memory` | Memory in MB | `512` |
| `ecs_desired_count` | Desired task count | `2` |
| `container_port` | Container port | `3000` |

## Outputs

- `application_url`: URL to access the API
- `ecr_repository_url`: ECR repository for pushing images
- `ecs_cluster_name`: ECS cluster name for deployments
- `alb_dns_name`: Load balancer DNS name

## Cost Considerations

### Staging
- 1-2 Fargate tasks (0.25 vCPU, 512MB)
- 1 NAT Gateway
- Estimated: ~$50-80/month

### Production
- 2-10 Fargate tasks (auto-scaled)
- 2 NAT Gateways (HA)
- Estimated: ~$150-400/month

## Troubleshooting

### Common Issues

1. **Tasks failing health checks**
   - Check CloudWatch logs
   - Verify `/health` endpoint returns 200
   - Check security group allows traffic from ALB

2. **Image pull failures**
   - Verify ECR repository exists
   - Check task execution role permissions
   - Ensure NAT Gateway is working

3. **Service won't stabilize**
   - Check task CPU/memory limits
   - Review deployment circuit breaker
   - Check for application crashes in logs
