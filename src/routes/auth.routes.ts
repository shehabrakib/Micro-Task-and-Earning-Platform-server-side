import { Router } from 'express'
import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { OAuth2Client } from 'google-auth-library'
import { User } from '../models/User'
import { createToken } from '../utils/jwt'
import { getStartingCoinByRole, isValidEmail } from '../utils/authHelpers'
import type { GoogleAuthBody, LoginBody, RegisterBody, UserRole } from '../types/auth'
import { env } from '../config/env'

const authRouter = Router()

const googleClient = new OAuth2Client(env.googleClientId)

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

authRouter.post(
  '/register',
  async (req: Request<Record<string, never>, Record<string, never>, RegisterBody>, res: Response) => {
    try {
      const { name, email, password, photoURL, role } = req.body

      if (!name || !email || !password || !photoURL || !role) {
        res.status(400).json({ message: 'name, email, password, photoURL, and role are required' })
        return
      }

      if (role !== 'worker' && role !== 'buyer') {
        res.status(400).json({ message: 'role must be worker or buyer' })
        return
      }

      if (!isValidEmail(email)) {
        res.status(400).json({ message: 'Invalid email format' })
        return
      }

      if (password.length < 6) {
        res.status(400).json({ message: 'Password must be at least 6 characters' })
        return
      }

      const normalizedEmail = normalizeEmail(email)

      const existingUser = await User.findOne({ email: normalizedEmail })
      if (existingUser) {
        res.status(409).json({ message: 'Email already in use' })
        return
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const newUser = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        photoURL: photoURL.trim(),
        role,
        coin: getStartingCoinByRole(role),
      })

      const token = createToken({
        userId: String(newUser._id),
        email: newUser.email,
        role: newUser.role,
      })

      res.status(201).json({ token })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      res.status(500).json({ message })
    }
  }
)

authRouter.post(
  '/login',
  async (req: Request<Record<string, never>, Record<string, never>, LoginBody>, res: Response) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        res.status(400).json({ message: 'email and password are required' })
        return
      }

      const normalizedEmail = normalizeEmail(email)
      const user = await User.findOne({ email: normalizedEmail })

      if (!user) {
        res.status(401).json({ message: 'Invalid email or password' })
        return
      }

      if (!user.password) {
        res.status(401).json({ message: 'Invalid email or password' })
        return
      }

      const isPasswordMatch = await bcrypt.compare(password, user.password)
      if (!isPasswordMatch) {
        res.status(401).json({ message: 'Invalid email or password' })
        return
      }

      const token = createToken({
        userId: String(user._id),
        email: user.email,
        role: user.role,
      })

      res.status(200).json({ token })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      res.status(500).json({ message })
    }
  }
)

authRouter.post(
  '/google',
  async (req: Request<Record<string, never>, Record<string, never>, GoogleAuthBody>, res: Response) => {
    try {
      const { idToken, role } = req.body

      if (!idToken) {
        res.status(400).json({ message: 'idToken is required' })
        return
      }

      if (!env.googleClientId) {
        res.status(500).json({ message: 'GOOGLE_CLIENT_ID is not configured' })
        return
      }

      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: env.googleClientId,
      })

      const payload = ticket.getPayload()
      if (!payload || !payload.email) {
        res.status(401).json({ message: 'Invalid Google token payload' })
        return
      }

      const normalizedEmail = normalizeEmail(payload.email)
      const nameFromGoogle = payload.name?.trim() || 'Google User'
      const photoFromGoogle = payload.picture?.trim() || ''

      let user = await User.findOne({ email: normalizedEmail })

      if (!user) {
        const selectedRole: UserRole = role === 'buyer' ? 'buyer' : 'worker'

        user = await User.create({
          name: nameFromGoogle,
          email: normalizedEmail,
          password: '',
          photoURL: photoFromGoogle,
          role: selectedRole,
          coin: getStartingCoinByRole(selectedRole),
        })
      }

      const token = createToken({
        userId: String(user._id),
        email: user.email,
        role: user.role,
      })

      res.status(200).json({ token })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Google authentication failed'
      res.status(401).json({ message })
    }
  }
)

export default authRouter
