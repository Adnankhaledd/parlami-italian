import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { category, userMistakes = [], level = 'B1' } = req.body

    if (!category) {
      return res.status(400).json({ error: 'Category is required' })
    }

    const mistakeExamples = userMistakes.slice(0, 5).map(
      (m) => `"${m.original}" → "${m.corrected}" (${m.explanation})`
    ).join('\n')

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: [{
        type: 'text',
        text: `You are an Italian grammar teacher creating a mini-lesson for a ${level} level learner.

IMPORTANT: Respond with valid JSON only. No text before or after.

Create a focused grammar lesson about the category "${category}".

${mistakeExamples ? `The learner has made these specific mistakes:\n${mistakeExamples}\n\nTailor the lesson to address these patterns.` : ''}

Respond with this JSON structure:
{
  "title": "Lesson title in English",
  "titleIt": "Lesson title in Italian",
  "explanation": "Clear 2-3 paragraph explanation in English of the grammar rule, when to use it, common pitfalls",
  "examples": [
    {
      "italian": "Italian sentence demonstrating the rule",
      "english": "English translation",
      "note": "Brief note highlighting the grammar point"
    }
  ],
  "practicePrompts": [
    "Italian sentence starter or prompt for the learner to practice with"
  ],
  "tip": "One practical tip for remembering this rule"
}

Rules:
- Give 4-6 examples progressing from simple to complex
- Give 3-4 practice prompts
- Be clear and encouraging
- Reference the learner's specific mistakes if provided`,
        cache_control: { type: 'ephemeral' },
      }],
      messages: [{ role: 'user', content: `Create a grammar lesson about: ${category}` }],
    })

    const rawText = response.content[0]?.text || ''
    let parsed
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
      else throw new Error('No JSON')
    } catch {
      parsed = { title: category, explanation: rawText, examples: [], practicePrompts: [], tip: '' }
    }

    res.json(parsed)
  } catch (err) {
    console.error('Grammar API error:', err.message)
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
