import { Router } from 'express'
import type { Request, Response } from 'express'
import { verifyAdmin, verifyToken, verifyWorker } from '../middlewares/auth'
import { Notification } from '../models/Notification'
import { User } from '../models/User'
import { Withdrawal } from '../models/Withdrawal'
import type { CreateWithdrawalBody } from '../types/withdrawal'

const withdrawalsRouter = Router()

interface PublicWithdrawal {
  _id: string
  worker_email: string
  worker_name: string
  withdrawal_coin: number
  withdrawal_amount: number
  payment_system: string
  account_number: string
  withdraw_date: string
  status: 'pending' | 'approved'
}

const toPublicWithdrawal = (withdrawal: {
  _id: unknown
  worker_email: string
  worker_name: string
  withdrawal_coin: number
  withdrawal_amount: number
  payment_system: string
  account_number: string
  withdraw_date: string
  status: 'pending' | 'approved'
}): PublicWithdrawal => {
  return {
    _id: String(withdrawal._id),
    worker_email: withdrawal.worker_email,
    worker_name: withdrawal.worker_name,
    withdrawal_coin: withdrawal.withdrawal_coin,
    withdrawal_amount: withdrawal.withdrawal_amount,
    payment_system: withdrawal.payment_system,
    account_number: withdrawal.account_number,
    withdraw_date: withdrawal.withdraw_date,
    status: withdrawal.status,
  }
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase()
const isPositiveNumber = (value: number): boolean => Number.isFinite(value) && value > 0

type CreateWithdrawalRequest = Request<Record<string, never>, Record<string, never>, CreateWithdrawalBody>
type WithdrawalIdRequest = Request<{ id: string }>

// Worker-only route:
// Creates a withdrawal request with status 'pending'.
// Validation: worker must have at least 200 coins and cannot withdraw more than current balance.
withdrawalsRouter.post('/', verifyToken, verifyWorker, async (req: CreateWithdrawalRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: user not found in request' })
      return
    }

    const { worker_email, worker_name, withdrawal_coin, withdrawal_amount, payment_system, account_number, withdraw_date } = req.body

    if (!worker_email || !worker_name || !payment_system || !account_number || !withdraw_date) {
      res.status(400).json({ message: 'All withdrawal fields are required' })
      return
    }

    if (!isPositiveNumber(withdrawal_coin) || !Number.isInteger(withdrawal_coin)) {
      res.status(400).json({ message: 'withdrawal_coin must be a positive integer' })
      return
    }

    if (!isPositiveNumber(withdrawal_amount)) {
      res.status(400).json({ message: 'withdrawal_amount must be a positive number' })
      return
    }

    const expectedAmount = withdrawal_coin / 20
    if (Math.abs(withdrawal_amount - expectedAmount) > 0.0001) {
      res.status(400).json({ message: 'withdrawal_amount must be withdrawal_coin / 20' })
      return
    }

    const normalizedWorkerEmail = normalizeEmail(worker_email)
    if (normalizedWorkerEmail !== req.user.email) {
      res.status(403).json({ message: 'Forbidden: worker_email must match authenticated user' })
      return
    }

    const worker = await User.findById(req.user.userId)
    if (!worker) {
      res.status(404).json({ message: 'Worker not found' })
      return
    }

    if (worker.coin < 200) {
      res.status(400).json({ message: 'Minimum 200 coins required for withdrawal request' })
      return
    }

    if (withdrawal_coin > worker.coin) {
      res.status(400).json({ message: 'withdrawal_coin cannot exceed current coin balance' })
      return
    }

    const createdWithdrawal = await Withdrawal.create({
      worker_email: normalizedWorkerEmail,
      worker_name: worker_name.trim(),
      withdrawal_coin,
      withdrawal_amount,
      payment_system: payment_system.trim(),
      account_number: account_number.trim(),
      withdraw_date: withdraw_date.trim(),
      status: 'pending',
    })

    res.status(201).json(toPublicWithdrawal(createdWithdrawal))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create withdrawal request'
    res.status(500).json({ message })
  }
})

// Admin-only route:
// Returns all pending withdrawal requests.
withdrawalsRouter.get('/pending', verifyToken, verifyAdmin, async (_req: Request, res: Response) => {
  try {
    const pendingRequests = await Withdrawal.find({ status: 'pending' }).sort({ createdAt: -1 })
    res.status(200).json(pendingRequests.map((item) => toPublicWithdrawal(item)))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get pending withdrawals'
    res.status(500).json({ message })
  }
})

// Admin-only route:
// Approves one pending request, deducts coins from worker, and creates notification.
withdrawalsRouter.patch('/:id/approve', verifyToken, verifyAdmin, async (req: WithdrawalIdRequest, res: Response) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id)
    if (!withdrawal) {
      res.status(404).json({ message: 'Withdrawal request not found' })
      return
    }

    if (withdrawal.status !== 'pending') {
      res.status(400).json({ message: 'Only pending withdrawal requests can be approved' })
      return
    }

    const worker = await User.findOne({ email: withdrawal.worker_email })
    if (!worker) {
      res.status(404).json({ message: 'Worker not found' })
      return
    }

    if (worker.coin < withdrawal.withdrawal_coin) {
      res.status(400).json({ message: 'Worker does not have enough coins for this withdrawal approval' })
      return
    }

    worker.coin -= withdrawal.withdrawal_coin
    await worker.save()

    withdrawal.status = 'approved'
    await withdrawal.save()

    await Notification.create({
      message: `Your withdrawal request of ${withdrawal.withdrawal_coin} coins has been approved`,
      toEmail: withdrawal.worker_email,
      actionRoute: '/dashboard/withdrawals',
      createdAt: new Date().toISOString(),
    })

    res.status(200).json(toPublicWithdrawal(withdrawal))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to approve withdrawal'
    res.status(500).json({ message })
  }
})

export default withdrawalsRouter

