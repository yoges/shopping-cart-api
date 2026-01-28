/**
 * Update Item Quantity Use Case
 *
 * Updates the quantity of an item in a shopping cart.
 */

import {
  Cart,
  updateItemQuantity as domainUpdateQuantity,
} from '../domain/entities/Cart.js'
import { CartRepository } from '../domain/repositories/CartRepository.js'
import {
  CartNotFoundError,
  ItemNotFoundError,
} from '../domain/errors/DomainError.js'

export type UpdateQuantityRequest = {
  sessionId: string
  itemId: string
  quantity: number
}

export type UpdateItemQuantity = {
  execute: (request: UpdateQuantityRequest) => Promise<Cart>
}

/**
 * Factory function to create the UpdateItemQuantity use case
 */
export const createUpdateItemQuantity = (
  cartRepository: CartRepository
): UpdateItemQuantity => {
  return {
    execute: async (request: UpdateQuantityRequest): Promise<Cart> => {
      const { sessionId, itemId, quantity } = request

      // Get cart
      const cart = await cartRepository.findBySessionId(sessionId)

      if (!cart) {
        throw new CartNotFoundError(sessionId)
      }

      // Check if item exists in cart
      const itemExists = cart.items.some(item => item.itemId === itemId)

      if (!itemExists) {
        throw new ItemNotFoundError(itemId)
      }

      // Update quantity
      const updatedCart = domainUpdateQuantity(cart, itemId, quantity)

      // Persist the cart
      await cartRepository.save(updatedCart)

      return updatedCart
    },
  }
}
