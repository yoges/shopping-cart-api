# Shopping Cart API

A REST API for shopping cart operations, demonstrating clean architecture, domain-driven design, and DevOps best practices.

## Table of Contents

- [Overview](#overview)
- [Domain Model Design](#domain-model-design)
- [Architecture Overview](#architecture-overview)
- [Design Patterns Implemented](#design-patterns-implemented)
- [Docker Setup](#docker-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Infrastructure Design](#infrastructure-design)
- [Local Development](#local-development)
- [API Documentation](#api-documentation)
- [Deployment Strategy](#deployment-strategy)
- [Trade-offs & Improvements](#trade-offs--improvements)

## Overview

This project implements a shopping cart REST API with the following features:

- **Clean Architecture**: Layered design with clear separation of concerns
- **Domain-Driven Design**: Rich domain model with entities and value objects
- **TypeScript**: Full type safety with strict mode
- **Comprehensive Testing**: Unit tests for domain logic (>70% coverage)
- **Docker**: Multi-stage builds, optimized production image
- **CI/CD**: GitHub Actions pipelines for build, test, and deploy
- **Infrastructure as Code**: Terraform for AWS (ECS Fargate)

## Domain Model Design

### Entity and Aggregate Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       CART AGGREGATE                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     Cart (Root)                            │  │
│  │  sessionId, items[], status, currency, timestamps         │  │
│  │                          │                                 │  │
│  │                          │ contains 0..N                   │  │
│  │                          ▼                                 │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                    CartItem                          │  │  │
│  │  │  itemId, productId, productName, unitPrice, qty      │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  VALUE OBJECTS                                                   │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────┐      │
│  │  Money   │  │ ProductId │  │ Quantity │  │ SessionId │      │
│  └──────────┘  └───────────┘  └──────────┘  └───────────┘      │
└──────────────────────────────────────────────────────────────────┘
```

### Why Cart is the Aggregate Root

- CartItem has no meaning outside a cart
- Business rules span all items (max 20 items, currency consistency)
- Consistency boundaries align with cart operations

### Value Objects Explanation

| Value Object | Purpose | Why It's a Value Object |
|--------------|---------|------------------------|
| **Money** | Monetary amounts | Immutable, equality by value, encapsulates arithmetic |
| **Quantity** | Item counts | Enforces min/max limits (1-99), must be integer |
| **ProductId** | Product references | Validated format, identity comparison |
| **SessionId** | Cart ownership | Validated format, links cart to user session |

### Business Rules and Invariants

| Rule | Enforcement |
|------|-------------|
| Cart max 20 unique items | `addItemToCart()` throws error |
| Same product = merged quantity | `addItemToCart()` merges automatically |
| Cannot modify checked-out cart | All mutations check status first |
| Cannot checkout empty cart | `checkout()` validates items > 0 |
| Quantity must be 1-99 | `createQuantity()` validates |
| Money must be non-negative | `createMoney()` validates |

### Why This Model

**Price snapshots**: We store product price when adding to cart, not as a reference. This protects customers from price changes during their shopping session.

**Quantity as type**: Rather than a bare number, Quantity encapsulates validation rules. Invalid quantities are impossible to create.

**Money in cents**: Using integer cents avoids floating-point precision issues in financial calculations.

## Architecture Overview

### Layer Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE (Express, Routes, Middleware)                    │
├──────────────────────────────────────────────────────────────────┤
│  ADAPTERS (Controllers, Presenters, Repository Implementations) │
├──────────────────────────────────────────────────────────────────┤
│  USE CASES (AddItemToCart, GetCart, CheckoutCart, RemoveItem)   │
├──────────────────────────────────────────────────────────────────┤
│  DOMAIN (Entities, Value Objects, Repository Interfaces)        │
└──────────────────────────────────────────────────────────────────┘
        ▲                    Dependencies flow inward
```

### Key Architectural Decisions

1. **Domain Layer**: No external dependencies, pure TypeScript
2. **Use Cases**: Depend only on domain, contain application logic
3. **Adapters**: Bridge external world (HTTP) to application
4. **Infrastructure**: Compose all layers, handle framework concerns

## Design Patterns Implemented

### 1. Repository Pattern

Abstract data access behind interfaces. Domain defines the contract, adapters provide implementations.

```typescript
// Domain defines interface
interface CartRepository {
  findBySessionId(sessionId: string): Promise<Cart | null>
  save(cart: Cart): Promise<void>
}

// Adapter implements it
const createInMemoryCartRepository = (): CartRepository => { /* ... */ }
```

### 2. Dependency Injection (Factory Functions)

Use cases receive dependencies through factory functions, enabling easy testing and swapping implementations.

```typescript
const createAddItemToCart = (
  cartRepository: CartRepository,
  productRepository: ProductRepository
): AddItemToCart => ({
  execute: async (request) => { /* business logic */ }
})
```

### 3. Use Case Pattern

Each use case is a single-responsibility unit with an `execute` method.

### 4. Value Objects

Immutable objects with validation, representing domain concepts.

### 5. Presenter Pattern

Separate response formatting from domain logic.

### 6. Factory Functions

Functional composition over class hierarchies.

## Docker Setup

### Dockerfile Optimization (Production)

```dockerfile
# Multi-stage build for minimal image
FROM node:20-alpine AS builder
# ... build stage

FROM node:20-alpine AS production
# Non-root user, ~50-80MB final image
```

**Optimizations:**
- Multi-stage build (separate build/runtime)
- Alpine base image (minimal footprint)
- Production dependencies only
- Non-root user (security)
- Health check built-in

**Image size achieved**: ~60-80MB

### Docker Environment Separation

| Dockerfile | Purpose |
|------------|---------|
| `infra/docker/dev/Dockerfile` | Development with hot reload |
| `infra/docker/prod/Dockerfile` | Production optimized |
| `infra/docker/ci/Dockerfile` | CI testing and validation |

### docker-compose for Local Development

```bash
# Start development server
cd infra && docker-compose up

# Access at http://localhost:3000
```

## CI/CD Pipeline

### Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CI Pipeline                                 │
│  ┌─────────┐  ┌────────────┐  ┌──────┐  ┌───────┐  ┌──────────┐       │
│  │  Lint   │  │ Type Check │  │ Test │  │ Build │  │ Security │       │
│  └────┬────┘  └─────┬──────┘  └──┬───┘  └───┬───┘  └────┬─────┘       │
│       │             │            │          │           │              │
│       └─────────────┴────────────┴──────────┴───────────┘              │
│                              ▼ (all pass)                               │
│                        [ci-success]                                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                              CD Pipeline                                 │
│  ┌──────────────────┐      ┌─────────────────┐      ┌────────────────┐ │
│  │  Build & Push    │─────►│ Deploy Staging  │─────►│  Deploy Prod   │ │
│  │  Docker Image    │      │   (auto)        │      │  (manual)      │ │
│  └──────────────────┘      └─────────────────┘      └────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### CI Workflow (`.github/workflows/ci.yml`)

- **Trigger**: Pull requests to main
- **Jobs** (parallel for fast feedback):
  - Lint: ESLint + Prettier
  - Type Check: TypeScript compilation
  - Test: Unit tests with coverage (>70% on domain)
  - Build: Docker image validation
  - Security: npm audit + Trivy scanning

### CD Workflow (`.github/workflows/cd.yml`)

- **Trigger**: Push to main branch
- **Steps**:
  1. Build Docker image using `infra/docker/prod/Dockerfile`
  2. Tag with git SHA and push to ECR
  3. Deploy to staging via Terraform
  4. Production deployment (manual approval)

### Secrets and Environment Variables

| Secret | Purpose |
|--------|---------|
| `AWS_ACCESS_KEY_ID` | AWS authentication |
| `AWS_SECRET_ACCESS_KEY` | AWS authentication |
| `TF_STATE_BUCKET` | Terraform state storage |

## Infrastructure Design

### Architecture Diagram

```
                    ┌─────────────────────────────────────────┐
                    │                  VPC                     │
                    │  ┌─────────────────────────────────┐    │
                    │  │        Public Subnets           │    │
Internet ──────────►│  │  ┌─────┐      ┌─────────┐      │    │
                    │  │  │ ALB │      │ NAT GW  │      │    │
                    │  │  └──┬──┘      └────┬────┘      │    │
                    │  └─────│──────────────│───────────┘    │
                    │        │              │                 │
                    │  ┌─────│──────────────│───────────┐    │
                    │  │     │   Private Subnets        │    │
                    │  │     ▼                          │    │
                    │  │  ┌────────────────────────┐   │    │
                    │  │  │   ECS Fargate Tasks    │   │    │
                    │  │  │  ┌──────┐  ┌──────┐   │   │    │
                    │  │  │  │Task 1│  │Task 2│   │   │    │
                    │  │  │  └──────┘  └──────┘   │   │    │
                    │  │  └────────────────────────┘   │    │
                    │  └───────────────────────────────┘    │
                    └─────────────────────────────────────────┘
```

### Security Measures

1. **Network Isolation**
   - ECS tasks in private subnets
   - No direct internet access to containers
   - Traffic only through ALB

2. **Security Groups**
   - ALB: Allows HTTP/HTTPS from internet
   - ECS Tasks: Only accepts traffic from ALB

3. **IAM Least Privilege**
   - Task execution role: Pull images, write logs only
   - Task role: Minimal application permissions

### Terraform Structure

```
infra/terraform/
├── main.tf           # Provider, backend config
├── variables.tf      # Input variables
├── outputs.tf        # Output values
├── vpc.tf            # VPC, subnets, NAT
├── security-groups.tf # Security groups
├── alb.tf            # Load balancer
├── ecr.tf            # Container registry
├── ecs.tf            # ECS cluster, service, auto-scaling
└── README.md         # Infrastructure documentation
```

### CD Pipeline Alignment

The CD workflow deploys using Terraform:

```yaml
- name: Terraform Apply
  run: |
    terraform apply -auto-approve \
      -var="image_tag=${{ github.sha }}"
```

This updates the ECS task definition with the new image tag, triggering a rolling deployment.

## Local Development

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm or yarn

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-username/shopping-cart-api.git
cd shopping-cart-api

# Install dependencies
npm install

# Run development server
npm run dev

# Access at http://localhost:3000
```

### Using Docker

```bash
# Start with docker-compose
cd infra && docker-compose up

# Or build and run production image
docker build -t shopping-cart-api:local -f infra/docker/prod/Dockerfile .
docker run -p 3000:3000 shopping-cart-api:local
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Hot Reload

Development mode uses `tsx watch` for automatic reloading on file changes.

## API Documentation

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/products` | List all products |
| GET | `/api/products/:productId` | Get product details |
| GET | `/api/cart/:sessionId` | Get cart contents |
| POST | `/api/cart/:sessionId/items` | Add item to cart |
| DELETE | `/api/cart/:sessionId/items/:itemId` | Remove item |
| PATCH | `/api/cart/:sessionId/items/:itemId` | Update quantity |
| POST | `/api/cart/:sessionId/checkout` | Checkout cart |

### Request/Response Examples

#### Add Item to Cart

```bash
POST /api/cart/session-123/items
Content-Type: application/json

{
  "productId": "prod-001",
  "quantity": 2
}
```

Response (201):
```json
{
  "sessionId": "session-123",
  "items": [
    {
      "itemId": "uuid-here",
      "productId": "prod-001",
      "productName": "Wireless Headphones",
      "unitPrice": 99.99,
      "currency": "USD",
      "quantity": 2,
      "lineTotal": 199.98
    }
  ],
  "itemCount": 2,
  "uniqueItemCount": 1,
  "subtotal": 199.98,
  "currency": "USD",
  "status": "active"
}
```

#### Checkout

```bash
POST /api/cart/session-123/checkout
Content-Type: application/json

{
  "taxRate": 0.08
}
```

Response (200):
```json
{
  "orderId": "uuid-here",
  "sessionId": "session-123",
  "items": [...],
  "itemCount": 2,
  "subtotal": 199.98,
  "tax": 16.00,
  "total": 215.98,
  "currency": "USD",
  "checkoutAt": "2024-01-15T10:30:00Z"
}
```

### Error Responses

```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found: invalid-id"
  }
}
```

| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | VALIDATION_ERROR | Invalid input |
| 404 | CART_NOT_FOUND | Cart doesn't exist |
| 404 | ITEM_NOT_FOUND | Item not in cart |
| 404 | PRODUCT_NOT_FOUND | Product doesn't exist |
| 409 | CART_ALREADY_CHECKED_OUT | Cart was already checked out |
| 422 | EMPTY_CART | Cannot checkout empty cart |
| 422 | PRODUCT_OUT_OF_STOCK | Product unavailable |

## Deployment Strategy

### Flow

1. **Code Push**: Developer pushes to main branch
2. **CI Pipeline**: Tests, lint, build validation
3. **Build Image**: Docker image built and pushed to ECR
4. **Deploy Staging**: Terraform applies with new image tag
5. **Verify**: Health checks confirm deployment
6. **Deploy Production**: Manual approval triggers production deployment

### Environment Configuration

| Environment | Auto-Deploy | Approval |
|-------------|-------------|----------|
| Staging | Yes | None |
| Production | No | Required |

### Rollback

The ECS deployment circuit breaker automatically rolls back if new tasks fail health checks.

## Trade-offs & Improvements

### What I Prioritized

1. **Domain modeling**: Rich domain with proper value objects and business rules
2. **Clean architecture**: Clear separation enabling easy testing
3. **Type safety**: Strict TypeScript preventing runtime errors
4. **CI/CD completeness**: Full pipeline from PR to production

### What I'd Add With More Time

1. **Event sourcing**: Track all cart changes for analytics
2. **Redis caching**: Session-based cart storage for scalability  
3. **OpenAPI spec**: Auto-generated API documentation
4. **E2E tests**: Full integration testing with test containers
5. **Observability**: Structured logging, distributed tracing
6. **Rate limiting**: Protect against abuse

### Known Limitations

1. **In-memory storage**: Data lost on restart (intentional for demo)
2. **No authentication**: Session ID assumed valid
3. **Single currency**: No multi-currency support
4. **No actual AWS deployment**: Infrastructure code only, not provisioned

## License

MIT
