import { describe, it, expect, beforeEach } from 'vitest'

import {
  createCart,
  addItemToCart,
  removeItemFromCart,
  updateItemQuantity,
  calculateCartTotal,
  getTotalItemCount,
  isCartEmpty,
  canCheckout,
  checkout,
  clearCart,
  findItemByProductId,
  findItemById,
  getMaxUniqueItems,
} from './Cart.js'

describe('Cart Entity', () => {
  describe('createCart', () => {
    it('should create an empty cart', () => {
      const cart = createCart('session-123')
      expect(cart.sessionId.value).toBe('session-123')
      expect(cart.items).toHaveLength(0)
      expect(cart.status).toBe('active')
      expect(cart.currency).toBe('USD')
    })

    it('should allow custom currency', () => {
      const cart = createCart('session-123', 'EUR')
      expect(cart.currency).toBe('EUR')
    })
  })

  describe('addItemToCart', () => {
    it('should add a new item to cart', () => {
      const cart = createCart('session-123')
      const updatedCart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Test Product',
        unitPriceInCents: 1000,
        quantity: 2,
      })

      expect(updatedCart.items).toHaveLength(1)
      expect(updatedCart.items[0]?.productId.value).toBe('prod-001')
      expect(updatedCart.items[0]?.quantity.value).toBe(2)
    })

    it('should merge quantities for same product', () => {
      let cart = createCart('session-123')
      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Test Product',
        unitPriceInCents: 1000,
        quantity: 2,
      })
      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Test Product',
        unitPriceInCents: 1000,
        quantity: 3,
      })

      expect(cart.items).toHaveLength(1)
      expect(cart.items[0]?.quantity.value).toBe(5)
    })

    it('should add different products as separate items', () => {
      let cart = createCart('session-123')
      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Product 1',
        unitPriceInCents: 1000,
        quantity: 1,
      })
      cart = addItemToCart(cart, {
        productId: 'prod-002',
        productName: 'Product 2',
        unitPriceInCents: 2000,
        quantity: 1,
      })

      expect(cart.items).toHaveLength(2)
    })

    it('should throw when cart is checked out', () => {
      let cart = createCart('session-123')
      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
      })
      const checkedOutCart = checkout(cart)

      expect(() =>
        addItemToCart(checkedOutCart, {
          productId: 'prod-002',
          productName: 'Test',
          unitPriceInCents: 1000,
          quantity: 1,
        })
      ).toThrow('checked out')
    })

    it('should throw when max items exceeded', () => {
      let cart = createCart('session-123')
      const maxItems = getMaxUniqueItems()

      // Add max items
      for (let i = 0; i < maxItems; i++) {
        cart = addItemToCart(cart, {
          productId: `prod-${i}`,
          productName: `Product ${i}`,
          unitPriceInCents: 1000,
          quantity: 1,
        })
      }

      // Try to add one more
      expect(() =>
        addItemToCart(cart, {
          productId: `prod-${maxItems}`,
          productName: 'Extra Product',
          unitPriceInCents: 1000,
          quantity: 1,
        })
      ).toThrow(`more than ${maxItems}`)
    })
  })

  describe('removeItemFromCart', () => {
    it('should remove item from cart', () => {
      let cart = createCart('session-123')
      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
      })

      const itemId = cart.items[0]?.itemId ?? ''
      const updatedCart = removeItemFromCart(cart, itemId)

      expect(updatedCart.items).toHaveLength(0)
    })

    it('should throw for non-existent item', () => {
      const cart = createCart('session-123')
      expect(() => removeItemFromCart(cart, 'non-existent')).toThrow('not found')
    })

    it('should throw when cart is checked out', () => {
      let cart = createCart('session-123')
      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
      })
      const itemId = cart.items[0]?.itemId ?? ''
      const checkedOutCart = checkout(cart)

      expect(() => removeItemFromCart(checkedOutCart, itemId)).toThrow('checked out')
    })
  })

  describe('updateItemQuantity', () => {
    it('should update item quantity', () => {
      let cart = createCart('session-123')
      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
      })

      const itemId = cart.items[0]?.itemId ?? ''
      const updatedCart = updateItemQuantity(cart, itemId, 5)

      expect(updatedCart.items[0]?.quantity.value).toBe(5)
    })

    it('should throw for non-existent item', () => {
      const cart = createCart('session-123')
      expect(() => updateItemQuantity(cart, 'non-existent', 5)).toThrow('not found')
    })
  })

  describe('calculateCartTotal', () => {
    it('should calculate total for empty cart', () => {
      const cart = createCart('session-123')
      const total = calculateCartTotal(cart)
      expect(total.amount).toBe(0)
    })

    it('should calculate total for items', () => {
      let cart = createCart('session-123')
      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Product 1',
        unitPriceInCents: 1000, // $10.00
        quantity: 2,
      })
      cart = addItemToCart(cart, {
        productId: 'prod-002',
        productName: 'Product 2',
        unitPriceInCents: 500, // $5.00
        quantity: 3,
      })

      const total = calculateCartTotal(cart)
      // (1000 * 2) + (500 * 3) = 2000 + 1500 = 3500
      expect(total.amount).toBe(3500)
    })
  })

  describe('getTotalItemCount', () => {
    it('should return 0 for empty cart', () => {
      const cart = createCart('session-123')
      expect(getTotalItemCount(cart)).toBe(0)
    })

    it('should sum all quantities', () => {
      let cart = createCart('session-123')
      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Product 1',
        unitPriceInCents: 1000,
        quantity: 2,
      })
      cart = addItemToCart(cart, {
        productId: 'prod-002',
        productName: 'Product 2',
        unitPriceInCents: 500,
        quantity: 3,
      })

      expect(getTotalItemCount(cart)).toBe(5)
    })
  })

  describe('isCartEmpty', () => {
    it('should return true for empty cart', () => {
      const cart = createCart('session-123')
      expect(isCartEmpty(cart)).toBe(true)
    })

    it('should return false for cart with items', () => {
      let cart = createCart('session-123')
      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
      })
      expect(isCartEmpty(cart)).toBe(false)
    })
  })

  describe('canCheckout', () => {
    it('should return false for empty cart', () => {
      const cart = createCart('session-123')
      expect(canCheckout(cart)).toBe(false)
    })

    it('should return true for cart with items', () => {
      let cart = createCart('session-123')
      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
      })
      expect(canCheckout(cart)).toBe(true)
    })

    it('should return false for checked out cart', () => {
      let cart = createCart('session-123')
      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
      })
      const checkedOutCart = checkout(cart)
      expect(canCheckout(checkedOutCart)).toBe(false)
    })
  })

  describe('checkout', () => {
    it('should mark cart as checked out', () => {
      let cart = createCart('session-123')
      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
      })

      const checkedOutCart = checkout(cart)
      expect(checkedOutCart.status).toBe('checked_out')
    })

    it('should throw for empty cart', () => {
      const cart = createCart('session-123')
      expect(() => checkout(cart)).toThrow('empty cart')
    })

    it('should throw for already checked out cart', () => {
      let cart = createCart('session-123')
      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
      })
      const checkedOutCart = checkout(cart)
      expect(() => checkout(checkedOutCart)).toThrow('already been checked out')
    })
  })

  describe('clearCart', () => {
    it('should remove all items', () => {
      let cart = createCart('session-123')
      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
      })

      const clearedCart = clearCart(cart)
      expect(clearedCart.items).toHaveLength(0)
    })
  })

  describe('findItemByProductId', () => {
    it('should find item by product id', () => {
      let cart = createCart('session-123')
      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
      })

      const item = findItemByProductId(cart, 'prod-001')
      expect(item).toBeDefined()
      expect(item?.productId.value).toBe('prod-001')
    })

    it('should return undefined for non-existent product', () => {
      const cart = createCart('session-123')
      const item = findItemByProductId(cart, 'non-existent')
      expect(item).toBeUndefined()
    })
  })

  describe('findItemById', () => {
    it('should find item by id', () => {
      let cart = createCart('session-123')
      cart = addItemToCart(cart, {
        productId: 'prod-001',
        productName: 'Test',
        unitPriceInCents: 1000,
        quantity: 1,
      })

      const itemId = cart.items[0]?.itemId ?? ''
      const item = findItemById(cart, itemId)
      expect(item).toBeDefined()
    })

    it('should return undefined for non-existent id', () => {
      const cart = createCart('session-123')
      const item = findItemById(cart, 'non-existent')
      expect(item).toBeUndefined()
    })
  })
})
