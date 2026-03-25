import { Router } from 'express'
import type { Request, Response } from 'express'
import { verifyToken } from '../middlewares/auth'
import { Notification } from '../models/Notification'

const notificationsRouter = Router()

interface PublicNotification {
  _id: string
  message: string
  toEmail: string
  actionRoute: string
  createdAt: string
}

const toPublicNotification = (notification: {
  _id: unknown
  message: string
  toEmail: string
  actionRoute: string
  createdAt: string
}): PublicNotification => {
  return {
    _id: String(notification._id),
    message: notification.message,
    toEmail: notification.toEmail,
    actionRoute: notification.actionRoute,
    createdAt: notification.createdAt,
  }
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase()
type NotificationEmailRequest = Request<{ email: string }>

// Authenticated route:
// Returns notifications for logged-in user only, sorted newest first.
notificationsRouter.get('/:email', verifyToken, async (req: NotificationEmailRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: user not found in request' })
      return
    }

    const requestedEmail = normalizeEmail(req.params.email)
    if (requestedEmail !== req.user.email) {
      res.status(403).json({ message: 'Forbidden: you can only access your own notifications' })
      return
    }

    const notifications = await Notification.find({ toEmail: requestedEmail }).sort({ createdAt: -1 })
    res.status(200).json(notifications.map((item) => toPublicNotification(item)))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get notifications'
    res.status(500).json({ message })
  }
})

export default notificationsRouter

