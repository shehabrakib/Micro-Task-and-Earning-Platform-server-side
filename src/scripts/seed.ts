import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import { env } from '../config/env'
import { Notification } from '../models/Notification'
import { Payment } from '../models/Payment'
import { Submission } from '../models/Submission'
import { Task } from '../models/Task'
import { User } from '../models/User'
import { Withdrawal } from '../models/Withdrawal'

const shouldReset = process.argv.includes('--reset')

const nowIso = (): string => new Date().toISOString()

const seedDatabase = async (): Promise<void> => {
  await mongoose.connect(env.mongoUri)
  console.log('MongoDB connected for seeding')

  try {
    const currentUsers = await User.countDocuments()
    if (currentUsers > 0 && !shouldReset) {
      console.log('Seed skipped: database already has users. Use "bun run seed:reset" to replace data.')
      return
    }

    if (shouldReset) {
      await Notification.deleteMany({})
      await Payment.deleteMany({})
      await Submission.deleteMany({})
      await Withdrawal.deleteMany({})
      await Task.deleteMany({})
      await User.deleteMany({})
      console.log('Existing data cleared')
    }

    const defaultPassword = 'password123'
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    const users = await User.insertMany([
      {
        name: 'Platform Admin',
        email: 'admin@microtask.dev',
        password: hashedPassword,
        photoURL: 'https://i.pravatar.cc/150?img=3',
        role: 'admin',
        coin: 0,
      },
      {
        name: 'Buyer One',
        email: 'buyer1@microtask.dev',
        password: hashedPassword,
        photoURL: 'https://i.pravatar.cc/150?img=5',
        role: 'buyer',
        coin: 450,
      },
      {
        name: 'Worker One',
        email: 'worker1@microtask.dev',
        password: hashedPassword,
        photoURL: 'https://i.pravatar.cc/150?img=7',
        role: 'worker',
        coin: 260,
      },
      {
        name: 'Worker Two',
        email: 'worker2@microtask.dev',
        password: hashedPassword,
        photoURL: 'https://i.pravatar.cc/150?img=11',
        role: 'worker',
        coin: 180,
      },
    ])

    const buyer = users.find((user) => user.email === 'buyer1@microtask.dev')
    const workerOne = users.find((user) => user.email === 'worker1@microtask.dev')
    const workerTwo = users.find((user) => user.email === 'worker2@microtask.dev')

    if (!buyer || !workerOne || !workerTwo) {
      throw new Error('Failed to create required seed users')
    }

    const tasks = await Task.insertMany([
      {
        task_title: 'App Landing Page Screenshot',
        task_detail: 'Visit the app landing page and capture full-page screenshot.',
        required_workers: 4,
        payable_amount: 10,
        completion_date: '2026-04-10',
        submission_info: 'Upload screenshot link from image host.',
        task_image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f',
        buyer_email: buyer.email,
        buyer_name: buyer.name,
      },
      {
        task_title: 'Signup Flow Video Check',
        task_detail: 'Record short video while testing signup and login flow.',
        required_workers: 2,
        payable_amount: 15,
        completion_date: '2026-04-15',
        submission_info: 'Submit video URL and mention browser used.',
        task_image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
        buyer_email: buyer.email,
        buyer_name: buyer.name,
      },
    ])

    const firstTask = tasks[0]
    const secondTask = tasks[1]

    if (!firstTask || !secondTask) {
      throw new Error('Failed to create required seed tasks')
    }

    await Submission.insertMany([
      {
        task_id: String(firstTask._id),
        task_title: firstTask.task_title,
        payable_amount: firstTask.payable_amount,
        worker_email: workerOne.email,
        worker_name: workerOne.name,
        buyer_name: buyer.name,
        buyer_email: buyer.email,
        submission_details: 'https://example.com/submission/worker1-task1',
        current_date: nowIso(),
        status: 'pending',
      },
      {
        task_id: String(secondTask._id),
        task_title: secondTask.task_title,
        payable_amount: secondTask.payable_amount,
        worker_email: workerTwo.email,
        worker_name: workerTwo.name,
        buyer_name: buyer.name,
        buyer_email: buyer.email,
        submission_details: 'https://example.com/submission/worker2-task2',
        current_date: nowIso(),
        status: 'approved',
      },
    ])

    await Withdrawal.insertMany([
      {
        worker_email: workerOne.email,
        worker_name: workerOne.name,
        withdrawal_coin: 200,
        withdrawal_amount: 10,
        payment_system: 'bkash',
        account_number: '01700000001',
        withdraw_date: nowIso(),
        status: 'pending',
      },
      {
        worker_email: workerTwo.email,
        worker_name: workerTwo.name,
        withdrawal_coin: 220,
        withdrawal_amount: 11,
        payment_system: 'nagad',
        account_number: '01800000002',
        withdraw_date: nowIso(),
        status: 'approved',
      },
    ])

    await Payment.insertMany([
      {
        buyer_email: buyer.email,
        amount_usd: 10,
        coins: 150,
        payment_date: nowIso(),
      },
      {
        buyer_email: buyer.email,
        amount_usd: 20,
        coins: 500,
        payment_date: nowIso(),
      },
    ])

    await Notification.insertMany([
      {
        message: 'New submission received for your task',
        toEmail: buyer.email,
        actionRoute: '/dashboard/buyer-home',
        createdAt: nowIso(),
      },
      {
        message: 'Your submission was approved',
        toEmail: workerTwo.email,
        actionRoute: '/dashboard/my-submissions',
        createdAt: nowIso(),
      },
      {
        message: 'Your withdrawal request has been approved',
        toEmail: workerTwo.email,
        actionRoute: '/dashboard/withdrawals',
        createdAt: nowIso(),
      },
    ])

    console.log('Seed completed successfully')
    console.log('Default login password for seeded users: password123')
  } finally {
    await mongoose.disconnect()
    console.log('MongoDB disconnected')
  }
}

void seedDatabase()

