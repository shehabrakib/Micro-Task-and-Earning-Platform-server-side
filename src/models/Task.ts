import { Schema, model } from 'mongoose'

export interface TaskDocument {
  task_title: string
  task_detail: string
  required_workers: number
  payable_amount: number
  completion_date: string
  submission_info: string
  task_image_url: string
  buyer_email: string
  buyer_name: string
  createdAt: Date
  updatedAt: Date
}

const taskSchema = new Schema<TaskDocument>(
  {
    task_title: { type: String, required: true, trim: true },
    task_detail: { type: String, required: true, trim: true },
    required_workers: { type: Number, required: true, min: 0 },
    payable_amount: { type: Number, required: true, min: 0 },
    completion_date: { type: String, required: true, trim: true },
    submission_info: { type: String, required: true, trim: true },
    task_image_url: { type: String, required: true, trim: true },
    buyer_email: { type: String, required: true, lowercase: true, trim: true },
    buyer_name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

export const Task = model<TaskDocument>('Task', taskSchema)

