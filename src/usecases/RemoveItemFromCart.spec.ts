import { describe, it, expect, beforeEach } from 'vitest'

import { createRemoveItemFromCart } from './RemoveItemFromCart.js'
import { createAddItemToCart } from './AddItemToCart.js'
import { createInMemoryCartRepository } from '../adapters/repositories/InMemoryCartRepository.js'
import { createInMemoryProductRepository } from '../adapters/repositories/InMemoryProductRepository.js'
import { createProduct } from '../domain/entities/Product.js'

describe('RemoveItemFromCart Use Case', () => {
  let cartRepository: ReturnType<typeof createInMemoryCartRepository>
  let productRepository: ReturnType<typeof createInMemoryProductRepository>
  let removeItemFromCart: ReturnType<typeof createRemoveItemFromCart>
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

    removeItemFromCart = createRemoveItemFromCart(cartRepository)
    addItemToCart = createAddItemToCart(cartRepository, productRepository)
  })

  it('should remove item from cart', async () => {
    const cart = await addItemToCart.execute({
      sessionId: 'session-123',
      productId: 'prod-001',
      quantity: 2,
    })

    const itemId = cart.items[0]?.itemId ?? ''
    const updatedCart = await removeItemFromCart.execute({
      sessionId: 'session-123',
      itemId,
    })

    expect(updatedCart.items).toHaveLength(0)
  })

  it('should persist changes to repository', async () => {
    const cart = await addItemToCart.execute({
      sessionId: 'session-123',
      productId: 'prod-001',
      quantity: 1,
    })

    const itemId = cart.items[0]?.itemId ?? ''
    await removeItemFromCart.execute({
      sessionId: 'session-123',
      itemId,
    })

    const savedCart = await cartRepository.findBySessionId('session-123')
    expect(savedCart?.items).toHaveLength(0)
  })

  it('should throw for non-existent cart', async () => {
    await expect(
      removeItemFromCart.execute({
        sessionId: 'non-existent',
        itemId: 'some-item',
      })
    ).rejects.toThrow('not found')
  })

  it('should throw for non-existent item', async () => {
    await addItemToCart.execute({
      sessionId: 'session-123',
      productId: 'prod-001',
      quantity: 1,
    })

    await expect(
      removeItemFromCart.execute({
        sessionId: 'session-123',
        itemId: 'non-existent-item',
      })
    ).rejects.toThrow('not found')
  })
})
