/**
 * Cart Repository Interface
 *
 * Defines the contract for cart persistence.
 * The domain layer depends on this interface,
 * while implementations live in the adapters layer.
 */

import { Cart } from '../entities/Cart.js'

export interface CartRepository {
  /**
   * Finds a cart by session ID
   * @returns The cart if found, null otherwise
   */
  findBySessionId(sessionId: string): Promise<Cart | null>

  /**
   * Saves a cart (creates or updates)
   */
  save(cart: Cart): Promise<void>

  /**
   * Deletes a cart by session ID
   * @returns true if deleted, false if not found
   */
  delete(sessionId: string): Promise<boolean>

  /**
   * Checks if a cart exists for a session
   */
  exists(sessionId: string): Promise<boolean>
}
