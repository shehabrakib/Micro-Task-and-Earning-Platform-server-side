import { Schema, model } from 'mongoose'

export type WithdrawalStatus = 'pending' | 'approved'

export interface WithdrawalDocument {
  worker_email: string
  worker_name: string
  withdrawal_coin: number
  withdrawal_amount: number
  payment_system: string
  account_number: string
  withdraw_date: string
  status: WithdrawalStatus
  createdAt: Date
  updatedAt: Date
}

const withdrawalSchema = new Schema<WithdrawalDocument>(
  {
    worker_email: { type: String, required: true, lowercase: true, trim: true },
    worker_name: { type: String, required: true, trim: true },
    withdrawal_coin: { type: Number, required: true, min: 1 },
    withdrawal_amount: { type: Number, required: true, min: 0 },
    payment_system: { type: String, required: true, trim: true },
    account_number: { type: String, required: true, trim: true },
    withdraw_date: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved'],
      default: 'pending',
      required: true,
    },
  },
  { timestamps: true }
)

export const Withdrawal = model<WithdrawalDocument>('Withdrawal', withdrawalSchema)

