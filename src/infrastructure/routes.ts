/**
 * API Routes
 *
 * Defines all API routes and connects them to controllers.
 */

import { Router } from 'express'

import { CartController } from '../adapters/controllers/CartController.js'
import { ProductController } from '../adapters/controllers/ProductController.js'
import { HealthController } from '../adapters/controllers/HealthController.js'

export type RoutesDependencies = {
  cartController: CartController
  productController: ProductController
  healthController: HealthController
}

/**
 * Creates the API router with all routes
 */
export const createApiRouter = (deps: RoutesDependencies): Router => {
  const { cartController, productController, healthController } = deps

  const router = Router()

  // Health routes
  router.get('/health', healthController.health)
  router.get('/health/ready', healthController.ready)
  router.get('/health/live', healthController.live)

  // Product routes
  router.get('/api/products', productController.getProducts)
  router.get('/api/products/:productId', productController.getProduct)

  // Cart routes
  router.post('/api/cart/:sessionId/items', cartController.addItem)
  router.get('/api/cart/:sessionId', cartController.getCart)
  router.delete('/api/cart/:sessionId/items/:itemId', cartController.removeItem)
  router.patch('/api/cart/:sessionId/items/:itemId', cartController.updateQuantity)
  router.post('/api/cart/:sessionId/checkout', cartController.checkout)

  return router
}
