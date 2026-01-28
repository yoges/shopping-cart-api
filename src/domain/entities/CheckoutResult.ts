/**
 * CheckoutResult Value Object
 *
 * Represents the result of a checkout operation.
 * Contains summary information about the completed order.
 */

import { Money } from '../value-objects/Money.js'
import { Cart } from './Cart.js'
import { CartItem, calculateLineTotal } from './CartItem.js'

export type CheckoutLineItem = {
  readonly productId: string
  readonly productName: string
  readonly quantity: number
  readonly unitPriceInCents: number
  readonly lineTotalInCents: number
}

export type CheckoutResult = {
  readonly orderId: string
  readonly sessionId: string
  readonly items: ReadonlyArray<CheckoutLineItem>
  readonly subtotal: Money
  readonly tax: Money
  readonly total: Money
  readonly itemCount: number
  readonly checkoutAt: Date
}

export type CreateCheckoutResultInput = {
  orderId: string
  cart: Cart
  taxRate?: number // Decimal, e.g., 0.08 for 8%
}

/**
 * Creates a CheckoutResult from a checked out cart
 */
export const createCheckoutResult = (
  input: CreateCheckoutResultInput
): CheckoutResult => {
  const { orderId, cart, taxRate = 0 } = input

  if (cart.status !== 'checked_out') {
    throw new Error('Cannot create checkout result from a cart that is not checked out')
  }

  const lineItems: CheckoutLineItem[] = cart.items.map(item => ({
    productId: item.productId.value,
    productName: item.productName,
    quantity: item.quantity.value,
    unitPriceInCents: item.unitPrice.amount,
    lineTotalInCents: calculateLineTotal(item).amount,
  }))

  const subtotalAmount = lineItems.reduce(
    (sum, item) => sum + item.lineTotalInCents,
    0
  )

  const taxAmount = Math.round(subtotalAmount * taxRate)
  const totalAmount = subtotalAmount + taxAmount

  const subtotal: Money = Object.freeze({
    amount: subtotalAmount,
    currency: cart.currency,
  })

  const tax: Money = Object.freeze({
    amount: taxAmount,
    currency: cart.currency,
  })

  const total: Money = Object.freeze({
    amount: totalAmount,
    currency: cart.currency,
  })

  const itemCount = lineItems.reduce((count, item) => count + item.quantity, 0)

  return Object.freeze({
    orderId,
    sessionId: cart.sessionId.value,
    items: Object.freeze(lineItems),
    subtotal,
    tax,
    total,
    itemCount,
    checkoutAt: new Date(),
  })
}
