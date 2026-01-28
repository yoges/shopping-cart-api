import { describe, it, expect } from 'vitest'

import {
  createQuantity,
  addQuantity,
  quantityEquals,
  getMaxQuantity,
  getMinQuantity,
} from './Quantity.js'

describe('Quantity Value Object', () => {
  describe('createQuantity', () => {
    it('should create quantity with valid value', () => {
      const quantity = createQuantity(5)
      expect(quantity.value).toBe(5)
    })

    it('should accept minimum quantity', () => {
      const quantity = createQuantity(1)
      expect(quantity.value).toBe(1)
    })

    it('should accept maximum quantity', () => {
      const quantity = createQuantity(99)
      expect(quantity.value).toBe(99)
    })

    it('should throw for zero quantity', () => {
      expect(() => createQuantity(0)).toThrow('at least 1')
    })

    it('should throw for negative quantity', () => {
      expect(() => createQuantity(-1)).toThrow('at least 1')
    })

    it('should throw for quantity exceeding max', () => {
      expect(() => createQuantity(100)).toThrow('cannot exceed 99')
    })

    it('should throw for non-integer quantity', () => {
      expect(() => createQuantity(1.5)).toThrow('must be an integer')
    })

    it('should be immutable', () => {
      const quantity = createQuantity(5)
      expect(Object.isFrozen(quantity)).toBe(true)
    })
  })

  describe('addQuantity', () => {
    it('should add two quantities', () => {
      const a = createQuantity(3)
      const b = createQuantity(2)
      const result = addQuantity(a, b)
      expect(result.value).toBe(5)
    })

    it('should throw when sum exceeds max', () => {
      const a = createQuantity(50)
      const b = createQuantity(50)
      expect(() => addQuantity(a, b)).toThrow('cannot exceed 99')
    })
  })

  describe('quantityEquals', () => {
    it('should return true for equal quantities', () => {
      const a = createQuantity(5)
      const b = createQuantity(5)
      expect(quantityEquals(a, b)).toBe(true)
    })

    it('should return false for different quantities', () => {
      const a = createQuantity(5)
      const b = createQuantity(3)
      expect(quantityEquals(a, b)).toBe(false)
    })
  })

  describe('getMaxQuantity', () => {
    it('should return 99', () => {
      expect(getMaxQuantity()).toBe(99)
    })
  })

  describe('getMinQuantity', () => {
    it('should return 1', () => {
      expect(getMinQuantity()).toBe(1)
    })
  })
})
