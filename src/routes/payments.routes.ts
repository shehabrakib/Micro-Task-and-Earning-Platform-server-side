import { Router } from 'express'
import type { Request, Response } from 'express'
import { verifyBuyer, verifyToken } from '../middlewares/auth'
import { Payment } from '../models/Payment'
import { User } from '../models/User'
import type { CreatePaymentBody } from '../types/payment'

const paymentsRouter = Router()

const allowedPackages = {
  1: 10,
  10: 150,
  20: 500,
  35: 1000,
}

interface PublicPayment {
  _id: string
  buyer_email: string
  amount_usd: number
  coins: number
  payment_date: string
}

const toPublicPayment = (payment: {
  _id: unknown
  buyer_email: string
  amount_usd: number
  coins: number
  payment_date: string
}): PublicPayment => {
  return {
    _id: String(payment._id),
    buyer_email: payment.buyer_email,
    amount_usd: payment.amount_usd,
    coins: payment.coins,
    payment_date: payment.payment_date,
  }
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

const isPositiveNumber = (value: number): boolean => Number.isFinite(value) && value > 0
const getExpectedCoins = (amountUsd: number): number | null => {
  if (amountUsd === 1) return allowedPackages[1]
  if (amountUsd === 10) return allowedPackages[10]
  if (amountUsd === 20) return allowedPackages[20]
  if (amountUsd === 35) return allowedPackages[35]
  return null
}

type CreatePaymentRequest = Request<Record<string, never>, Record<string, never>, CreatePaymentBody>
type BuyerEmailRequest = Request<{ email: string }>

// Buyer-only route:
// Creates a payment entry and adds purchased coins to buyer.
// Only 4 packages are allowed:
// 1 -> 10, 10 -> 150, 20 -> 500, 35 -> 1000
paymentsRouter.post('/', verifyToken, verifyBuyer, async (req: CreatePaymentRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: user not found in request' })
      return
    }

    const { amount_usd, coins, buyer_email } = req.body

    if (!isPositiveNumber(amount_usd) || !isPositiveNumber(coins) || !buyer_email) {
      res.status(400).json({ message: 'amount_usd, coins, and buyer_email are required' })
      return
    }

    const normalizedBuyerEmail = normalizeEmail(buyer_email)
    if (normalizedBuyerEmail !== req.user.email) {
      res.status(403).json({ message: 'Forbidden: buyer_email must match authenticated user' })
      return
    }

    const expectedCoins = getExpectedCoins(amount_usd)
    if (!expectedCoins) {
      res.status(400).json({ message: 'Invalid amount_usd. Allowed values are 1, 10, 20, 35' })
      return
    }

    if (coins !== expectedCoins) {
      res.status(400).json({ message: `Invalid coins for amount_usd ${amount_usd}. Expected ${expectedCoins}` })
      return
    }

    const buyer = await User.findById(req.user.userId)
    if (!buyer) {
      res.status(404).json({ message: 'Buyer not found' })
      return
    }

    buyer.coin += coins
    await buyer.save()

    const createdPayment = await Payment.create({
      buyer_email: normalizedBuyerEmail,
      amount_usd,
      coins,
      payment_date: new Date().toISOString(),
    })

    res.status(201).json(toPublicPayment(createdPayment))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create payment'
    res.status(500).json({ message })
  }
})

// Buyer-only route:
// Returns payment history for logged-in buyer email.
paymentsRouter.get('/:email', verifyToken, verifyBuyer, async (req: BuyerEmailRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: user not found in request' })
      return
    }

    const requestedEmail = normalizeEmail(req.params.email)
    if (requestedEmail !== req.user.email) {
      res.status(403).json({ message: 'Forbidden: you can only view your own payment history' })
      return
    }

    const paymentHistory = await Payment.find({ buyer_email: requestedEmail }).sort({ payment_date: -1 })
    res.status(200).json(paymentHistory.map((payment) => toPublicPayment(payment)))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get payment history'
    res.status(500).json({ message })
  }
})

export default paymentsRouter
