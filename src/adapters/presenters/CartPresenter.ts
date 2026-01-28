/**
 * Cart Presenter
 *
 * Transforms domain entities into API response formats.
 * Keeps response format concerns separate from domain logic.
 */

import { Cart, calculateCartTotal, getTotalItemCount } from '../../domain/entities/Cart.js'
import { CartItem, calculateLineTotal } from '../../domain/entities/CartItem.js'
import { toDollars } from '../../domain/value-objects/Money.js'

export type CartItemResponse = {
  itemId: string
  productId: string
  productName: string
  unitPrice: number
  currency: string
  quantity: number
  lineTotal: number
  addedAt: string
}

export type CartResponse = {
  sessionId: string
  items: CartItemResponse[]
  itemCount: number
  uniqueItemCount: number
  subtotal: number
  currency: string
  status: string
  createdAt: string
  updatedAt: string
}

/**
 * Presents a cart item for API response
 */
export const presentCartItem = (item: CartItem): CartItemResponse => {
  const lineTotal = calculateLineTotal(item)

  return {
    itemId: item.itemId,
    productId: item.productId.value,
    productName: item.productName,
    unitPrice: toDollars(item.unitPrice),
    currency: item.unitPrice.currency,
    quantity: item.quantity.value,
    lineTotal: toDollars(lineTotal),
    addedAt: item.addedAt.toISOString(),
  }
}

/**
 * Presents a cart for API response
 */
export const presentCart = (cart: Cart): CartResponse => {
  const total = calculateCartTotal(cart)
  const itemCount = getTotalItemCount(cart)

  return {
    sessionId: cart.sessionId.value,
    items: cart.items.map(presentCartItem),
    itemCount,
    uniqueItemCount: cart.items.length,
    subtotal: toDollars(total),
    currency: cart.currency,
    status: cart.status,
    createdAt: cart.createdAt.toISOString(),
    updatedAt: cart.updatedAt.toISOString(),
  }
}

/**
 * Presents an empty cart response
 */
export const presentEmptyCart = (sessionId: string): CartResponse => {
  return {
    sessionId,
    items: [],
    itemCount: 0,
    uniqueItemCount: 0,
    subtotal: 0,
    currency: 'USD',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
