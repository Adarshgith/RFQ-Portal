import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface JWTPayload {
  id: string
  email: string
  role: string
}

export function signToken(payload: JWTPayload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, SECRET) as any
    if (payload && payload.role) {
      return {
        id: payload.id || payload.userId,
        email: payload.email,
        role: payload.role,
      }
    }
    return null
  } catch {
    return null
  }
}