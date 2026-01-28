/**
 * Domain Errors
 *
 * Custom error types for domain-specific errors.
 * These errors are thrown by domain entities and use cases.
 */

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message)
    this.name = 'DomainError'
    Object.setPrototypeOf(this, DomainError.prototype)
  }
}

export class CartNotFoundError extends DomainError {
  constructor(sessionId: string) {
    super(`Cart not found for session: ${sessionId}`, 'CART_NOT_FOUND')
    this.name = 'CartNotFoundError'
    Object.setPrototypeOf(this, CartNotFoundError.prototype)
  }
}

export class ItemNotFoundError extends DomainError {
  constructor(itemId: string) {
    super(`Item not found: ${itemId}`, 'ITEM_NOT_FOUND')
    this.name = 'ItemNotFoundError'
    Object.setPrototypeOf(this, ItemNotFoundError.prototype)
  }
}

export class ProductNotFoundError extends DomainError {
  constructor(productId: string) {
    super(`Product not found: ${productId}`, 'PRODUCT_NOT_FOUND')
    this.name = 'ProductNotFoundError'
    Object.setPrototypeOf(this, ProductNotFoundError.prototype)
  }
}

export class ProductOutOfStockError extends DomainError {
  constructor(productId: string) {
    super(`Product is out of stock: ${productId}`, 'PRODUCT_OUT_OF_STOCK')
    this.name = 'ProductOutOfStockError'
    Object.setPrototypeOf(this, ProductOutOfStockError.prototype)
  }
}

export class InvalidQuantityError extends DomainError {
  constructor(message: string) {
    super(message, 'INVALID_QUANTITY')
    this.name = 'InvalidQuantityError'
    Object.setPrototypeOf(this, InvalidQuantityError.prototype)
  }
}

export class CartAlreadyCheckedOutError extends DomainError {
  constructor(sessionId: string) {
    super(`Cart has already been checked out: ${sessionId}`, 'CART_ALREADY_CHECKED_OUT')
    this.name = 'CartAlreadyCheckedOutError'
    Object.setPrototypeOf(this, CartAlreadyCheckedOutError.prototype)
  }
}

export class EmptyCartError extends DomainError {
  constructor() {
    super('Cannot checkout an empty cart', 'EMPTY_CART')
    this.name = 'EmptyCartError'
    Object.setPrototypeOf(this, EmptyCartError.prototype)
  }
}

export class CartLimitExceededError extends DomainError {
  constructor(maxItems: number) {
    super(`Cart cannot have more than ${maxItems} unique items`, 'CART_LIMIT_EXCEEDED')
    this.name = 'CartLimitExceededError'
    Object.setPrototypeOf(this, CartLimitExceededError.prototype)
  }
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * Type guard to check if an error is a DomainError
 */
export const isDomainError = (error: unknown): error is DomainError => {
  return error instanceof DomainError
}

/**
 * Gets the error code from an error, or 'UNKNOWN_ERROR' if not a DomainError
 */
export const getErrorCode = (error: unknown): string => {
  if (isDomainError(error)) {
    return error.code
  }
  return 'UNKNOWN_ERROR'
}
