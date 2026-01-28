/**
 * Error Presenter
 *
 * Transforms errors into API response format.
 */

import {
  DomainError,
  isDomainError,
  CartNotFoundError,
  ItemNotFoundError,
  ProductNotFoundError,
  ProductOutOfStockError,
  EmptyCartError,
  CartAlreadyCheckedOutError,
  ValidationError,
} from '../../domain/errors/DomainError.js'

export type ErrorResponse = {
  error: {
    code: string
    message: string
    field?: string
  }
}

export type HttpStatus = 400 | 404 | 409 | 422 | 500

export type PresentedError = {
  status: HttpStatus
  body: ErrorResponse
}

/**
 * Maps domain errors to HTTP status codes
 */
const getHttpStatus = (error: DomainError): HttpStatus => {
  if (error instanceof CartNotFoundError) return 404
  if (error instanceof ItemNotFoundError) return 404
  if (error instanceof ProductNotFoundError) return 404
  if (error instanceof ProductOutOfStockError) return 422
  if (error instanceof EmptyCartError) return 422
  if (error instanceof CartAlreadyCheckedOutError) return 409
  if (error instanceof ValidationError) return 400
  return 400 // Default for domain errors
}

/**
 * Presents a domain error for API response
 */
export const presentDomainError = (error: DomainError): PresentedError => {
  const status = getHttpStatus(error)

  const body: ErrorResponse = {
    error: {
      code: error.code,
      message: error.message,
    },
  }

  if (error instanceof ValidationError && error.field) {
    body.error.field = error.field
  }

  return { status, body }
}

/**
 * Presents any error for API response
 */
export const presentError = (error: unknown): PresentedError => {
  if (isDomainError(error)) {
    return presentDomainError(error)
  }

  // Handle standard errors
  if (error instanceof Error) {
    // Check if it's a validation-like error from domain entities
    if (error.message.includes('cannot be empty') ||
        error.message.includes('must be') ||
        error.message.includes('cannot exceed') ||
        error.message.includes('cannot have more than')) {
      return {
        status: 400,
        body: {
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        },
      }
    }

    return {
      status: 500,
      body: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
    }
  }

  // Unknown error type
  return {
    status: 500,
    body: {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
  }
}
