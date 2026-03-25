import { Router } from 'express'
import type { Request, Response } from 'express'
import { verifyBuyer, verifyToken, verifyWorker } from '../middlewares/auth'
import { Notification } from '../models/Notification'
import { Submission } from '../models/Submission'
import { Task } from '../models/Task'
import { User } from '../models/User'
import type { CreateSubmissionBody, WorkerSubmissionQuery } from '../types/submission'

const submissionsRouter = Router()

interface PublicSubmission {
  _id: string
  task_id: string
  task_title: string
  payable_amount: number
  worker_email: string
  worker_name: string
  buyer_name: string
  buyer_email: string
  submission_details: string
  current_date: string
  status: 'pending' | 'approved' | 'rejected'
}

const toPublicSubmission = (submission: {
  _id: unknown
  task_id: string
  task_title: string
  payable_amount: number
  worker_email: string
  worker_name: string
  buyer_name: string
  buyer_email: string
  submission_details: string
  current_date: string
  status: 'pending' | 'approved' | 'rejected'
}): PublicSubmission => {
  return {
    _id: String(submission._id),
    task_id: submission.task_id,
    task_title: submission.task_title,
    payable_amount: submission.payable_amount,
    worker_email: submission.worker_email,
    worker_name: submission.worker_name,
    buyer_name: submission.buyer_name,
    buyer_email: submission.buyer_email,
    submission_details: submission.submission_details,
    current_date: submission.current_date,
    status: submission.status,
  }
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

const isPositiveNumber = (value: number): boolean => Number.isFinite(value) && value > 0

type CreateSubmissionRequest = Request<Record<string, never>, Record<string, never>, CreateSubmissionBody>
type WorkerSubmissionsRequest = Request<{ email: string }, Record<string, never>, Record<string, never>, WorkerSubmissionQuery>
type BuyerSubmissionsRequest = Request<{ email: string }>
type SubmissionIdRequest = Request<{ id: string }>

// Worker-only route:
// Creates a new task submission with status 'pending'.
submissionsRouter.post('/', verifyToken, verifyWorker, async (req: CreateSubmissionRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: user not found in request' })
      return
    }

    const {
      task_id,
      task_title,
      payable_amount,
      worker_email,
      worker_name,
      buyer_name,
      buyer_email,
      submission_details,
      current_date,
    } = req.body

    if (
      !task_id ||
      !task_title ||
      !worker_email ||
      !worker_name ||
      !buyer_name ||
      !buyer_email ||
      !submission_details ||
      !current_date
    ) {
      res.status(400).json({ message: 'All submission fields are required' })
      return
    }

    if (!isPositiveNumber(payable_amount)) {
      res.status(400).json({ message: 'payable_amount must be a positive number' })
      return
    }

    const normalizedWorkerEmail = normalizeEmail(worker_email)
    if (normalizedWorkerEmail !== req.user.email) {
      res.status(403).json({ message: 'Forbidden: worker_email must match authenticated user' })
      return
    }

    const task = await Task.findById(task_id)
    if (!task) {
      res.status(404).json({ message: 'Task not found' })
      return
    }

    if (task.required_workers < 1) {
      res.status(400).json({ message: 'Task has no available worker slots' })
      return
    }

    if (task.buyer_email !== normalizeEmail(buyer_email)) {
      res.status(400).json({ message: 'buyer_email does not match task owner' })
      return
    }

    task.required_workers -= 1
    await task.save()

    const newSubmission = await Submission.create({
      task_id: String(task._id),
      task_title: task_title.trim(),
      payable_amount,
      worker_email: normalizedWorkerEmail,
      worker_name: worker_name.trim(),
      buyer_name: buyer_name.trim(),
      buyer_email: normalizeEmail(buyer_email),
      submission_details: submission_details.trim(),
      current_date: current_date.trim(),
      status: 'pending',
    })

    await Notification.create({
      message: `New submission received for task "${task.task_title}"`,
      toEmail: task.buyer_email,
      actionRoute: '/dashboard/buyer-home',
      createdAt: new Date().toISOString(),
    })

    res.status(201).json(toPublicSubmission(newSubmission))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create submission'
    res.status(500).json({ message })
  }
})

// Worker-only route:
// Returns worker's submissions with pagination.
submissionsRouter.get('/worker/:email', verifyToken, verifyWorker, async (req: WorkerSubmissionsRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: user not found in request' })
      return
    }

    const requestedEmail = normalizeEmail(req.params.email)
    if (requestedEmail !== req.user.email) {
      res.status(403).json({ message: 'Forbidden: you can only view your own submissions' })
      return
    }

    const pageRaw = Number(req.query.page ?? 1)
    const limitRaw = Number(req.query.limit ?? 10)
    const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1
    const limit = Number.isInteger(limitRaw) && limitRaw > 0 ? limitRaw : 10
    const skip = (page - 1) * limit

    const totalItems = await Submission.countDocuments({ worker_email: requestedEmail })
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit)

    const submissions = await Submission.find({ worker_email: requestedEmail })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    res.status(200).json({
      submissions: submissions.map((submission) => toPublicSubmission(submission)),
      totalPages,
      currentPage: page,
      totalItems,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get worker submissions'
    res.status(500).json({ message })
  }
})

// Buyer-only route:
// Returns all pending submissions that belong to this buyer.
submissionsRouter.get('/buyer/:email', verifyToken, verifyBuyer, async (req: BuyerSubmissionsRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: user not found in request' })
      return
    }

    const requestedEmail = normalizeEmail(req.params.email)
    if (requestedEmail !== req.user.email) {
      res.status(403).json({ message: 'Forbidden: you can only view your own pending submissions' })
      return
    }

    const pendingSubmissions = await Submission.find({
      buyer_email: requestedEmail,
      status: 'pending',
    }).sort({ createdAt: -1 })

    res.status(200).json(pendingSubmissions.map((submission) => toPublicSubmission(submission)))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get buyer submissions'
    res.status(500).json({ message })
  }
})

// Buyer-only route:
// Approves a submission, adds coins to worker, and sends worker notification.
submissionsRouter.patch('/:id/approve', verifyToken, verifyBuyer, async (req: SubmissionIdRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: user not found in request' })
      return
    }

    const submission = await Submission.findById(req.params.id)
    if (!submission) {
      res.status(404).json({ message: 'Submission not found' })
      return
    }

    if (submission.buyer_email !== req.user.email) {
      res.status(403).json({ message: 'Forbidden: this submission is not for your task' })
      return
    }

    if (submission.status !== 'pending') {
      res.status(400).json({ message: 'Only pending submissions can be approved' })
      return
    }

    const worker = await User.findOne({ email: submission.worker_email })
    if (!worker) {
      res.status(404).json({ message: 'Worker not found' })
      return
    }

    worker.coin += submission.payable_amount
    await worker.save()

    submission.status = 'approved'
    await submission.save()

    await Notification.create({
      message: `Your submission for "${submission.task_title}" was approved`,
      toEmail: submission.worker_email,
      actionRoute: '/dashboard/my-submissions',
      createdAt: new Date().toISOString(),
    })

    res.status(200).json(toPublicSubmission(submission))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to approve submission'
    res.status(500).json({ message })
  }
})

// Buyer-only route:
// Rejects a submission, returns 1 worker slot to task, and sends worker notification.
submissionsRouter.patch('/:id/reject', verifyToken, verifyBuyer, async (req: SubmissionIdRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: user not found in request' })
      return
    }

    const submission = await Submission.findById(req.params.id)
    if (!submission) {
      res.status(404).json({ message: 'Submission not found' })
      return
    }

    if (submission.buyer_email !== req.user.email) {
      res.status(403).json({ message: 'Forbidden: this submission is not for your task' })
      return
    }

    if (submission.status !== 'pending') {
      res.status(400).json({ message: 'Only pending submissions can be rejected' })
      return
    }

    const task = await Task.findById(submission.task_id)
    if (!task) {
      res.status(404).json({ message: 'Related task not found' })
      return
    }

    task.required_workers += 1
    await task.save()

    submission.status = 'rejected'
    await submission.save()

    await Notification.create({
      message: `Your submission for "${submission.task_title}" was rejected`,
      toEmail: submission.worker_email,
      actionRoute: '/dashboard/my-submissions',
      createdAt: new Date().toISOString(),
    })

    res.status(200).json(toPublicSubmission(submission))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reject submission'
    res.status(500).json({ message })
  }
})

export default submissionsRouter
