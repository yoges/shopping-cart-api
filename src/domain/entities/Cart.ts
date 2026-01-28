/**
 * Cart Aggregate Root
 *
 * The Cart is the aggregate root for the shopping cart domain.
 * All operations on cart items go through the Cart.
 *
 * Business Rules:
 * - A cart belongs to a session
 * - Items with the same product are merged (quantity increased)
 * - Maximum 20 unique items per cart
 * - Cart can be checked out only if not empty
 * - Once checked out, cart cannot be modified
 */

import {
  CartItem,
  createCartItem,
  CreateCartItemInput,
  increaseCartItemQuantity,
  calculateLineTotal,
} from './CartItem.js'
import { Money, addMoney, zeroMoney, Currency } from '../value-objects/Money.js'
import { SessionId, createSessionId } from '../value-objects/SessionId.js'
import { createProductId } from '../value-objects/ProductId.js'
import { createQuantity } from '../value-objects/Quantity.js'

export type CartStatus = 'active' | 'checked_out' | 'abandoned'

export type Cart = {
  readonly sessionId: SessionId
  readonly items: ReadonlyArray<CartItem>
  readonly status: CartStatus
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly currency: Currency
}

const MAX_UNIQUE_ITEMS = 20

/**
 * Creates a new empty Cart
 */
export const createCart = (
  sessionId: string,
  currency: Currency = 'USD'
): Cart => {
  return Object.freeze({
    sessionId: createSessionId(sessionId),
    items: [],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    currency,
  })
}

/**
 * Reconstructs a Cart from persistence
 */
export const reconstitute = (data: {
  sessionId: string
  items: CartItem[]
  status: CartStatus
  createdAt: Date
  updatedAt: Date
  currency: Currency
}): Cart => {
  return Object.freeze({
    sessionId: createSessionId(data.sessionId),
    items: Object.freeze([...data.items]),
    status: data.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    currency: data.currency,
  })
}

/**
 * Adds an item to the cart
 * If item with same product exists, increases quantity
 *
 * @throws Error if cart is checked out
 * @throws Error if max items reached
 */
export const addItemToCart = (
  cart: Cart,
  input: CreateCartItemInput
): Cart => {
  assertCartIsActive(cart)

  const existingItemIndex = cart.items.findIndex(
    item => item.productId.value === input.productId
  )

  let newItems: CartItem[]

  if (existingItemIndex >= 0) {
    // Merge with existing item
    const existingItem = cart.items[existingItemIndex]!
    const additionalQuantity = createQuantity(input.quantity)
    const updatedItem = increaseCartItemQuantity(existingItem, additionalQuantity)

    newItems = [...cart.items]
    newItems[existingItemIndex] = updatedItem
  } else {
    // Add new item
    if (cart.items.length >= MAX_UNIQUE_ITEMS) {
      throw new Error(`Cart cannot have more than ${MAX_UNIQUE_ITEMS} unique items`)
    }
    const newItem = createCartItem({
      ...input,
      currency: cart.currency,
    })
    newItems = [...cart.items, newItem]
  }

  return Object.freeze({
    ...cart,
    items: Object.freeze(newItems),
    updatedAt: new Date(),
  })
}

/**
 * Removes an item from the cart by item ID
 *
 * @throws Error if cart is checked out
 * @throws Error if item not found
 */
export const removeItemFromCart = (cart: Cart, itemId: string): Cart => {
  assertCartIsActive(cart)

  const itemIndex = cart.items.findIndex(item => item.itemId === itemId)

  if (itemIndex === -1) {
    throw new Error(`Item with ID ${itemId} not found in cart`)
  }

  const newItems = cart.items.filter(item => item.itemId !== itemId)

  return Object.freeze({
    ...cart,
    items: Object.freeze(newItems),
    updatedAt: new Date(),
  })
}

/**
 * Updates the quantity of an item in the cart
 *
 * @throws Error if cart is checked out
 * @throws Error if item not found
 */
export const updateItemQuantity = (
  cart: Cart,
  itemId: string,
  quantity: number
): Cart => {
  assertCartIsActive(cart)

  const itemIndex = cart.items.findIndex(item => item.itemId === itemId)

  if (itemIndex === -1) {
    throw new Error(`Item with ID ${itemId} not found in cart`)
  }

  const newQuantity = createQuantity(quantity)
  const existingItem = cart.items[itemIndex]!

  const updatedItem: CartItem = Object.freeze({
    ...existingItem,
    quantity: newQuantity,
  })

  const newItems = [...cart.items]
  newItems[itemIndex] = updatedItem

  return Object.freeze({
    ...cart,
    items: Object.freeze(newItems),
    updatedAt: new Date(),
  })
}

/**
 * Calculates the total price of all items in the cart
 */
export const calculateCartTotal = (cart: Cart): Money => {
  return cart.items.reduce(
    (total, item) => addMoney(total, calculateLineTotal(item)),
    zeroMoney(cart.currency)
  )
}

/**
 * Gets the total number of items in the cart (sum of quantities)
 */
export const getTotalItemCount = (cart: Cart): number => {
  return cart.items.reduce((count, item) => count + item.quantity.value, 0)
}

/**
 * Checks if the cart is empty
 */
export const isCartEmpty = (cart: Cart): boolean => {
  return cart.items.length === 0
}

/**
 * Checks if the cart can be checked out
 */
export const canCheckout = (cart: Cart): boolean => {
  return cart.status === 'active' && !isCartEmpty(cart)
}

/**
 * Marks the cart as checked out
 *
 * @throws Error if cart cannot be checked out
 */
export const checkout = (cart: Cart): Cart => {
  if (!canCheckout(cart)) {
    if (cart.status !== 'active') {
      throw new Error('Cart has already been checked out')
    }
    if (isCartEmpty(cart)) {
      throw new Error('Cannot checkout an empty cart')
    }
    throw new Error('Cart cannot be checked out')
  }

  return Object.freeze({
    ...cart,
    status: 'checked_out',
    updatedAt: new Date(),
  })
}

/**
 * Clears all items from the cart
 *
 * @throws Error if cart is checked out
 */
export const clearCart = (cart: Cart): Cart => {
  assertCartIsActive(cart)

  return Object.freeze({
    ...cart,
    items: Object.freeze([]),
    updatedAt: new Date(),
  })
}

/**
 * Finds an item in the cart by product ID
 */
export const findItemByProductId = (
  cart: Cart,
  productId: string
): CartItem | undefined => {
  return cart.items.find(item => item.productId.value === productId)
}

/**
 * Finds an item in the cart by item ID
 */
export const findItemById = (
  cart: Cart,
  itemId: string
): CartItem | undefined => {
  return cart.items.find(item => item.itemId === itemId)
}

/**
 * Gets the maximum number of unique items allowed in a cart
 */
export const getMaxUniqueItems = (): number => MAX_UNIQUE_ITEMS

// Private helper functions

function assertCartIsActive(cart: Cart): void {
  if (cart.status === 'checked_out') {
    throw new Error('Cannot modify a checked out cart')
  }
  if (cart.status === 'abandoned') {
    throw new Error('Cannot modify an abandoned cart')
  }
}
