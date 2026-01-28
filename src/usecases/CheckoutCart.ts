/**
 * Checkout Cart Use Case
 *
 * Processes the checkout of a shopping cart.
 * Marks the cart as checked out and returns a checkout result.
 */

import { v4 as uuidv4 } from 'uuid'

import { checkout, canCheckout } from '../domain/entities/Cart.js'
import {
  CheckoutResult,
  createCheckoutResult,
} from '../domain/entities/CheckoutResult.js'
import { CartRepository } from '../domain/repositories/CartRepository.js'
import {
  CartNotFoundError,
  EmptyCartError,
  CartAlreadyCheckedOutError,
} from '../domain/errors/DomainError.js'

export type CheckoutRequest = {
  sessionId: string
  taxRate?: number // Optional tax rate as decimal (e.g., 0.08 for 8%)
}

export type CheckoutCart = {
  execute: (request: CheckoutRequest) => Promise<CheckoutResult>
}

/**
 * Factory function to create the CheckoutCart use case
 */
export const createCheckoutCart = (
  cartRepository: CartRepository
): CheckoutCart => {
  return {
    execute: async (request: CheckoutRequest): Promise<CheckoutResult> => {
      const { sessionId, taxRate = 0 } = request

      // Get cart
      const cart = await cartRepository.findBySessionId(sessionId)

      if (!cart) {
        throw new CartNotFoundError(sessionId)
      }

      // Validate cart can be checked out
      if (cart.status === 'checked_out') {
        throw new CartAlreadyCheckedOutError(sessionId)
      }

      if (cart.items.length === 0) {
        throw new EmptyCartError()
      }

      // Process checkout
      const checkedOutCart = checkout(cart)

      // Generate order ID
      const orderId = uuidv4()

      // Persist the checked out cart
      await cartRepository.save(checkedOutCart)

      // Create checkout result
      const result = createCheckoutResult({
        orderId,
        cart: checkedOutCart,
        taxRate,
      })

      return result
    },
  }
}
