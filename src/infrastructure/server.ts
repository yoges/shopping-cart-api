/**
 * HTTP Server
 *
 * Entry point for the application.
 * Sets up Express server with middleware and routes.
 */

import express from 'express'
import { createContainer } from './container.js'
import {
  createLogger,
  requestLogger,
  errorHandler,
  notFoundHandler,
  corsMiddleware,
} from './middleware.js'

const PORT = process.env.PORT ?? 3000
const NODE_ENV = process.env.NODE_ENV ?? 'development'

const logger = createLogger()

// Create Express app
const app = express()

// Basic middleware
app.use(express.json())
app.use(corsMiddleware)
app.use(requestLogger(logger))

// Create container and mount routes
const container = createContainer()
app.use(container.apiRouter)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler(logger))

// Graceful shutdown handling
let isShuttingDown = false

const gracefulShutdown = (signal: string): void => {
  if (isShuttingDown) return

  isShuttingDown = true
  logger.info(`Received ${signal}, starting graceful shutdown...`)

  // Give time for in-flight requests to complete
  setTimeout(() => {
    logger.info('Shutting down server...')
    container.cleanup()
    process.exit(0)
  }, 5000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack })
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) })
  process.exit(1)
})

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Shopping Cart API started`, {
    port: PORT,
    environment: NODE_ENV,
    nodeVersion: process.version,
  })
  logger.info(`Health check: http://localhost:${PORT}/health`)
  logger.info(`API docs: http://localhost:${PORT}/api/products`)
})

export { app, server }
