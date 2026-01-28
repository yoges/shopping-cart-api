/**
 * Product Controller
 *
 * Handles HTTP requests for product operations.
 * For demo purposes - shows available products.
 */

import { Request, Response } from 'express'

import { ProductRepository } from '../../domain/repositories/ProductRepository.js'
import { presentProduct, presentProducts } from '../presenters/ProductPresenter.js'
import { presentError } from '../presenters/ErrorPresenter.js'

export type ProductControllerDependencies = {
  productRepository: ProductRepository
}

export type ProductController = {
  getProducts: (req: Request, res: Response) => Promise<void>
  getProduct: (req: Request, res: Response) => Promise<void>
}

/**
 * Factory function to create ProductController
 */
export const createProductController = (
  deps: ProductControllerDependencies
): ProductController => {
  const { productRepository } = deps

  return {
    /**
     * GET /api/products
     * Get all products
     */
    async getProducts(_req: Request, res: Response): Promise<void> {
      try {
        const products = await productRepository.findAll()
        res.status(200).json(presentProducts(products))
      } catch (error) {
        const { status, body } = presentError(error)
        res.status(status).json(body)
      }
    },

    /**
     * GET /api/products/:productId
     * Get a single product
     */
    async getProduct(req: Request, res: Response): Promise<void> {
      try {
        const { productId } = req.params

        if (!productId) {
          res.status(400).json({
            error: { code: 'VALIDATION_ERROR', message: 'Product ID is required' },
          })
          return
        }

        const product = await productRepository.findById(productId)

        if (!product) {
          res.status(404).json({
            error: { code: 'PRODUCT_NOT_FOUND', message: `Product not found: ${productId}` },
          })
          return
        }

        res.status(200).json(presentProduct(product))
      } catch (error) {
        const { status, body } = presentError(error)
        res.status(status).json(body)
      }
    },
  }
}
