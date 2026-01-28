import { describe, it, expect, beforeEach } from 'vitest'

import { createInMemoryCartRepository } from './InMemoryCartRepository.js'
import { createCart, addItemToCart } from '../../domain/entities/Cart.js'

describe('InMemoryCartRepository', () => {
  let repository: ReturnType<typeof createInMemoryCartRepository>

  beforeEach(() => {
    repository = createInMemoryCartRepository()
  })

  describe('save and findBySessionId', () => {
    it('should save and retrieve a cart', async () => {
      const cart = createCart('session-123')
      await repository.save(cart)

      const retrieved = await repository.findBySessionId('session-123')

      expect(retrieved).not.toBeNull()
      expect(retrieved?.sessionId.value).toBe('session-123')
    })

    it('should return null for non-existent session', async () => {
      const retrieved = await repository.findBySessionId('non-existent')
      expect(retrieved).toBeNull()
    })

    it('should save cart with items', async () => {
      let cart = createCart('session-123')
      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Test Product',
        unitPriceInCents: 1000,
        quantity: 2,
      })

      await repository.save(cart)
      const retrieved = await repository.findBySessionId('session-123')

      expect(retrieved?.items).toHaveLength(1)
      expect(retrieved?.items[0]?.productId.value).toBe('prod-001')
      expect(retrieved?.items[0]?.quantity.value).toBe(2)
    })

    it('should update existing cart', async () => {
      let cart = createCart('session-123')
      await repository.save(cart)

      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
      })
      await repository.save(cart)

      const retrieved = await repository.findBySessionId('session-123')
      expect(retrieved?.items).toHaveLength(1)
    })
  })

  describe('delete', () => {
    it('should delete existing cart', async () => {
      const cart = createCart('session-123')
      await repository.save(cart)

      const deleted = await repository.delete('session-123')

      expect(deleted).toBe(true)
      expect(await repository.findBySessionId('session-123')).toBeNull()
    })

    it('should return false for non-existent cart', async () => {
      const deleted = await repository.delete('non-existent')
      expect(deleted).toBe(false)
    })
  })

  describe('exists', () => {
    it('should return true for existing cart', async () => {
      const cart = createCart('session-123')
      await repository.save(cart)

      expect(await repository.exists('session-123')).toBe(true)
    })

    it('should return false for non-existent cart', async () => {
      expect(await repository.exists('non-existent')).toBe(false)
    })
  })

  describe('clear', () => {
    it('should remove all carts', async () => {
      await repository.save(createCart('session-1'))
      await repository.save(createCart('session-2'))

      repository.clear()

      expect(repository.size()).toBe(0)
    })
  })

  describe('size', () => {
    it('should return number of carts', async () => {
      await repository.save(createCart('session-1'))
      await repository.save(createCart('session-2'))

      expect(repository.size()).toBe(2)
    })
  })
})
