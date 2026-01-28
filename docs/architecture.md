# Architecture Overview

This document describes the architectural decisions, patterns, and structure of the Shopping Cart API.

## Clean Architecture

The application follows Clean Architecture principles, with dependencies flowing inward toward the domain layer.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INFRASTRUCTURE                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                            ADAPTERS                                  │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                          USE CASES                           │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │                       DOMAIN                         │   │   │   │
│  │  │  │                                                      │   │   │   │
│  │  │  │   Entities, Value Objects, Repository Interfaces    │   │   │   │
│  │  │  │                                                      │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                              │   │   │
│  │  │   AddItemToCart, GetCart, CheckoutCart, RemoveItem          │   │   │
│  │  │                                                              │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │   Controllers, Presenters, Repository Implementations              │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   Express Server, Routes, Middleware                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### Domain Layer (`src/domain/`)

**No external dependencies.** Contains pure business logic.

| Directory | Purpose |
|-----------|---------|
| `entities/` | Core business objects (Cart, CartItem, Product) |
| `value-objects/` | Immutable value types (Money, Quantity, ProductId, SessionId) |
| `repositories/` | Repository interfaces (contracts only, no implementations) |
| `errors/` | Domain-specific error types |

**Key characteristics:**
- Pure TypeScript, no external libraries
- Immutable data structures
- Business rules enforced at creation
- Testable without any infrastructure

### Use Cases Layer (`src/usecases/`)

**Depends only on domain layer.** Contains application-specific business rules.

| Use Case | Purpose |
|----------|---------|
| `AddItemToCart` | Add product to cart, create cart if needed |
| `GetCart` | Retrieve cart by session ID |
| `RemoveItemFromCart` | Remove item from cart |
| `CheckoutCart` | Process checkout, return result |
| `UpdateItemQuantity` | Update item quantity |

**Pattern:** Factory functions that accept repository dependencies

```typescript
export const createAddItemToCart = (
  cartRepository: CartRepository,
  productRepository: ProductRepository
): AddItemToCart => {
  return {
    execute: async (request) => { /* ... */ }
  }
}
```

### Adapters Layer (`src/adapters/`)

**Depends on use cases and domain.** Bridges external world to application.

| Directory | Purpose |
|-----------|---------|
| `controllers/` | Handle HTTP requests, validate input, call use cases |
| `presenters/` | Transform domain objects to API responses |
| `repositories/` | Implement repository interfaces |

### Infrastructure Layer (`src/infrastructure/`)

**Depends on all layers.** Framework and driver concerns.

| File | Purpose |
|------|---------|
| `server.ts` | Express app setup, startup |
| `routes.ts` | Route definitions |
| `middleware.ts` | Logging, error handling, CORS |
| `container.ts` | Dependency injection composition |

## Dependency Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Request   │────►│ Controller  │────►│  Use Case   │────►│   Domain    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                   │                   │
                           │                   │                   │
                           ▼                   ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
                    │  Presenter  │     │ Repository  │     │   Errors    │
                    │  (format)   │     │   (impl)    │     │             │
                    └─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Response   │
                    └─────────────┘
```

## Design Patterns Implemented

### 1. Repository Pattern

**Purpose:** Abstract data access, enable testing with different implementations.

```typescript
// Domain defines the interface
export interface CartRepository {
  findBySessionId(sessionId: string): Promise<Cart | null>
  save(cart: Cart): Promise<void>
}

// Adapters implement it
export const createInMemoryCartRepository = (): CartRepository => {
  const storage = new Map()
  return {
    async findBySessionId(sessionId) { /* ... */ },
    async save(cart) { /* ... */ }
  }
}
```

**Benefits:**
- Domain doesn't know about storage details
- Easy to swap implementations (in-memory → database)
- Simple to mock in tests

### 2. Dependency Injection (via Factory Functions)

**Purpose:** Loose coupling between components.

```typescript
// Use case receives dependencies through factory
export const createAddItemToCart = (
  cartRepository: CartRepository,
  productRepository: ProductRepository
): AddItemToCart => {
  return {
    execute: async (request) => {
      // Can use dependencies without knowing implementations
    }
  }
}

// Composed in container
const addItemToCart = createAddItemToCart(cartRepository, productRepository)
```

**Benefits:**
- Components don't create their own dependencies
- Easy to substitute for testing
- Clear dependency graph

### 3. Use Case Pattern

**Purpose:** Encapsulate application business logic in composable functions.

```typescript
export type AddItemToCart = {
  execute: (request: AddItemRequest) => Promise<Cart>
}
```

**Benefits:**
- Single responsibility per use case
- Easy to test in isolation
- Clear API contract

### 4. Value Objects

**Purpose:** Represent domain concepts with validation and behavior.

```typescript
export const createMoney = (cents: number, currency: Currency = 'USD'): Money => {
  if (!Number.isInteger(cents)) throw new Error('Money amount must be an integer')
  if (cents < 0) throw new Error('Money amount cannot be negative')
  return Object.freeze({ amount: cents, currency })
}
```

**Benefits:**
- Invalid states are unrepresentable
- Behavior lives with data
- Immutable by design

### 5. Presenter Pattern

**Purpose:** Separate response formatting from business logic.

```typescript
export const presentCart = (cart: Cart): CartResponse => {
  return {
    sessionId: cart.sessionId.value,
    items: cart.items.map(presentCartItem),
    subtotal: toDollars(calculateCartTotal(cart)),
    // ...
  }
}
```

**Benefits:**
- Domain objects stay pure
- Response format can change without affecting domain
- Consistent API responses

### 6. Factory Functions

**Purpose:** Create and compose objects without classes.

```typescript
// Instead of: new CartController(deps)
export const createCartController = (deps: Dependencies): CartController => {
  return {
    addItem: async (req, res) => { /* ... */ },
    getCart: async (req, res) => { /* ... */ },
  }
}
```

**Benefits:**
- Simpler than class hierarchies
- No `this` binding issues
- Easy to compose and test

## Why These Patterns?

### Factory Functions over Classes

**Chosen approach:** Functional composition with factory functions

**Reasons:**
- Avoids `this` binding complexity
- Easier to compose and partially apply
- Better tree-shaking in bundlers
- Aligns with React/modern JS ecosystem

**Trade-off:** Slightly more verbose than class syntax, but cleaner in practice

### Immutable Domain Objects

**Chosen approach:** `Object.freeze()` and readonly types

**Reasons:**
- Prevents accidental mutation
- Makes reasoning about state easier
- Enables safe sharing of objects
- Better for testing (no side effects)

**Trade-off:** Need to create new objects for updates

### In-Memory Storage

**Chosen approach:** Simple `Map`-based storage

**Reasons:**
- Focus on architecture, not persistence
- Demonstrates repository pattern
- Easy to swap for real database
- Fast for development/testing

## Testing Strategy

### Domain Tests
- Pure unit tests
- No mocking needed
- Test business rules directly

### Use Case Tests
- Use real in-memory repositories
- Test application logic
- Verify orchestration

### Adapter Tests
- Test repository serialization
- Test presenter formatting
- Mock external services if any

### Integration Tests
- Not included (per requirements)
- "Should connect or crash" philosophy
- Would test HTTP endpoints in real project

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| TypeScript strict mode | Catch errors at compile time |
| Functional approach | Simpler than OOP, better composition |
| Factory functions | Explicit dependencies, no `this` |
| Immutable data | Predictable state, easier testing |
| Value objects | Type safety, encapsulated validation |
| In-memory storage | Focus on design, not persistence |
| Separate presenters | Clean separation of concerns |
| Domain errors | Type-safe error handling |
