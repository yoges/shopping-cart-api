# =============================================================================
# Terraform Variables
# =============================================================================

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be 'staging' or 'production'."
  }
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "app_version" {
  description = "Application version (typically git SHA)"
  type        = string
  default     = "unknown"
}

# =============================================================================
# VPC Configuration
# =============================================================================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 2
}

# =============================================================================
# ECS Configuration
# =============================================================================

variable "ecs_task_cpu" {
  description = "CPU units for ECS task (1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MB"
  type        = number
  default     = 512
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_min_count" {
  description = "Minimum number of ECS tasks for auto-scaling"
  type        = number
  default     = 1
}

variable "ecs_max_count" {
  description = "Maximum number of ECS tasks for auto-scaling"
  type        = number
  default     = 4
}

# =============================================================================
# Application Configuration
# =============================================================================

variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 3000
}

variable "health_check_path" {
  description = "Health check endpoint path"
  type        = string
  default     = "/health"
}

# =============================================================================
# Environment-specific defaults
# =============================================================================

locals {
  env_config = {
    staging = {
      ecs_desired_count = 1
      ecs_min_count     = 1
      ecs_max_count     = 2
    }
    production = {
      ecs_desired_count = 2
      ecs_min_count     = 2
      ecs_max_count     = 10
    }
  }

  # Use environment-specific defaults if not explicitly set
  effective_desired_count = coalesce(var.ecs_desired_count, local.env_config[var.environment].ecs_desired_count)
}
