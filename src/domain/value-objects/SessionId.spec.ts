import { describe, it, expect } from 'vitest'

import {
  createSessionId,
  sessionIdEquals,
  sessionIdToString,
} from './SessionId.js'

describe('SessionId Value Object', () => {
  describe('createSessionId', () => {
    it('should create sessionId with valid value', () => {
      const sessionId = createSessionId('session-123')
      expect(sessionId.value).toBe('session-123')
    })

    it('should accept UUID format', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      const sessionId = createSessionId(uuid)
      expect(sessionId.value).toBe(uuid)
    })

    it('should trim whitespace', () => {
      const sessionId = createSessionId('  session-123  ')
      expect(sessionId.value).toBe('session-123')
    })

    it('should throw for empty string', () => {
      expect(() => createSessionId('')).toThrow('cannot be empty')
    })

    it('should throw for whitespace only', () => {
      expect(() => createSessionId('   ')).toThrow('cannot be empty')
    })

    it('should throw for invalid characters', () => {
      expect(() => createSessionId('session@123')).toThrow('alphanumeric')
    })

    it('should be immutable', () => {
      const sessionId = createSessionId('session-123')
      expect(Object.isFrozen(sessionId)).toBe(true)
    })
  })

  describe('sessionIdEquals', () => {
    it('should return true for equal ids', () => {
      const a = createSessionId('session-123')
      const b = createSessionId('session-123')
      expect(sessionIdEquals(a, b)).toBe(true)
    })

    it('should return false for different ids', () => {
      const a = createSessionId('session-123')
      const b = createSessionId('session-456')
      expect(sessionIdEquals(a, b)).toBe(false)
    })
  })

  describe('sessionIdToString', () => {
    it('should return the value', () => {
      const sessionId = createSessionId('session-123')
      expect(sessionIdToString(sessionId)).toBe('session-123')
    })
  })
})
