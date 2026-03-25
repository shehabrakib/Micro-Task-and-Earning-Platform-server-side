import { Router } from 'express'
import type { Request, Response } from 'express'
import { User } from '../models/User'
import { verifyAdmin, verifyToken } from '../middlewares/auth'
import type { UpdateUserRoleBody } from '../types/user'

const usersRouter = Router()

interface PublicUser {
  _id: string
  name: string
  email: string
  photoURL: string
  role: 'worker' | 'buyer' | 'admin'
  coin: number
}

const toPublicUser = (user: {
  _id: unknown
  name: string
  email: string
  photoURL: string
  role: 'worker' | 'buyer' | 'admin'
  coin: number
}): PublicUser => {
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    photoURL: user.photoURL,
    role: user.role,
    coin: user.coin,
  }
}

type UpdateRoleRequest = Request<{ id: string }, Record<string, never>, UpdateUserRoleBody>

// Public route:
// Returns top 6 workers by coin balance (highest first).
usersRouter.get('/top-workers', async (_req: Request, res: Response) => {
  try {
    const topWorkers = await User.find({ role: 'worker' })
      .sort({ coin: -1 })
      .limit(6)
      .select('name email photoURL role coin')

    const responseData = topWorkers.map((worker) => toPublicUser(worker))
    res.status(200).json(responseData)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get top workers'
    res.status(500).json({ message })
  }
})

// Logged-in user route:
// Returns profile info of the currently authenticated user.
usersRouter.get('/me', verifyToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: user not found in request' })
      return
    }

    const user = await User.findById(req.user.userId).select('name email photoURL role coin')
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    res.status(200).json(toPublicUser(user))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get current user'
    res.status(500).json({ message })
  }
})

// Admin-only route:
// Returns all users for admin management page.
usersRouter.get('/', verifyToken, verifyAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await User.find().select('name email photoURL role coin')
    const responseData = users.map((user) => toPublicUser(user))
    res.status(200).json(responseData)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get users'
    res.status(500).json({ message })
  }
})

// Admin-only route:
// Updates one user's role (worker/buyer/admin) by user id.
usersRouter.patch('/:id/role', verifyToken, verifyAdmin, async (req: UpdateRoleRequest, res: Response) => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!role) {
      res.status(400).json({ message: 'role is required' })
      return
    }

    if (role !== 'worker' && role !== 'buyer' && role !== 'admin') {
      res.status(400).json({ message: 'role must be worker, buyer, or admin' })
      return
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true, projection: 'name email photoURL role coin' }
    )

    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    res.status(200).json(toPublicUser(updatedUser))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update user role'
    res.status(500).json({ message })
  }
})

// Admin-only route:
// Deletes one user by user id.
usersRouter.delete('/:id', verifyToken, verifyAdmin, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params

    const deletedUser = await User.findByIdAndDelete(id).select('name email photoURL role coin')
    if (!deletedUser) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    res.status(200).json({
      message: 'User deleted successfully',
      user: toPublicUser(deletedUser),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete user'
    res.status(500).json({ message })
  }
})

export default usersRouter
