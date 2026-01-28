/**
 * Product Entity
 *
 * Represents a product that can be added to a cart.
 * This is a reference entity - the actual product catalog
 * would be managed by a separate service/domain.
 */

import { Money, createMoney, Currency } from '../value-objects/Money.js'
import { ProductId, createProductId } from '../value-objects/ProductId.js'

export type Product = {
  readonly id: ProductId
  readonly name: string
  readonly description: string
  readonly price: Money
  readonly sku: string
  readonly inStock: boolean
}

export type CreateProductInput = {
  id: string
  name: string
  description?: string
  priceInCents: number
  currency?: Currency
  sku: string
  inStock?: boolean
}

/**
 * Creates a Product entity
 */
export const createProduct = (input: CreateProductInput): Product => {
  const { id, name, description, priceInCents, currency, sku, inStock } = input

  if (!name || name.trim() === '') {
    throw new Error('Product name cannot be empty')
  }

  if (name.length > 200) {
    throw new Error('Product name cannot exceed 200 characters')
  }

  if (!sku || sku.trim() === '') {
    throw new Error('Product SKU cannot be empty')
  }

  return Object.freeze({
    id: createProductId(id),
    name: name.trim(),
    description: description?.trim() ?? '',
    price: createMoney(priceInCents, currency ?? 'USD'),
    sku: sku.trim(),
    inStock: inStock ?? true,
  })
}

/**
 * Checks if a product can be added to cart
 */
export const canAddToCart = (product: Product): boolean => {
  return product.inStock
}
