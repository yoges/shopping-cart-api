/**
 * In-Memory Cart Repository
 *
 * Implementation of CartRepository using in-memory storage.
 * Suitable for development and testing.
 */

import { Cart, reconstitute, CartStatus } from '../../domain/entities/Cart.js'
import { CartItem } from '../../domain/entities/CartItem.js'
import { CartRepository } from '../../domain/repositories/CartRepository.js'
import { Currency } from '../../domain/value-objects/Money.js'

// Internal storage type for serialization
type StoredCart = {
  sessionId: string
  items: StoredCartItem[]
  status: CartStatus
  createdAt: string
  updatedAt: string
  currency: Currency
}

type StoredCartItem = {
  itemId: string
  productId: string
  productName: string
  unitPriceAmount: number
  unitPriceCurrency: Currency
  quantity: number
  addedAt: string
}

export type InMemoryCartRepository = CartRepository & {
  clear: () => void
  size: () => number
}

/**
 * Factory function to create an InMemoryCartRepository
 */
export const createInMemoryCartRepository = (): InMemoryCartRepository => {
  const storage = new Map<string, StoredCart>()

  const serializeCart = (cart: Cart): StoredCart => {
    return {
      sessionId: cart.sessionId.value,
      items: cart.items.map(item => ({
        itemId: item.itemId,
        productId: item.productId.value,
        productName: item.productName,
        unitPriceAmount: item.unitPrice.amount,
        unitPriceCurrency: item.unitPrice.currency,
        quantity: item.quantity.value,
        addedAt: item.addedAt.toISOString(),
      })),
      status: cart.status,
      createdAt: cart.createdAt.toISOString(),
      updatedAt: cart.updatedAt.toISOString(),
      currency: cart.currency,
    }
  }

  const deserializeCart = (stored: StoredCart): Cart => {
    const items: CartItem[] = stored.items.map(item =>
      Object.freeze({
        itemId: item.itemId,
        productId: Object.freeze({ value: item.productId }),
        productName: item.productName,
        unitPrice: Object.freeze({
          amount: item.unitPriceAmount,
          currency: item.unitPriceCurrency,
        }),
        quantity: Object.freeze({ value: item.quantity }),
        addedAt: new Date(item.addedAt),
      })
    )

    return reconstitute({
      sessionId: stored.sessionId,
      items,
      status: stored.status,
      createdAt: new Date(stored.createdAt),
      updatedAt: new Date(stored.updatedAt),
      currency: stored.currency,
    })
  }

  return {
    async findBySessionId(sessionId: string): Promise<Cart | null> {
      const stored = storage.get(sessionId)
      if (!stored) {
        return null
      }
      return deserializeCart(stored)
    },

    async save(cart: Cart): Promise<void> {
      const serialized = serializeCart(cart)
      storage.set(cart.sessionId.value, serialized)
    },

    async delete(sessionId: string): Promise<boolean> {
      return storage.delete(sessionId)
    },

    async exists(sessionId: string): Promise<boolean> {
      return storage.has(sessionId)
    },

    clear(): void {
      storage.clear()
    },

    size(): number {
      return storage.size
    },
  }
}
