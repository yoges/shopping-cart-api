/**
 * Checkout Presenter
 *
 * Transforms checkout result into API response format.
 */

import { CheckoutResult } from '../../domain/entities/CheckoutResult.js'
import { toDollars } from '../../domain/value-objects/Money.js'

export type CheckoutLineItemResponse = {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type CheckoutResponse = {
  orderId: string
  sessionId: string
  items: CheckoutLineItemResponse[]
  itemCount: number
  subtotal: number
  tax: number
  total: number
  currency: string
  checkoutAt: string
}

/**
 * Presents a checkout result for API response
 */
export const presentCheckout = (result: CheckoutResult): CheckoutResponse => {
  return {
    orderId: result.orderId,
    sessionId: result.sessionId,
    items: result.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPriceInCents / 100,
      lineTotal: item.lineTotalInCents / 100,
    })),
    itemCount: result.itemCount,
    subtotal: toDollars(result.subtotal),
    tax: toDollars(result.tax),
    total: toDollars(result.total),
    currency: result.total.currency,
    checkoutAt: result.checkoutAt.toISOString(),
  }
}
