/**
 * Middleware
 *
 * Express middleware for logging, error handling, etc.
 */

import { Request, Response, NextFunction } from 'express'

export type Logger = {
  info: (message: string, meta?: Record<string, unknown>) => void
  error: (message: string, meta?: Record<string, unknown>) => void
  warn: (message: string, meta?: Record<string, unknown>) => void
  debug: (message: string, meta?: Record<string, unknown>) => void
}

/**
 * Creates a simple console logger
 */
export const createLogger = (): Logger => {
  const formatMessage = (
    level: string,
    message: string,
    meta?: Record<string, unknown>
  ): string => {
    const timestamp = new Date().toISOString()
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
    return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`
  }

  return {
    info: (message, meta) => console.log(formatMessage('info', message, meta)),
    error: (message, meta) => console.error(formatMessage('error', message, meta)),
    warn: (message, meta) => console.warn(formatMessage('warn', message, meta)),
    debug: (message, meta) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(formatMessage('debug', message, meta))
      }
    },
  }
}

/**
 * Request logging middleware
 */
export const requestLogger = (logger: Logger) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now()

    res.on('finish', () => {
      const duration = Date.now() - start
      logger.info(`${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      })
    })

    next()
  }
}

/**
 * Error handling middleware
 */
export const errorHandler = (logger: Logger) => {
  return (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    logger.error('Unhandled error', {
      message: err.message,
      stack: err.stack,
    })

    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    })
  }
}

/**
 * 404 handler
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  })
}

/**
 * CORS middleware for development
 */
export const corsMiddleware = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  next()
}
