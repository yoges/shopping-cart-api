/**
 * In-Memory Product Repository
 *
 * Implementation of ProductRepository using in-memory storage.
 * Pre-populated with sample products for demo purposes.
 */

import { Product, createProduct } from '../../domain/entities/Product.js'
import { ProductRepository } from '../../domain/repositories/ProductRepository.js'

export type InMemoryProductRepository = ProductRepository & {
  addProduct: (product: Product) => void
  clear: () => void
  size: () => number
}

// Sample products for demo
const SAMPLE_PRODUCTS = [
  {
    id: 'prod-001',
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    priceInCents: 9999,
    sku: 'WBH-001',
    inStock: true,
  },
  {
    id: 'prod-002',
    name: 'USB-C Charging Cable',
    description: 'Fast charging USB-C cable, 2 meters',
    priceInCents: 1499,
    sku: 'USB-002',
    inStock: true,
  },
  {
    id: 'prod-003',
    name: 'Laptop Stand',
    description: 'Adjustable aluminum laptop stand',
    priceInCents: 4999,
    sku: 'LS-003',
    inStock: true,
  },
  {
    id: 'prod-004',
    name: 'Mechanical Keyboard',
    description: 'RGB mechanical keyboard with Cherry MX switches',
    priceInCents: 12999,
    sku: 'MK-004',
    inStock: true,
  },
  {
    id: 'prod-005',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with precision tracking',
    priceInCents: 3999,
    sku: 'WM-005',
    inStock: true,
  },
  {
    id: 'prod-006',
    name: 'Monitor Light Bar',
    description: 'LED monitor light bar with adjustable brightness',
    priceInCents: 5999,
    sku: 'MLB-006',
    inStock: false, // Out of stock for testing
  },
]

/**
 * Factory function to create an InMemoryProductRepository
 * @param withSampleData - Whether to pre-populate with sample products
 */
export const createInMemoryProductRepository = (
  withSampleData = true
): InMemoryProductRepository => {
  const storage = new Map<string, Product>()

  // Initialize with sample products if requested
  if (withSampleData) {
    SAMPLE_PRODUCTS.forEach(productData => {
      const product = createProduct(productData)
      storage.set(product.id.value, product)
    })
  }

  return {
    async findById(productId: string): Promise<Product | null> {
      return storage.get(productId) ?? null
    },

    async findByIds(productIds: string[]): Promise<Product[]> {
      const products: Product[] = []
      for (const id of productIds) {
        const product = storage.get(id)
        if (product) {
          products.push(product)
        }
      }
      return products
    },

    async exists(productId: string): Promise<boolean> {
      return storage.has(productId)
    },

    async findAll(): Promise<Product[]> {
      return Array.from(storage.values())
    },

    addProduct(product: Product): void {
      storage.set(product.id.value, product)
    },

    clear(): void {
      storage.clear()
    },

    size(): number {
      return storage.size
    },
  }
}
