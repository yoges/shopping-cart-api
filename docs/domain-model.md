# Domain Model Design

This document describes the domain model for the Shopping Cart API, including entities, aggregates, value objects, and business rules.

## Entity and Aggregate Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CART AGGREGATE                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  ┌──────────────────┐                                               │   │
│  │  │   Cart (Root)    │                                               │   │
│  │  │  ──────────────  │                                               │   │
│  │  │  sessionId: SessionId                                            │   │
│  │  │  items: CartItem[]                                               │   │
│  │  │  status: CartStatus                                              │   │
│  │  │  currency: Currency                                              │   │
│  │  │  createdAt: Date                                                 │   │
│  │  │  updatedAt: Date                                                 │   │
│  │  └────────┬─────────┘                                               │   │
│  │           │                                                          │   │
│  │           │ contains 0..N                                            │   │
│  │           ▼                                                          │   │
│  │  ┌──────────────────┐      ┌──────────────────┐                     │   │
│  │  │    CartItem      │      │    Product       │                     │   │
│  │  │  ──────────────  │      │  (Reference)     │                     │   │
│  │  │  itemId: string  │◄─────│  ──────────────  │                     │   │
│  │  │  productId: ProductId    │  id: ProductId   │                     │   │
│  │  │  productName: string    │  name: string    │                     │   │
│  │  │  unitPrice: Money       │  price: Money    │                     │   │
│  │  │  quantity: Quantity     │  sku: string     │                     │   │
│  │  │  addedAt: Date   │      │  inStock: boolean│                     │   │
│  │  └──────────────────┘      └──────────────────┘                     │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  VALUE OBJECTS                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Money     │  │  ProductId  │  │  Quantity   │  │  SessionId  │       │
│  │ ─────────── │  │ ─────────── │  │ ─────────── │  │ ─────────── │       │
│  │ amount: int │  │ value: str  │  │ value: int  │  │ value: str  │       │
│  │ currency    │  └─────────────┘  └─────────────┘  └─────────────┘       │
│  └─────────────┘                                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      CHECKOUT RESULT (Value Object)                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  orderId: string                                                     │   │
│  │  sessionId: string                                                   │   │
│  │  items: CheckoutLineItem[]                                           │   │
│  │  subtotal: Money                                                     │   │
│  │  tax: Money                                                          │   │
│  │  total: Money                                                        │   │
│  │  itemCount: number                                                   │   │
│  │  checkoutAt: Date                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Aggregate Boundaries

### Cart Aggregate

The `Cart` is the **aggregate root** for the shopping cart domain. All modifications to cart items must go through the Cart entity.

**Why Cart is the aggregate root:**
- A cart item has no meaning outside of a cart
- Business rules span across all items (max items, currency consistency)
- Consistency must be maintained across the entire cart

**Aggregate boundaries:**
- Cart
  - CartItem (owned by Cart)
  - Value objects (Money, Quantity, ProductId, SessionId)

**What's outside the aggregate:**
- Product (separate bounded context - referenced by ID)
- Order (created after checkout, separate lifecycle)

## Value Objects

### Money

Represents a monetary amount with currency. Stored in cents to avoid floating-point precision issues.

```typescript
type Money = {
  readonly amount: number    // In cents (e.g., 1099 = $10.99)
  readonly currency: Currency  // 'USD' | 'EUR' | 'GBP'
}
```

**Why it's a value object:**
- Immutable
- Equality based on value, not identity
- No lifecycle independent of its entity
- Encapsulates money arithmetic rules

**Invariants:**
- Amount must be a non-negative integer
- Currency operations must match currencies

### ProductId

Unique identifier for a product.

```typescript
type ProductId = {
  readonly value: string
}
```

**Validation rules:**
- 1-50 alphanumeric characters, hyphens, or underscores
- Cannot be empty

### Quantity

Represents the quantity of an item in the cart.

```typescript
type Quantity = {
  readonly value: number
}
```

**Invariants:**
- Must be a positive integer
- Minimum: 1
- Maximum: 99 (prevents abuse)

### SessionId

Unique identifier for a shopping session.

```typescript
type SessionId = {
  readonly value: string
}
```

**Validation rules:**
- 1-100 alphanumeric characters or hyphens
- Typically a UUID

## Entities

### Cart (Aggregate Root)

The central entity managing the shopping cart lifecycle.

```typescript
type Cart = {
  readonly sessionId: SessionId
  readonly items: ReadonlyArray<CartItem>
  readonly status: CartStatus  // 'active' | 'checked_out' | 'abandoned'
  readonly currency: Currency
  readonly createdAt: Date
  readonly updatedAt: Date
}
```

**Business Rules Enforced:**
1. Maximum 20 unique items per cart
2. Items with same product are merged (quantity increased)
3. Cannot modify a checked-out cart
4. Cannot checkout an empty cart
5. All items must use the cart's currency

### CartItem

An item in the shopping cart.

```typescript
type CartItem = {
  readonly itemId: string
  readonly productId: ProductId
  readonly productName: string
  readonly unitPrice: Money      // Price snapshot at time of adding
  readonly quantity: Quantity
  readonly addedAt: Date
}
```

**Design decisions:**
- Stores product name and price as snapshots (not references)
- This protects against price changes affecting existing carts
- itemId is unique within the cart for direct removal

### Product (Reference Entity)

Products are external to the cart aggregate. We only reference them by ID.

```typescript
type Product = {
  readonly id: ProductId
  readonly name: string
  readonly description: string
  readonly price: Money
  readonly sku: string
  readonly inStock: boolean
}
```

**Note:** In a real system, products would be managed by a separate Product Catalog service/bounded context.

## Business Rules and Invariants

### Cart Invariants

| Rule | Description | Enforcement |
|------|-------------|-------------|
| Max Items | Cart cannot have more than 20 unique items | `addItemToCart()` throws error |
| Quantity Merge | Same product = merged quantities | `addItemToCart()` merges automatically |
| Checked Out | Cannot modify checked-out cart | All modification functions check status |
| Empty Checkout | Cannot checkout empty cart | `checkout()` validates items > 0 |
| Currency Consistency | All items use cart's currency | Items inherit cart currency on add |

### Quantity Invariants

| Rule | Description | Enforcement |
|------|-------------|-------------|
| Positive | Quantity must be at least 1 | `createQuantity()` throws error |
| Maximum | Quantity cannot exceed 99 | `createQuantity()` throws error |
| Integer | Quantity must be whole number | `createQuantity()` throws error |

### Money Invariants

| Rule | Description | Enforcement |
|------|-------------|-------------|
| Non-negative | Amount cannot be negative | `createMoney()` throws error |
| Integer cents | Amount must be integer | `createMoney()` throws error |
| Currency match | Operations require matching currencies | Arithmetic functions throw error |

## Why This Model?

### Trade-offs Considered

1. **Price Snapshot vs Reference**
   - **Chosen:** Store price at time of adding
   - **Reason:** Protects customer from price changes mid-session
   - **Trade-off:** Stale data if product updates, but acceptable for cart lifecycle

2. **Quantity as Value Object vs Primitive**
   - **Chosen:** Dedicated Quantity type
   - **Reason:** Encapsulates validation, prevents invalid states
   - **Trade-off:** Slight complexity, but type safety worth it

3. **Money in Cents vs Decimals**
   - **Chosen:** Integer cents
   - **Reason:** Avoids floating-point precision issues ($10.99 + $0.01 = $11.00, not $10.999...)
   - **Trade-off:** Need conversion for display, but correctness critical for money

4. **Cart Status as String Union vs Boolean Flags**
   - **Chosen:** Explicit status enum
   - **Reason:** Extensible (can add 'abandoned', 'expired'), clear state machine
   - **Trade-off:** More complex than `isCheckedOut: boolean`

### Alternative Designs Rejected

1. **Separate CartItem Repository**
   - Rejected because cart items have no lifecycle outside cart
   - Would break aggregate consistency guarantees

2. **Product Entity Inside Cart Aggregate**
   - Rejected because products have independent lifecycle
   - Cart only needs product snapshot, not full product management

3. **Order Created During Checkout**
   - Kept simple: checkout returns result, no Order entity
   - Real system would have Order aggregate in separate bounded context

## Domain Events (Future Enhancement)

If implementing event sourcing or event-driven architecture:

```typescript
type DomainEvent =
  | { type: 'CartCreated'; sessionId: string; timestamp: Date }
  | { type: 'ItemAddedToCart'; sessionId: string; productId: string; quantity: number }
  | { type: 'ItemRemovedFromCart'; sessionId: string; itemId: string }
  | { type: 'ItemQuantityUpdated'; sessionId: string; itemId: string; newQuantity: number }
  | { type: 'CartCheckedOut'; sessionId: string; orderId: string }
  | { type: 'CartAbandoned'; sessionId: string }
```

**Not implemented because:**
- Assessment focuses on domain modeling, not event infrastructure
- In-memory storage doesn't benefit from events
- Would add complexity without demonstrating additional concepts
