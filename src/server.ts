import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import { env } from './config/env'
import authRouter from './routes/auth.routes'
import submissionsRouter from './routes/submissions.routes'
import tasksRouter from './routes/tasks.routes'
import usersRouter from './routes/users.routes'

const app = express()

app.use(cors({ origin: env.clientOrigin }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/submissions', submissionsRouter)

const startServer = async (): Promise<void> => {
  try {
    await mongoose.connect(env.mongoUri)
    console.log('MongoDB connected')

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`)
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database connection error'
    console.error('DB connection error:', message)
    process.exit(1)
  }
}

startServer()
