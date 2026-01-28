/**
 * ProductId Value Object
 *
 * Represents a unique identifier for a product.
 * Immutable and validates format.
 */

export type ProductId = {
  readonly value: string
}

const PRODUCT_ID_PATTERN = /^[a-zA-Z0-9-_]{1,50}$/

/**
 * Creates a ProductId value object
 * @param value - The product ID string
 * @throws Error if format is invalid
 */
export const createProductId = (value: string): ProductId => {
  if (!value || value.trim() === '') {
    throw new Error('ProductId cannot be empty')
  }

  const trimmed = value.trim()

  if (!PRODUCT_ID_PATTERN.test(trimmed)) {
    throw new Error(
      'ProductId must be 1-50 alphanumeric characters, hyphens, or underscores'
    )
  }

  return Object.freeze({ value: trimmed })
}

/**
 * Checks if two ProductIds are equal
 */
export const productIdEquals = (a: ProductId, b: ProductId): boolean => {
  return a.value === b.value
}

/**
 * Converts ProductId to string for serialization
 */
export const productIdToString = (productId: ProductId): string => {
  return productId.value
}
