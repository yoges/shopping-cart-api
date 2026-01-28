import { describe, it, expect } from 'vitest'

import {
  createProductId,
  productIdEquals,
  productIdToString,
} from './ProductId.js'

describe('ProductId Value Object', () => {
  describe('createProductId', () => {
    it('should create productId with valid value', () => {
      const productId = createProductId('prod-123')
      expect(productId.value).toBe('prod-123')
    })

    it('should trim whitespace', () => {
      const productId = createProductId('  prod-123  ')
      expect(productId.value).toBe('prod-123')
    })

    it('should accept alphanumeric with hyphens', () => {
      const productId = createProductId('abc-123-XYZ')
      expect(productId.value).toBe('abc-123-XYZ')
    })

    it('should accept underscores', () => {
      const productId = createProductId('prod_123')
      expect(productId.value).toBe('prod_123')
    })

    it('should throw for empty string', () => {
      expect(() => createProductId('')).toThrow('cannot be empty')
    })

    it('should throw for whitespace only', () => {
      expect(() => createProductId('   ')).toThrow('cannot be empty')
    })

    it('should throw for invalid characters', () => {
      expect(() => createProductId('prod@123')).toThrow('alphanumeric')
    })

    it('should throw for too long id', () => {
      const longId = 'a'.repeat(51)
      expect(() => createProductId(longId)).toThrow('1-50')
    })

    it('should be immutable', () => {
      const productId = createProductId('prod-123')
      expect(Object.isFrozen(productId)).toBe(true)
    })
  })

  describe('productIdEquals', () => {
    it('should return true for equal ids', () => {
      const a = createProductId('prod-123')
      const b = createProductId('prod-123')
      expect(productIdEquals(a, b)).toBe(true)
    })

    it('should return false for different ids', () => {
      const a = createProductId('prod-123')
      const b = createProductId('prod-456')
      expect(productIdEquals(a, b)).toBe(false)
    })
  })

  describe('productIdToString', () => {
    it('should return the value', () => {
      const productId = createProductId('prod-123')
      expect(productIdToString(productId)).toBe('prod-123')
    })
  })
})
