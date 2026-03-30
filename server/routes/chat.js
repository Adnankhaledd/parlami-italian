import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()

let client = null
function getClient() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured. Add it to server/.env')
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return client
}

router.post('/chat', async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' })
    }

    const anthropic = getClient()

    // Format messages for Claude API
    const apiMessages = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content || m.text || '',
    }))

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: systemPrompt || 'You are a helpful Italian language tutor.',
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: apiMessages,
    })

    const rawText = response.content[0]?.text || ''

    // Try to parse JSON from response
    let parsed
    try {
      // Find JSON in the response (handle cases where model adds text around it)
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found')
      }
    } catch {
      // If parsing fails, return the raw text as the message
      parsed = {
        response: rawText,
        corrections: [],
        vocabulary: [],
        encouragement: '',
      }
    }

    const result = {
      message: parsed.response || rawText,
      corrections: parsed.corrections || [],
      vocabulary: parsed.vocabulary || [],
      encouragement: parsed.encouragement || '',
    }

    // Pass through assessment data if present
    if (parsed.assessment) {
      result.assessment = parsed.assessment
    }

    res.json(result)
  } catch (err) {
    console.error('Chat API error:', err.message)

    if (err.message.includes('ANTHROPIC_API_KEY')) {
      return res.status(503).json({
        error: 'API key not configured. Create server/.env with ANTHROPIC_API_KEY=your-key',
      })
    }

    res.status(500).json({
      error: err.message || 'Internal server error',
    })
  }
})

export default router
