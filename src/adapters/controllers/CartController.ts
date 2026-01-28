/**
 * Cart Controller
 *
 * Handles HTTP requests for cart operations.
 * Validates input, invokes use cases, and formats responses.
 */

import { Request, Response } from 'express'
import { z } from 'zod'

import { AddItemToCart } from '../../usecases/AddItemToCart.js'
import { GetCart } from '../../usecases/GetCart.js'
import { RemoveItemFromCart } from '../../usecases/RemoveItemFromCart.js'
import { CheckoutCart } from '../../usecases/CheckoutCart.js'
import { UpdateItemQuantity } from '../../usecases/UpdateItemQuantity.js'
import { presentCart, presentEmptyCart } from '../presenters/CartPresenter.js'
import { presentCheckout } from '../presenters/CheckoutPresenter.js'
import { presentError } from '../presenters/ErrorPresenter.js'

// Request validation schemas
const addItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99, 'Quantity cannot exceed 99'),
})

const updateQuantitySchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99, 'Quantity cannot exceed 99'),
})

const checkoutSchema = z.object({
  taxRate: z.number().min(0).max(1).optional(),
})

export type CartControllerDependencies = {
  addItemToCart: AddItemToCart
  getCart: GetCart
  removeItemFromCart: RemoveItemFromCart
  checkoutCart: CheckoutCart
  updateItemQuantity: UpdateItemQuantity
}

export type CartController = {
  addItem: (req: Request, res: Response) => Promise<void>
  getCart: (req: Request, res: Response) => Promise<void>
  removeItem: (req: Request, res: Response) => Promise<void>
  checkout: (req: Request, res: Response) => Promise<void>
  updateQuantity: (req: Request, res: Response) => Promise<void>
}

/**
 * Factory function to create CartController
 */
export const createCartController = (
  deps: CartControllerDependencies
): CartController => {
  const { addItemToCart, getCart, removeItemFromCart, checkoutCart, updateItemQuantity } = deps

  return {
    /**
     * POST /api/cart/:sessionId/items
     * Add an item to the cart
     */
    async addItem(req: Request, res: Response): Promise<void> {
      try {
        const sessionId = req.params.sessionId

        if (!sessionId) {
          res.status(400).json({
            error: { code: 'VALIDATION_ERROR', message: 'Session ID is required' },
          })
          return
        }

        // Validate request body
        const parseResult = addItemSchema.safeParse(req.body)
        if (!parseResult.success) {
          const firstError = parseResult.error.errors[0]
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: firstError?.message ?? 'Invalid request',
              field: firstError?.path.join('.'),
            },
          })
          return
        }

        const { productId, quantity } = parseResult.data

        const cart = await addItemToCart.execute({
          sessionId,
          productId,
          quantity,
        })

        res.status(201).json(presentCart(cart))
      } catch (error) {
        const { status, body } = presentError(error)
        res.status(status).json(body)
      }
    },

    /**
     * GET /api/cart/:sessionId
     * Get cart contents
     */
    async getCart(req: Request, res: Response): Promise<void> {
      try {
        const sessionId = req.params.sessionId

        if (!sessionId) {
          res.status(400).json({
            error: { code: 'VALIDATION_ERROR', message: 'Session ID is required' },
          })
          return
        }

        const cart = await getCart.execute({ sessionId })

        if (!cart) {
          res.status(200).json(presentEmptyCart(sessionId))
          return
        }

        res.status(200).json(presentCart(cart))
      } catch (error) {
        const { status, body } = presentError(error)
        res.status(status).json(body)
      }
    },

    /**
     * DELETE /api/cart/:sessionId/items/:itemId
     * Remove an item from the cart
     */
    async removeItem(req: Request, res: Response): Promise<void> {
      try {
        const { sessionId, itemId } = req.params

        if (!sessionId) {
          res.status(400).json({
            error: { code: 'VALIDATION_ERROR', message: 'Session ID is required' },
          })
          return
        }

        if (!itemId) {
          res.status(400).json({
            error: { code: 'VALIDATION_ERROR', message: 'Item ID is required' },
          })
          return
        }

        const cart = await removeItemFromCart.execute({ sessionId, itemId })

        res.status(200).json(presentCart(cart))
      } catch (error) {
        const { status, body } = presentError(error)
        res.status(status).json(body)
      }
    },

    /**
     * POST /api/cart/:sessionId/checkout
     * Checkout the cart
     */
    async checkout(req: Request, res: Response): Promise<void> {
      try {
        const sessionId = req.params.sessionId

        if (!sessionId) {
          res.status(400).json({
            error: { code: 'VALIDATION_ERROR', message: 'Session ID is required' },
          })
          return
        }

        // Validate optional request body
        const parseResult = checkoutSchema.safeParse(req.body ?? {})
        if (!parseResult.success) {
          const firstError = parseResult.error.errors[0]
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: firstError?.message ?? 'Invalid request',
              field: firstError?.path.join('.'),
            },
          })
          return
        }

        const { taxRate } = parseResult.data

        const result = await checkoutCart.execute({ sessionId, taxRate })

        res.status(200).json(presentCheckout(result))
      } catch (error) {
        const { status, body } = presentError(error)
        res.status(status).json(body)
      }
    },

    /**
     * PATCH /api/cart/:sessionId/items/:itemId
     * Update item quantity
     */
    async updateQuantity(req: Request, res: Response): Promise<void> {
      try {
        const { sessionId, itemId } = req.params

        if (!sessionId) {
          res.status(400).json({
            error: { code: 'VALIDATION_ERROR', message: 'Session ID is required' },
          })
          return
        }

        if (!itemId) {
          res.status(400).json({
            error: { code: 'VALIDATION_ERROR', message: 'Item ID is required' },
          })
          return
        }

        // Validate request body
        const parseResult = updateQuantitySchema.safeParse(req.body)
        if (!parseResult.success) {
          const firstError = parseResult.error.errors[0]
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: firstError?.message ?? 'Invalid request',
              field: firstError?.path.join('.'),
            },
          })
          return
        }

        const { quantity } = parseResult.data

        const cart = await updateItemQuantity.execute({
          sessionId,
          itemId,
          quantity,
        })

        res.status(200).json(presentCart(cart))
      } catch (error) {
        const { status, body } = presentError(error)
        res.status(status).json(body)
      }
    },
  }
}
