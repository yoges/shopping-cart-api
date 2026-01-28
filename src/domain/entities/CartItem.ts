/**
 * CartItem Entity
 *
 * Represents an item in a shopping cart.
 * Contains product information at the time of adding to cart
 * (price snapshot to handle price changes).
 */

import { v4 as uuidv4 } from 'uuid'

import { Money, multiplyMoney, createMoney, Currency } from '../value-objects/Money.js'
import { ProductId, createProductId, productIdEquals } from '../value-objects/ProductId.js'
import { Quantity, createQuantity, addQuantity } from '../value-objects/Quantity.js'

export type CartItem = {
  readonly itemId: string
  readonly productId: ProductId
  readonly productName: string
  readonly unitPrice: Money
  readonly quantity: Quantity
  readonly addedAt: Date
}

export type CreateCartItemInput = {
  productId: string
  productName: string
  unitPriceInCents: number
  currency?: Currency
  quantity: number
  itemId?: string
}

/**
 * Creates a CartItem entity
 */
export const createCartItem = (input: CreateCartItemInput): CartItem => {
  const { productId, productName, unitPriceInCents, currency, quantity, itemId } = input

  if (!productName || productName.trim() === '') {
    throw new Error('Product name cannot be empty')
  }

  return Object.freeze({
    itemId: itemId ?? uuidv4(),
    productId: createProductId(productId),
    productName: productName.trim(),
    unitPrice: createMoney(unitPriceInCents, currency ?? 'USD'),
    quantity: createQuantity(quantity),
    addedAt: new Date(),
  })
}

/**
 * Updates the quantity of a cart item
 */
export const updateCartItemQuantity = (
  item: CartItem,
  newQuantity: Quantity
): CartItem => {
  return Object.freeze({
    ...item,
    quantity: newQuantity,
  })
}

/**
 * Increases the quantity of a cart item
 */
export const increaseCartItemQuantity = (
  item: CartItem,
  additionalQuantity: Quantity
): CartItem => {
  const newQuantity = addQuantity(item.quantity, additionalQuantity)
  return updateCartItemQuantity(item, newQuantity)
}

/**
 * Calculates the line total for a cart item
 */
export const calculateLineTotal = (item: CartItem): Money => {
  return multiplyMoney(item.unitPrice, item.quantity.value)
}

/**
 * Checks if two cart items have the same product
 */
export const isSameProduct = (a: CartItem, b: CartItem): boolean => {
  return productIdEquals(a.productId, b.productId)
}

/**
 * Checks if a cart item matches a product ID
 */
export const matchesProductId = (item: CartItem, productId: ProductId): boolean => {
  return productIdEquals(item.productId, productId)
}
