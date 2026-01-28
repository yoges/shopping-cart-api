/**
 * SessionId Value Object
 *
 * Represents a unique session identifier for a shopping cart.
 * Typically a UUID or similar unique string.
 */

export type SessionId = {
  readonly value: string
}

const SESSION_ID_PATTERN = /^[a-zA-Z0-9-]{1,100}$/

/**
 * Creates a SessionId value object
 * @param value - The session ID string
 * @throws Error if format is invalid
 */
export const createSessionId = (value: string): SessionId => {
  if (!value || value.trim() === '') {
    throw new Error('SessionId cannot be empty')
  }

  const trimmed = value.trim()

  if (!SESSION_ID_PATTERN.test(trimmed)) {
    throw new Error(
      'SessionId must be 1-100 alphanumeric characters or hyphens'
    )
  }

  return Object.freeze({ value: trimmed })
}

/**
 * Checks if two SessionIds are equal
 */
export const sessionIdEquals = (a: SessionId, b: SessionId): boolean => {
  return a.value === b.value
}

/**
 * Converts SessionId to string for serialization
 */
export const sessionIdToString = (sessionId: SessionId): string => {
  return sessionId.value
}
