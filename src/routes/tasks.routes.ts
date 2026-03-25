import { Router } from 'express'
import type { Request, Response } from 'express'
import { verifyAdmin, verifyBuyer, verifyToken } from '../middlewares/auth'
import { Task } from '../models/Task'
import { User } from '../models/User'
import type { CreateTaskBody, UpdateTaskBody } from '../types/task'

const tasksRouter = Router()

interface PublicTask {
  _id: string
  task_title: string
  task_detail: string
  required_workers: number
  payable_amount: number
  completion_date: string
  submission_info: string
  task_image_url: string
  buyer_email: string
  buyer_name: string
}

const toPublicTask = (task: {
  _id: unknown
  task_title: string
  task_detail: string
  required_workers: number
  payable_amount: number
  completion_date: string
  submission_info: string
  task_image_url: string
  buyer_email: string
  buyer_name: string
}): PublicTask => {
  return {
    _id: String(task._id),
    task_title: task.task_title,
    task_detail: task.task_detail,
    required_workers: task.required_workers,
    payable_amount: task.payable_amount,
    completion_date: task.completion_date,
    submission_info: task.submission_info,
    task_image_url: task.task_image_url,
    buyer_email: task.buyer_email,
    buyer_name: task.buyer_name,
  }
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

const isNonEmptyString = (value: string): boolean => value.trim().length > 0

const isPositiveNumber = (value: number): boolean => Number.isFinite(value) && value > 0

type CreateTaskRequest = Request<Record<string, never>, Record<string, never>, CreateTaskBody>
type UpdateTaskRequest = Request<{ id: string }, Record<string, never>, UpdateTaskBody>
type TaskIdRequest = Request<{ id: string }>
type BuyerEmailRequest = Request<{ email: string }>

// Buyer-only route:
// Creates a task and deducts (required_workers * payable_amount) coins from buyer.
tasksRouter.post('/', verifyToken, verifyBuyer, async (req: CreateTaskRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: user not found in request' })
      return
    }

    const {
      task_title,
      task_detail,
      required_workers,
      payable_amount,
      completion_date,
      submission_info,
      task_image_url,
      buyer_email,
      buyer_name,
    } = req.body

    const requiredStringFields = [
      task_title,
      task_detail,
      completion_date,
      submission_info,
      task_image_url,
      buyer_email,
      buyer_name,
    ]

    const hasInvalidStringField = requiredStringFields.some((field) => !field || !isNonEmptyString(field))
    if (hasInvalidStringField) {
      res.status(400).json({ message: 'All task text fields are required' })
      return
    }

    if (!isPositiveNumber(required_workers) || !Number.isInteger(required_workers)) {
      res.status(400).json({ message: 'required_workers must be a positive integer' })
      return
    }

    if (!isPositiveNumber(payable_amount)) {
      res.status(400).json({ message: 'payable_amount must be a positive number' })
      return
    }

    const normalizedBuyerEmail = normalizeEmail(buyer_email)
    if (normalizedBuyerEmail !== req.user.email) {
      res.status(403).json({ message: 'Forbidden: buyer_email must match authenticated user' })
      return
    }

    const buyer = await User.findById(req.user.userId)
    if (!buyer) {
      res.status(404).json({ message: 'Buyer not found' })
      return
    }

    const totalCost = required_workers * payable_amount
    if (buyer.coin < totalCost) {
      res.status(400).json({ message: 'Insufficient coins to create this task' })
      return
    }

    buyer.coin -= totalCost
    await buyer.save()

    const newTask = await Task.create({
      task_title: task_title.trim(),
      task_detail: task_detail.trim(),
      required_workers,
      payable_amount,
      completion_date: completion_date.trim(),
      submission_info: submission_info.trim(),
      task_image_url: task_image_url.trim(),
      buyer_email: normalizedBuyerEmail,
      buyer_name: buyer_name.trim(),
    })

    res.status(201).json(toPublicTask(newTask))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create task'
    res.status(500).json({ message })
  }
})

// Authenticated route:
// Returns all available tasks where required_workers > 0.
tasksRouter.get('/', verifyToken, async (_req: Request, res: Response) => {
  try {
    const tasks = await Task.find({ required_workers: { $gt: 0 } })
    const responseData = tasks.map((task) => toPublicTask(task))
    res.status(200).json(responseData)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get tasks'
    res.status(500).json({ message })
  }
})

// Buyer-only route:
// Returns all tasks created by the logged-in buyer (sorted by completion_date desc).
tasksRouter.get('/buyer/:email', verifyToken, verifyBuyer, async (req: BuyerEmailRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: user not found in request' })
      return
    }

    const requestedEmail = normalizeEmail(req.params.email)
    if (requestedEmail !== req.user.email) {
      res.status(403).json({ message: 'Forbidden: you can only view your own tasks' })
      return
    }

    const tasks = await Task.find({ buyer_email: requestedEmail }).sort({ completion_date: -1 })
    const responseData = tasks.map((task) => toPublicTask(task))
    res.status(200).json(responseData)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get buyer tasks'
    res.status(500).json({ message })
  }
})

// Admin-only route:
// Returns every task including tasks with required_workers = 0.
tasksRouter.get('/admin/all', verifyToken, verifyAdmin, async (_req: Request, res: Response) => {
  try {
    const tasks = await Task.find()
    const responseData = tasks.map((task) => toPublicTask(task))
    res.status(200).json(responseData)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get all admin tasks'
    res.status(500).json({ message })
  }
})

// Authenticated route:
// Returns full details of a single task by id.
tasksRouter.get('/:id', verifyToken, async (req: TaskIdRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id)
    if (!task) {
      res.status(404).json({ message: 'Task not found' })
      return
    }

    res.status(200).json(toPublicTask(task))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get task details'
    res.status(500).json({ message })
  }
})

// Buyer-only route:
// Buyer can edit only task_title, task_detail, and submission_info for own task.
tasksRouter.patch('/:id', verifyToken, verifyBuyer, async (req: UpdateTaskRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: user not found in request' })
      return
    }

    const allowedFields = ['task_title', 'task_detail', 'submission_info']
    const requestKeys = Object.keys(req.body)
    const hasInvalidField = requestKeys.some((field) => !allowedFields.includes(field))
    if (hasInvalidField) {
      res.status(400).json({ message: 'Only task_title, task_detail, and submission_info can be updated' })
      return
    }

    const hasNoUpdateData = requestKeys.length === 0
    if (hasNoUpdateData) {
      res.status(400).json({ message: 'At least one update field is required' })
      return
    }

    const task = await Task.findById(req.params.id)
    if (!task) {
      res.status(404).json({ message: 'Task not found' })
      return
    }

    if (task.buyer_email !== req.user.email) {
      res.status(403).json({ message: 'Forbidden: you can only update your own tasks' })
      return
    }

    if (req.body.task_title !== undefined) {
      if (!isNonEmptyString(req.body.task_title)) {
        res.status(400).json({ message: 'task_title cannot be empty' })
        return
      }
      task.task_title = req.body.task_title.trim()
    }

    if (req.body.task_detail !== undefined) {
      if (!isNonEmptyString(req.body.task_detail)) {
        res.status(400).json({ message: 'task_detail cannot be empty' })
        return
      }
      task.task_detail = req.body.task_detail.trim()
    }

    if (req.body.submission_info !== undefined) {
      if (!isNonEmptyString(req.body.submission_info)) {
        res.status(400).json({ message: 'submission_info cannot be empty' })
        return
      }
      task.submission_info = req.body.submission_info.trim()
    }

    await task.save()
    res.status(200).json(toPublicTask(task))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update task'
    res.status(500).json({ message })
  }
})

// Buyer/Admin route:
// Buyer can delete only own task and gets refund for remaining slots.
// Admin can delete any task with no refund.
tasksRouter.delete('/:id', verifyToken, async (req: TaskIdRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: user not found in request' })
      return
    }

    if (req.user.role !== 'buyer' && req.user.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden: only buyer or admin can delete tasks' })
      return
    }

    const task = await Task.findById(req.params.id)
    if (!task) {
      res.status(404).json({ message: 'Task not found' })
      return
    }

    if (req.user.role === 'admin') {
      await task.deleteOne()
      res.status(200).json({ message: 'Task deleted by admin with no refund' })
      return
    }

    if (task.buyer_email !== req.user.email) {
      res.status(403).json({ message: 'Forbidden: you can only delete your own tasks' })
      return
    }

    const buyer = await User.findById(req.user.userId)
    if (!buyer) {
      res.status(404).json({ message: 'Buyer not found' })
      return
    }

    const refundAmount = task.required_workers * task.payable_amount
    buyer.coin += refundAmount
    await buyer.save()

    await task.deleteOne()

    res.status(200).json({
      message: 'Task deleted and refund added',
      refundedCoin: refundAmount,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete task'
    res.status(500).json({ message })
  }
})

export default tasksRouter

