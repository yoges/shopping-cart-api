/**
 * Quantity Value Object
 *
 * Represents a quantity of items in a cart.
 * Must be a positive integer.
 * Has a maximum limit to prevent abuse.
 */

export type Quantity = {
  readonly value: number
}

const MAX_QUANTITY = 99
const MIN_QUANTITY = 1

/**
 * Creates a Quantity value object
 * @param value - The quantity (must be positive integer)
 * @throws Error if quantity is invalid
 */
export const createQuantity = (value: number): Quantity => {
  if (!Number.isInteger(value)) {
    throw new Error('Quantity must be an integer')
  }

  if (value < MIN_QUANTITY) {
    throw new Error(`Quantity must be at least ${MIN_QUANTITY}`)
  }

  if (value > MAX_QUANTITY) {
    throw new Error(`Quantity cannot exceed ${MAX_QUANTITY}`)
  }

  return Object.freeze({ value })
}

/**
 * Adds two quantities together
 * @throws Error if result exceeds maximum
 */
export const addQuantity = (a: Quantity, b: Quantity): Quantity => {
  const sum = a.value + b.value
  if (sum > MAX_QUANTITY) {
    throw new Error(`Combined quantity cannot exceed ${MAX_QUANTITY}`)
  }
  return createQuantity(sum)
}

/**
 * Checks if two quantities are equal
 */
export const quantityEquals = (a: Quantity, b: Quantity): boolean => {
  return a.value === b.value
}

/**
 * Gets the maximum allowed quantity
 */
export const getMaxQuantity = (): number => MAX_QUANTITY

/**
 * Gets the minimum allowed quantity
 */
export const getMinQuantity = (): number => MIN_QUANTITY
