import { describe, it, expect } from 'vitest'

import {
  createMoney,
  createMoneyFromDollars,
  addMoney,
  subtractMoney,
  multiplyMoney,
  moneyEquals,
  formatMoney,
  zeroMoney,
  toDollars,
} from './Money.js'

describe('Money Value Object', () => {
  describe('createMoney', () => {
    it('should create money with valid cents', () => {
      const money = createMoney(1000, 'USD')
      expect(money.amount).toBe(1000)
      expect(money.currency).toBe('USD')
    })

    it('should default to USD currency', () => {
      const money = createMoney(500)
      expect(money.currency).toBe('USD')
    })

    it('should throw for non-integer amounts', () => {
      expect(() => createMoney(10.5, 'USD')).toThrow(
        'Money amount must be an integer (cents)'
      )
    })

    it('should throw for negative amounts', () => {
      expect(() => createMoney(-100, 'USD')).toThrow(
        'Money amount cannot be negative'
      )
    })

    it('should allow zero amount', () => {
      const money = createMoney(0, 'USD')
      expect(money.amount).toBe(0)
    })

    it('should be immutable', () => {
      const money = createMoney(1000, 'USD')
      expect(Object.isFrozen(money)).toBe(true)
    })
  })

  describe('createMoneyFromDollars', () => {
    it('should convert dollars to cents', () => {
      const money = createMoneyFromDollars(10.99, 'USD')
      expect(money.amount).toBe(1099)
    })

    it('should round to nearest cent', () => {
      const money = createMoneyFromDollars(10.995, 'USD')
      expect(money.amount).toBe(1100)
    })
  })

  describe('addMoney', () => {
    it('should add two money values', () => {
      const a = createMoney(1000, 'USD')
      const b = createMoney(500, 'USD')
      const result = addMoney(a, b)
      expect(result.amount).toBe(1500)
    })

    it('should throw for currency mismatch', () => {
      const a = createMoney(1000, 'USD')
      const b = createMoney(500, 'EUR')
      expect(() => addMoney(a, b)).toThrow('Currency mismatch')
    })
  })

  describe('subtractMoney', () => {
    it('should subtract two money values', () => {
      const a = createMoney(1000, 'USD')
      const b = createMoney(400, 'USD')
      const result = subtractMoney(a, b)
      expect(result.amount).toBe(600)
    })

    it('should throw for negative result', () => {
      const a = createMoney(400, 'USD')
      const b = createMoney(1000, 'USD')
      expect(() => subtractMoney(a, b)).toThrow('negative')
    })

    it('should throw for currency mismatch', () => {
      const a = createMoney(1000, 'USD')
      const b = createMoney(500, 'EUR')
      expect(() => subtractMoney(a, b)).toThrow('Currency mismatch')
    })
  })

  describe('multiplyMoney', () => {
    it('should multiply money by quantity', () => {
      const money = createMoney(1000, 'USD')
      const result = multiplyMoney(money, 3)
      expect(result.amount).toBe(3000)
    })

    it('should throw for negative quantity', () => {
      const money = createMoney(1000, 'USD')
      expect(() => multiplyMoney(money, -1)).toThrow('negative')
    })

    it('should throw for non-integer quantity', () => {
      const money = createMoney(1000, 'USD')
      expect(() => multiplyMoney(money, 1.5)).toThrow('integer')
    })
  })

  describe('moneyEquals', () => {
    it('should return true for equal values', () => {
      const a = createMoney(1000, 'USD')
      const b = createMoney(1000, 'USD')
      expect(moneyEquals(a, b)).toBe(true)
    })

    it('should return false for different amounts', () => {
      const a = createMoney(1000, 'USD')
      const b = createMoney(500, 'USD')
      expect(moneyEquals(a, b)).toBe(false)
    })

    it('should return false for different currencies', () => {
      const a = createMoney(1000, 'USD')
      const b = createMoney(1000, 'EUR')
      expect(moneyEquals(a, b)).toBe(false)
    })
  })

  describe('formatMoney', () => {
    it('should format USD correctly', () => {
      const money = createMoney(1099, 'USD')
      expect(formatMoney(money)).toBe('$10.99')
    })
  })

  describe('zeroMoney', () => {
    it('should create zero money', () => {
      const money = zeroMoney('USD')
      expect(money.amount).toBe(0)
      expect(money.currency).toBe('USD')
    })
  })

  describe('toDollars', () => {
    it('should convert cents to dollars', () => {
      const money = createMoney(1099, 'USD')
      expect(toDollars(money)).toBe(10.99)
    })
  })
})
