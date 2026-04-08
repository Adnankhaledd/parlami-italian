import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { messages, systemPrompt } = req.body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' })
    }

    const apiMessages = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content || m.text || '',
    }))

    // Detect assessment/long-response prompts and allocate more tokens
    const isAssessment = /assessment|valutazione/i.test(systemPrompt || '')
    const maxTokens = isAssessment ? 4096 : 2048

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
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

    let parsed
    try {
      // Strip markdown code fences if present (```json ... ```)
      let cleaned = rawText
        .replace(/^\s*```(?:json)?\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()

      // Find the JSON object in the response
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found')
      }
    } catch (err) {
      console.warn('Chat JSON parse failed:', err.message, '— raw length:', rawText.length)
      // Fall back: try to extract at least the response text
      const responseMatch = rawText.match(/"response"\s*:\s*"([^"]*)"/)
      parsed = {
        response: responseMatch ? responseMatch[1] : rawText.slice(0, 500),
        corrections: [],
        vocabulary: [],
        encouragement: '',
      }
    }

    const result = {
      message: parsed.response || rawText,
      correctedSentence: parsed.correctedSentence || '',
      corrections: parsed.corrections || [],
      vocabulary: parsed.vocabulary || [],
      encouragement: parsed.encouragement || '',
    }

    if (parsed.assessment) {
      result.assessment = parsed.assessment
    }

    res.json(result)
  } catch (err) {
    console.error('Chat API error:', err.message)
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
