import { Schema, model } from 'mongoose'
import type { UserRole } from '../types/auth'

export interface UserDocument {
  name: string
  email: string
  password: string
  photoURL: string
  role: UserRole
  coin: number
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: '' },
    photoURL: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['worker', 'buyer', 'admin'],
      required: true,
    },
    coin: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
)

export const User = model<UserDocument>('User', userSchema)
