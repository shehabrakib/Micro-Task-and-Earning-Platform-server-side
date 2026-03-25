import { Schema, model } from 'mongoose'

export interface PaymentDocument {
  buyer_email: string
  amount_usd: number
  coins: number
  payment_date: string
  createdAt: Date
  updatedAt: Date
}

const paymentSchema = new Schema<PaymentDocument>(
  {
    buyer_email: { type: String, required: true, lowercase: true, trim: true },
    amount_usd: { type: Number, required: true, min: 0 },
    coins: { type: Number, required: true, min: 0 },
    payment_date: { type: String, required: true, default: () => new Date().toISOString() },
  },
  { timestamps: true }
)

export const Payment = model<PaymentDocument>('Payment', paymentSchema)

