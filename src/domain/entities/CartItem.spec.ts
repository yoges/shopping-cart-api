import { describe, it, expect } from 'vitest'

import {
  createCartItem,
  updateCartItemQuantity,
  increaseCartItemQuantity,
  calculateLineTotal,
  isSameProduct,
} from './CartItem.js'
import { createQuantity } from '../value-objects/Quantity.js'

describe('CartItem Entity', () => {
  describe('createCartItem', () => {
    it('should create a cart item with valid inputs', () => {
      const item = createCartItem({
        productId: 'prod-001',
        productName: 'Test Product',
        unitPriceInCents: 1000,
        quantity: 2,
      })

      expect(item.productId.value).toBe('prod-001')
      expect(item.productName).toBe('Test Product')
      expect(item.unitPrice.amount).toBe(1000)
      expect(item.quantity.value).toBe(2)
      expect(item.itemId).toBeDefined()
      expect(item.addedAt).toBeInstanceOf(Date)
    })

    it('should generate unique itemId', () => {
      const item1 = createCartItem({
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
      })
      const item2 = createCartItem({
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
      })

      expect(item1.itemId).not.toBe(item2.itemId)
    })

    it('should allow custom itemId', () => {
      const item = createCartItem({
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
        itemId: 'custom-id',
      })

      expect(item.itemId).toBe('custom-id')
    })

    it('should throw for empty product name', () => {
      expect(() =>
        createCartItem({
          productId: 'prod-001',
          productName: '',
          unitPriceInCents: 1000,
          quantity: 1,
        })
      ).toThrow('cannot be empty')
    })

    it('should be immutable', () => {
      const item = createCartItem({
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
      })
      expect(Object.isFrozen(item)).toBe(true)
    })
  })

  describe('updateCartItemQuantity', () => {
    it('should update quantity', () => {
      const item = createCartItem({
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
      })

      const newQuantity = createQuantity(5)
      const updatedItem = updateCartItemQuantity(item, newQuantity)

      expect(updatedItem.quantity.value).toBe(5)
      expect(updatedItem.itemId).toBe(item.itemId)
      expect(updatedItem.productId.value).toBe(item.productId.value)
    })
  })

  describe('increaseCartItemQuantity', () => {
    it('should increase quantity', () => {
      const item = createCartItem({
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 2,
      })

      const additionalQuantity = createQuantity(3)
      const updatedItem = increaseCartItemQuantity(item, additionalQuantity)

      expect(updatedItem.quantity.value).toBe(5)
    })
  })

  describe('calculateLineTotal', () => {
    it('should calculate correct line total', () => {
      const item = createCartItem({
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000, // $10.00
        quantity: 3,
      })

      const total = calculateLineTotal(item)
      expect(total.amount).toBe(3000) // $30.00
    })
  })

  describe('isSameProduct', () => {
    it('should return true for same product', () => {
      const item1 = createCartItem({
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
      })
      const item2 = createCartItem({
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 2,
      })

      expect(isSameProduct(item1, item2)).toBe(true)
    })

    it('should return false for different products', () => {
      const item1 = createCartItem({
        productId: 'prod-001',
        productName: 'Test 1',
        unitPriceInCents: 1000,
        quantity: 1,
      })
      const item2 = createCartItem({
        productId: 'prod-002',
        productName: 'Test 2',
        unitPriceInCents: 2000,
        quantity: 1,
      })

      expect(isSameProduct(item1, item2)).toBe(false)
    })
  })
})
