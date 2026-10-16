import { NextRequest } from 'next/server'
import { verifyToken, JWTPayload } from './jwt'

export function getAuthUser(req: NextRequest): JWTPayload | null {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return null
    const token = authHeader.split(' ')[1]
    return verifyToken(token)
  } catch {
    return null
  }
}

export function requireAuth(req: NextRequest, allowedRoles?: string[]): JWTPayload {
  const user = getAuthUser(req)
  if (!user) throw new Error('Unauthorized')
  if (allowedRoles && !allowedRoles.includes(user.role)) throw new Error('Forbidden')
  return user
}