/**
 * Product Presenter
 *
 * Transforms product entities into API response formats.
 */

import { Product } from '../../domain/entities/Product.js'
import { toDollars } from '../../domain/value-objects/Money.js'

export type ProductResponse = {
  id: string
  name: string
  description: string
  price: number
  currency: string
  sku: string
  inStock: boolean
}

/**
 * Presents a product for API response
 */
export const presentProduct = (product: Product): ProductResponse => {
  return {
    id: product.id.value,
    name: product.name,
    description: product.description,
    price: toDollars(product.price),
    currency: product.price.currency,
    sku: product.sku,
    inStock: product.inStock,
  }
}

/**
 * Presents multiple products for API response
 */
export const presentProducts = (products: Product[]): ProductResponse[] => {
  return products.map(presentProduct)
}
