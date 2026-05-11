import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const DIFFICULTY_GUIDE = {
  1: 'Very short common phrases (3-6 words) — greetings, basic questions, simple statements',
  2: 'Short everyday sentences (6-12 words) — daily life, simple past/future, casual chat',
  3: 'Medium sentences (10-18 words) — opinions, descriptions, basic conditionals, common idioms',
  4: 'Longer natural sentences (15-25 words) — multiple clauses, subjunctive, conditional, abstract topics',
  5: 'Complex native-level sentences (20-35 words) — formal/literary Italian, advanced grammar, nuanced topics',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { difficulty = 2, count = 8, exclude = [] } = req.body

  // Sample 12 random topics each call so each batch is varied
  const TOPICS = [
    'food and meals', 'travel memories', 'work life', 'family stories', 'hobbies',
    'weather and seasons', 'sports', 'movies and TV', 'music', 'shopping',
    'health and fitness', 'technology', 'Italian culture', 'regional differences',
    'childhood memories', 'plans for the weekend', 'restaurants and bars',
    'transportation', 'fashion', 'books and reading', 'nature', 'pets',
    'languages', 'history', 'art', 'celebrations and holidays',
  ]
  const sampledTopics = [...TOPICS].sort(() => Math.random() - 0.5).slice(0, 12)

  // Use only the most recent excluded sentences (avoid huge prompt)
  const recentExclusions = exclude.slice(-30)

  const systemPrompt = `You are an Italian language tutor generating fresh, natural Italian sentences for a learner's listening/dictation practice.

Generate ${count} UNIQUE Italian sentences at difficulty level ${difficulty}/5: ${DIFFICULTY_GUIDE[difficulty] || DIFFICULTY_GUIDE[2]}

CRITICAL RULES:
- Sentences must sound like real spoken/written Italian a native would actually say — NOT textbook examples
- Use casual, varied phrasing with natural connectors (allora, comunque, quindi, però, anche se)
- Each sentence must cover a DIFFERENT topic from this rotation: ${sampledTopics.join(', ')}
- NO two sentences may be similar in structure or topic
- Avoid generic openers like "Mi piace..." or "Ho mangiato..." — be specific and varied

NEVER repeat or paraphrase these recently used sentences:
${recentExclusions.map((s) => `- ${s}`).join('\n')}

Respond with ONLY this JSON, no other text:
{"sentences":[{"text":"Italian sentence here","translation":"English translation","difficulty":${difficulty}}]}`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{
        role: 'user',
        content: `Generate ${count} fresh, varied Italian sentences at difficulty ${difficulty}.`,
      }],
    })

    const rawText = response.content[0]?.text || ''

    // Strip markdown fences if present
    const cleaned = rawText
      .replace(/^\s*```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('generate-sentences: no JSON found in response')
      return res.json({ sentences: [] })
    }

    let parsed
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch (err) {
      console.warn('generate-sentences: parse error', err.message)
      return res.json({ sentences: [] })
    }

    const sentences = (parsed.sentences || []).filter((s) => s.text && s.translation)
    res.json({ sentences })
  } catch (err) {
    console.error('generate-sentences error:', err.message)
    res.status(500).json({ error: err.message, sentences: [] })
  }
}
