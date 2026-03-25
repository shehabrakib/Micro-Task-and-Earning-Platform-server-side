import { Schema, model } from 'mongoose'

export interface NotificationDocument {
  message: string
  toEmail: string
  actionRoute: string
  createdAt: string
}

const notificationSchema = new Schema<NotificationDocument>({
  message: { type: String, required: true, trim: true },
  toEmail: { type: String, required: true, lowercase: true, trim: true },
  actionRoute: { type: String, required: true, trim: true },
  createdAt: { type: String, required: true, default: () => new Date().toISOString() },
})

export const Notification = model<NotificationDocument>('Notification', notificationSchema)

