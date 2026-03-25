import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import type { JwtUserPayload } from '../types/auth'

export const createToken = (payload: JwtUserPayload): string => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '7d' })
}
