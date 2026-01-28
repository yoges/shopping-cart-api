/**
 * Add Item To Cart Use Case
 *
 * Adds a product to a shopping cart.
 * Creates a new cart if one doesn't exist for the session.
 * Merges quantities if the product already exists in the cart.
 */

import {
  Cart,
  createCart,
  addItemToCart as domainAddItem,
} from '../domain/entities/Cart.js'
import { CartRepository } from '../domain/repositories/CartRepository.js'
import { ProductRepository } from '../domain/repositories/ProductRepository.js'
import {
  ProductNotFoundError,
  ProductOutOfStockError,
} from '../domain/errors/DomainError.js'

export type AddItemRequest = {
  sessionId: string
  productId: string
  quantity: number
}

export type AddItemToCart = {
  execute: (request: AddItemRequest) => Promise<Cart>
}

/**
 * Factory function to create the AddItemToCart use case
 */
export const createAddItemToCart = (
  cartRepository: CartRepository,
  productRepository: ProductRepository
): AddItemToCart => {
  return {
    execute: async (request: AddItemRequest): Promise<Cart> => {
      const { sessionId, productId, quantity } = request

      // Validate product exists and is in stock
      const product = await productRepository.findById(productId)

      if (!product) {
        throw new ProductNotFoundError(productId)
      }

      if (!product.inStock) {
        throw new ProductOutOfStockError(productId)
      }

      // Get or create cart
      let cart = await cartRepository.findBySessionId(sessionId)

      if (!cart) {
        cart = createCart(sessionId)
      }

      // Add item to cart (domain logic handles merging)
      const updatedCart = domainAddItem(cart, {
        productId: product.id.value,
        productName: product.name,
        unitPriceInCents: product.price.amount,
        currency: product.price.currency,
        quantity,
      })

      // Persist the cart
      await cartRepository.save(updatedCart)

      return updatedCart
    },
  }
}
