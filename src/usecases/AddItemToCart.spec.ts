import { describe, it, expect, beforeEach } from 'vitest'

import { createAddItemToCart } from './AddItemToCart.js'
import { createInMemoryCartRepository } from '../adapters/repositories/InMemoryCartRepository.js'
import { createInMemoryProductRepository } from '../adapters/repositories/InMemoryProductRepository.js'
import { createProduct } from '../domain/entities/Product.js'

describe('AddItemToCart Use Case', () => {
  let cartRepository: ReturnType<typeof createInMemoryCartRepository>
  let productRepository: ReturnType<typeof createInMemoryProductRepository>
  let addItemToCart: ReturnType<typeof createAddItemToCart>

  beforeEach(() => {
    cartRepository = createInMemoryCartRepository()
    productRepository = createInMemoryProductRepository(false)

    // Add test products
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
        name: 'Out of Stock Product',
        priceInCents: 2000,
        sku: 'TEST-002',
        inStock: false,
      })
    )

    addItemToCart = createAddItemToCart(cartRepository, productRepository)
  })

  it('should add item to new cart', async () => {
    const cart = await addItemToCart.execute({
      sessionId: 'session-123',
      productId: 'prod-001',
      quantity: 2,
    })

    expect(cart.sessionId.value).toBe('session-123')
    expect(cart.items).toHaveLength(1)
    expect(cart.items[0]?.productId.value).toBe('prod-001')
    expect(cart.items[0]?.quantity.value).toBe(2)
  })

  it('should add item to existing cart', async () => {
    // First add
    await addItemToCart.execute({
      sessionId: 'session-123',
      productId: 'prod-001',
      quantity: 1,
    })

    // Second add (different product would be needed, but we test same session)
    const cart = await addItemToCart.execute({
      sessionId: 'session-123',
      productId: 'prod-001',
      quantity: 2,
    })

    expect(cart.items).toHaveLength(1)
    expect(cart.items[0]?.quantity.value).toBe(3)
  })

  it('should persist cart to repository', async () => {
    await addItemToCart.execute({
      sessionId: 'session-123',
      productId: 'prod-001',
      quantity: 1,
    })

    const savedCart = await cartRepository.findBySessionId('session-123')
    expect(savedCart).not.toBeNull()
    expect(savedCart?.items).toHaveLength(1)
  })

  it('should throw for non-existent product', async () => {
    await expect(
      addItemToCart.execute({
        sessionId: 'session-123',
        productId: 'non-existent',
        quantity: 1,
      })
    ).rejects.toThrow('not found')
  })

  it('should throw for out of stock product', async () => {
    await expect(
      addItemToCart.execute({
        sessionId: 'session-123',
        productId: 'prod-002',
        quantity: 1,
      })
    ).rejects.toThrow('out of stock')
  })
})
