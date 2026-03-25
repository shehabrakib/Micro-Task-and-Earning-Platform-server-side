import { Schema, model } from 'mongoose'

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export interface SubmissionDocument {
  task_id: string
  task_title: string
  payable_amount: number
  worker_email: string
  worker_name: string
  buyer_name: string
  buyer_email: string
  submission_details: string
  current_date: string
  status: SubmissionStatus
  createdAt: Date
  updatedAt: Date
}

const submissionSchema = new Schema<SubmissionDocument>(
  {
    task_id: { type: String, required: true, trim: true },
    task_title: { type: String, required: true, trim: true },
    payable_amount: { type: Number, required: true, min: 0 },
    worker_email: { type: String, required: true, lowercase: true, trim: true },
    worker_name: { type: String, required: true, trim: true },
    buyer_name: { type: String, required: true, trim: true },
    buyer_email: { type: String, required: true, lowercase: true, trim: true },
    submission_details: { type: String, required: true, trim: true },
    current_date: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
    },
  },
  { timestamps: true }
)

export const Submission = model<SubmissionDocument>('Submission', submissionSchema)

