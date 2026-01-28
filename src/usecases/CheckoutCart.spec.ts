import { describe, it, expect, beforeEach } from 'vitest'

import { createCheckoutCart } from './CheckoutCart.js'
import { createAddItemToCart } from './AddItemToCart.js'
import { createInMemoryCartRepository } from '../adapters/repositories/InMemoryCartRepository.js'
import { createInMemoryProductRepository } from '../adapters/repositories/InMemoryProductRepository.js'
import { createProduct } from '../domain/entities/Product.js'

describe('CheckoutCart Use Case', () => {
  let cartRepository: ReturnType<typeof createInMemoryCartRepository>
  let productRepository: ReturnType<typeof createInMemoryProductRepository>
  let checkoutCart: ReturnType<typeof createCheckoutCart>
  let addItemToCart: ReturnType<typeof createAddItemToCart>

  beforeEach(() => {
    cartRepository = createInMemoryCartRepository()
    productRepository = createInMemoryProductRepository(false)

    productRepository.addProduct(
      createProduct({
        id: 'prod-001',
        name: 'Test Product',
        priceInCents: 1000,
        sku: 'TEST-001',
        inStock: true,
      })
    )
    productRepository.addProduct(
      createProduct({
        id: 'prod-002',
        name: 'Another Product',
        priceInCents: 500,
        sku: 'TEST-002',
        inStock: true,
      })
    )

    checkoutCart = createCheckoutCart(cartRepository)
    addItemToCart = createAddItemToCart(cartRepository, productRepository)
  })

  it('should checkout cart and return result', async () => {
    await addItemToCart.execute({
      sessionId: 'session-123',
      productId: 'prod-001',
      quantity: 2,
    })

    const result = await checkoutCart.execute({ sessionId: 'session-123' })

    expect(result.orderId).toBeDefined()
    expect(result.sessionId).toBe('session-123')
    expect(result.items).toHaveLength(1)
    expect(result.subtotal.amount).toBe(2000) // 1000 * 2
    expect(result.total.amount).toBe(2000)
  })

  it('should calculate tax correctly', async () => {
    await addItemToCart.execute({
      sessionId: 'session-123',
      productId: 'prod-001',
      quantity: 1,
    })

    const result = await checkoutCart.execute({
      sessionId: 'session-123',
      taxRate: 0.1, // 10% tax
    })

    expect(result.subtotal.amount).toBe(1000)
    expect(result.tax.amount).toBe(100)
    expect(result.total.amount).toBe(1100)
  })

  it('should mark cart as checked out', async () => {
    await addItemToCart.execute({
      sessionId: 'session-123',
      productId: 'prod-001',
      quantity: 1,
    })

    await checkoutCart.execute({ sessionId: 'session-123' })

    const cart = await cartRepository.findBySessionId('session-123')
    expect(cart?.status).toBe('checked_out')
  })

  it('should throw for non-existent cart', async () => {
    await expect(
      checkoutCart.execute({ sessionId: 'non-existent' })
    ).rejects.toThrow('not found')
  })

  it('should throw for empty cart', async () => {
    // Create an empty cart by adding and removing
    await addItemToCart.execute({
      sessionId: 'session-123',
      productId: 'prod-001',
      quantity: 1,
    })

    const cart = await cartRepository.findBySessionId('session-123')
    if (cart) {
      const { clearCart } = await import('../domain/entities/Cart.js')
      const clearedCart = clearCart(cart)
      await cartRepository.save(clearedCart)
    }

    await expect(
      checkoutCart.execute({ sessionId: 'session-123' })
    ).rejects.toThrow('empty')
  })

  it('should throw for already checked out cart', async () => {
    await addItemToCart.execute({
      sessionId: 'session-123',
      productId: 'prod-001',
      quantity: 1,
    })

    await checkoutCart.execute({ sessionId: 'session-123' })

    await expect(
      checkoutCart.execute({ sessionId: 'session-123' })
    ).rejects.toThrow('already been checked out')
  })

  it('should include multiple items in result', async () => {
    await addItemToCart.execute({
      sessionId: 'session-123',
      productId: 'prod-001',
      quantity: 2,
    })
    await addItemToCart.execute({
      sessionId: 'session-123',
      productId: 'prod-002',
      quantity: 3,
    })

    const result = await checkoutCart.execute({ sessionId: 'session-123' })

    expect(result.items).toHaveLength(2)
    expect(result.itemCount).toBe(5)
    expect(result.subtotal.amount).toBe(3500) // (1000 * 2) + (500 * 3)
  })
})
