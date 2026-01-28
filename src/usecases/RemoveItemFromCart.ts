/**
 * Remove Item From Cart Use Case
 *
 * Removes an item from a shopping cart by item ID.
 */

import {
  Cart,
  removeItemFromCart as domainRemoveItem,
} from '../domain/entities/Cart.js'
import { CartRepository } from '../domain/repositories/CartRepository.js'
import {
  CartNotFoundError,
  ItemNotFoundError,
} from '../domain/errors/DomainError.js'

export type RemoveItemRequest = {
  sessionId: string
  itemId: string
}

export type RemoveItemFromCart = {
  execute: (request: RemoveItemRequest) => Promise<Cart>
}

/**
 * Factory function to create the RemoveItemFromCart use case
 */
export const createRemoveItemFromCart = (
  cartRepository: CartRepository
): RemoveItemFromCart => {
  return {
    execute: async (request: RemoveItemRequest): Promise<Cart> => {
      const { sessionId, itemId } = request

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

      // Remove item from cart
      const updatedCart = domainRemoveItem(cart, itemId)

      // Persist the cart
      await cartRepository.save(updatedCart)

      return updatedCart
    },
  }
}
