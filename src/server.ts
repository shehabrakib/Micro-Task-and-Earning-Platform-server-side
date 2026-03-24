import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// middleware
app.use(cors({ origin: 'http://localhost:5173' }))  // your Vite frontend URL
app.use(express.json())

// health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!)
    console.log('MongoDB connected')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  } catch (err) {
    console.log('DB connection error:', err)
  }
}

startServer()