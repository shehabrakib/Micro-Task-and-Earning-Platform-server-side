import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import type { UserRole } from '../types/auth'

const extractTokenFromHeader = (authorizationHeader: string | undefined): string | null => {
  if (!authorizationHeader) return null
  const [scheme, token] = authorizationHeader.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  return token
}

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractTokenFromHeader(req.headers.authorization)

  if (!token) {
    res.status(401).json({ message: 'Unauthorized: token missing or invalid format' })
    return
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret)

    if (typeof decoded !== 'object' || !decoded) {
      res.status(401).json({ message: 'Unauthorized: invalid token payload' })
      return
    }

    const userId = decoded.userId
    const email = decoded.email
    const role = decoded.role

    if (typeof userId !== 'string' || typeof email !== 'string' || typeof role !== 'string') {
      res.status(401).json({ message: 'Unauthorized: invalid token payload data' })
      return
    }

    if (role !== 'worker' && role !== 'buyer' && role !== 'admin') {
      res.status(401).json({ message: 'Unauthorized: invalid role in token' })
      return
    }

    req.user = { userId, email, role }
    next()
  } catch {
    res.status(401).json({ message: 'Unauthorized: token verification failed' })
  }
}

const verifyRole = (requiredRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: user not found in request' })
      return
    }

    if (req.user.role !== requiredRole) {
      res.status(403).json({ message: `Forbidden: ${requiredRole} role required` })
      return
    }

    next()
  }
}

export const verifyWorker = verifyRole('worker')
export const verifyBuyer = verifyRole('buyer')
export const verifyAdmin = verifyRole('admin')
