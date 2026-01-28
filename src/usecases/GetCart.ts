/**
 * Get Cart Use Case
 *
 * Retrieves a shopping cart by session ID.
 * Returns null if no cart exists.
 */

import { Cart } from '../domain/entities/Cart.js'
import { CartRepository } from '../domain/repositories/CartRepository.js'

export type GetCartRequest = {
  sessionId: string
}

export type GetCart = {
  execute: (request: GetCartRequest) => Promise<Cart | null>
}

/**
 * Factory function to create the GetCart use case
 */
export const createGetCart = (cartRepository: CartRepository): GetCart => {
  return {
    execute: async (request: GetCartRequest): Promise<Cart | null> => {
      const { sessionId } = request

      const cart = await cartRepository.findBySessionId(sessionId)

      return cart
    },
  }
}
