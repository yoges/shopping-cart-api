/**
 * Product Repository Interface
 *
 * Defines the contract for product data access.
 * In a real system, this might connect to a product catalog service.
 */

import { Product } from '../entities/Product.js'

export interface ProductRepository {
  /**
   * Finds a product by ID
   * @returns The product if found, null otherwise
   */
  findById(productId: string): Promise<Product | null>

  /**
   * Finds multiple products by IDs
   * @returns Array of found products (may be fewer than requested if some not found)
   */
  findByIds(productIds: string[]): Promise<Product[]>

  /**
   * Checks if a product exists
   */
  exists(productId: string): Promise<boolean>

  /**
   * Gets all products (for demo purposes)
   */
  findAll(): Promise<Product[]>
}
