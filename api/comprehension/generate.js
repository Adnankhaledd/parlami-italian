import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { passage, level = 'B1', questionCount = 3 } = req.body

    if (!passage) {
      return res.status(400).json({ error: 'Passage is required' })
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: [{
        type: 'text',
        text: `You are an Italian language comprehension test generator for ${level} level learners.

IMPORTANT: Respond with valid JSON only. No text before or after.

Generate ${questionCount} comprehension questions about the given Italian passage.

Respond with this JSON structure:
{
  "questions": [
    {
      "question": "Question in English about the Italian passage",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this answer is correct"
    }
  ]
}

Rules:
- Questions should test understanding of the Italian text
- Options should be in English
- Mix question types: main idea, details, vocabulary meaning, inference
- correctAnswer is the 0-based index of the correct option`,
        cache_control: { type: 'ephemeral' },
      }],
      messages: [{ role: 'user', content: `Generate comprehension questions for this Italian passage:\n\n"${passage}"` }],
    })

    const rawText = response.content[0]?.text || ''
    let parsed
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
      else throw new Error('No JSON')
    } catch {
      parsed = { questions: [] }
    }

    res.json(parsed)
  } catch (err) {
    console.error('Comprehension API error:', err.message)
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
