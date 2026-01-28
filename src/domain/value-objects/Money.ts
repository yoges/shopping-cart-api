/**
 * Money Value Object
 *
 * Represents a monetary amount with currency.
 * Immutable - all operations return new instances.
 * Handles precision issues with proper rounding.
 */

export type Currency = 'USD' | 'EUR' | 'GBP'

export type Money = {
  readonly amount: number // Stored in cents to avoid floating point issues
  readonly currency: Currency
}

/**
 * Creates a Money value object from cents
 * @param cents - Amount in cents (must be non-negative integer)
 * @param currency - Currency code (default: USD)
 */
export const createMoney = (cents: number, currency: Currency = 'USD'): Money => {
  if (!Number.isInteger(cents)) {
    throw new Error('Money amount must be an integer (cents)')
  }
  if (cents < 0) {
    throw new Error('Money amount cannot be negative')
  }
  return Object.freeze({ amount: cents, currency })
}

/**
 * Creates a Money value object from dollars
 * @param dollars - Amount in dollars
 * @param currency - Currency code (default: USD)
 */
export const createMoneyFromDollars = (
  dollars: number,
  currency: Currency = 'USD'
): Money => {
  const cents = Math.round(dollars * 100)
  return createMoney(cents, currency)
}

/**
 * Adds two Money values together
 * @throws Error if currencies don't match
 */
export const addMoney = (a: Money, b: Money): Money => {
  if (a.currency !== b.currency) {
    throw new Error(
      `Currency mismatch: cannot add ${a.currency} and ${b.currency}`
    )
  }
  return createMoney(a.amount + b.amount, a.currency)
}

/**
 * Subtracts b from a
 * @throws Error if currencies don't match or result would be negative
 */
export const subtractMoney = (a: Money, b: Money): Money => {
  if (a.currency !== b.currency) {
    throw new Error(
      `Currency mismatch: cannot subtract ${b.currency} from ${a.currency}`
    )
  }
  if (a.amount < b.amount) {
    throw new Error('Subtraction would result in negative money')
  }
  return createMoney(a.amount - b.amount, a.currency)
}

/**
 * Multiplies money by a quantity
 */
export const multiplyMoney = (money: Money, quantity: number): Money => {
  if (quantity < 0) {
    throw new Error('Cannot multiply money by negative quantity')
  }
  if (!Number.isInteger(quantity)) {
    throw new Error('Quantity must be an integer')
  }
  return createMoney(money.amount * quantity, money.currency)
}

/**
 * Checks if two Money values are equal
 */
export const moneyEquals = (a: Money, b: Money): boolean => {
  return a.amount === b.amount && a.currency === b.currency
}

/**
 * Formats money for display
 */
export const formatMoney = (money: Money): string => {
  const dollars = money.amount / 100
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: money.currency,
  })
  return formatter.format(dollars)
}

/**
 * Creates a zero money value
 */
export const zeroMoney = (currency: Currency = 'USD'): Money => {
  return createMoney(0, currency)
}

/**
 * Converts money to dollars (for serialization)
 */
export const toDollars = (money: Money): number => {
  return money.amount / 100
}
