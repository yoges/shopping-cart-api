import { describe, it, expect, beforeEach } from 'vitest'

import { createGetCart } from './GetCart.js'
import { createAddItemToCart } from './AddItemToCart.js'
import { createInMemoryCartRepository } from '../adapters/repositories/InMemoryCartRepository.js'
import { createInMemoryProductRepository } from '../adapters/repositories/InMemoryProductRepository.js'
import { createProduct } from '../domain/entities/Product.js'

describe('GetCart Use Case', () => {
  let cartRepository: ReturnType<typeof createInMemoryCartRepository>
  let productRepository: ReturnType<typeof createInMemoryProductRepository>
  let getCart: ReturnType<typeof createGetCart>
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

    getCart = createGetCart(cartRepository)
    addItemToCart = createAddItemToCart(cartRepository, productRepository)
  })

  it('should return null for non-existent cart', async () => {
    const cart = await getCart.execute({ sessionId: 'non-existent' })
    expect(cart).toBeNull()
  })

  it('should return existing cart', async () => {
    await addItemToCart.execute({
      sessionId: 'session-123',
      productId: 'prod-001',
      quantity: 2,
    })

    const cart = await getCart.execute({ sessionId: 'session-123' })

    expect(cart).not.toBeNull()
    expect(cart?.sessionId.value).toBe('session-123')
    expect(cart?.items).toHaveLength(1)
  })

  it('should return cart with correct items', async () => {
    await addItemToCart.execute({
      sessionId: 'session-123',
      productId: 'prod-001',
      quantity: 3,
    })

    const cart = await getCart.execute({ sessionId: 'session-123' })

    expect(cart?.items[0]?.productId.value).toBe('prod-001')
    expect(cart?.items[0]?.quantity.value).toBe(3)
  })
})
