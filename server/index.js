import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import chatRouter from './routes/chat.js'
import comprehensionRouter from './routes/comprehension.js'
import grammarRouter from './routes/grammar.js'

dotenv.config({ override: true })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api', chatRouter)
app.use('/api', comprehensionRouter)
app.use('/api', grammarRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!process.env.ANTHROPIC_API_KEY })
})

app.listen(PORT, () => {
  console.log(`Parlami server running on port ${PORT}`)
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('WARNING: ANTHROPIC_API_KEY not set. Create a .env file with your API key.')
  }
})
