/**
 * Dependency Injection Container
 *
 * Composes all dependencies and creates the application.
 * This is where all the pieces come together.
 */

import { createInMemoryCartRepository } from '../adapters/repositories/InMemoryCartRepository.js'
import { createInMemoryProductRepository } from '../adapters/repositories/InMemoryProductRepository.js'
import { createCartController } from '../adapters/controllers/CartController.js'
import { createProductController } from '../adapters/controllers/ProductController.js'
import { createHealthController } from '../adapters/controllers/HealthController.js'
import { createAddItemToCart } from '../usecases/AddItemToCart.js'
import { createGetCart } from '../usecases/GetCart.js'
import { createRemoveItemFromCart } from '../usecases/RemoveItemFromCart.js'
import { createCheckoutCart } from '../usecases/CheckoutCart.js'
import { createUpdateItemQuantity } from '../usecases/UpdateItemQuantity.js'
import { createApiRouter } from './routes.js'
import { Router } from 'express'

export type Container = {
  apiRouter: Router
  cleanup: () => void
}

/**
 * Creates the dependency injection container
 */
export const createContainer = (): Container => {
  // Create repositories
  const cartRepository = createInMemoryCartRepository()
  const productRepository = createInMemoryProductRepository(true)

  // Create use cases
  const addItemToCart = createAddItemToCart(cartRepository, productRepository)
  const getCart = createGetCart(cartRepository)
  const removeItemFromCart = createRemoveItemFromCart(cartRepository)
  const checkoutCart = createCheckoutCart(cartRepository)
  const updateItemQuantity = createUpdateItemQuantity(cartRepository)

  // Create controllers
  const cartController = createCartController({
    addItemToCart,
    getCart,
    removeItemFromCart,
    checkoutCart,
    updateItemQuantity,
  })

  const productController = createProductController({
    productRepository,
  })

  const healthController = createHealthController()

  // Create router
  const apiRouter = createApiRouter({
    cartController,
    productController,
    healthController,
  })

  // Cleanup function
  const cleanup = (): void => {
    cartRepository.clear()
    productRepository.clear()
  }

  return {
    apiRouter,
    cleanup,
  }
}
