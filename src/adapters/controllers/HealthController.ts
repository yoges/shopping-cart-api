/**
 * Health Controller
 *
 * Handles health check endpoints for monitoring and load balancers.
 */

import { Request, Response } from 'express'

export type HealthStatus = {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
}

export type HealthController = {
  health: (req: Request, res: Response) => void
  ready: (req: Request, res: Response) => void
  live: (req: Request, res: Response) => void
}

const startTime = Date.now()

/**
 * Factory function to create HealthController
 */
export const createHealthController = (): HealthController => {
  return {
    /**
     * GET /health
     * Comprehensive health check
     */
    health(_req: Request, res: Response): void {
      const status: HealthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.APP_VERSION ?? '1.0.0',
        uptime: Math.floor((Date.now() - startTime) / 1000),
      }

      res.status(200).json(status)
    },

    /**
     * GET /health/ready
     * Readiness probe for Kubernetes
     */
    ready(_req: Request, res: Response): void {
      // In a real app, check database connections, etc.
      res.status(200).json({ ready: true })
    },

    /**
     * GET /health/live
     * Liveness probe for Kubernetes
     */
    live(_req: Request, res: Response): void {
      res.status(200).json({ alive: true })
    },
  }
}
