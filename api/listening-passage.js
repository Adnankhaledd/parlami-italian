import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { level = 'B1', topic = 'daily life', reviewWords = [] } = req.body

  const reviewSection = reviewWords.length > 0
    ? `IMPORTANT: Naturally weave in 1-2 of these words the learner is still acquiring (they've seen them before but need more exposure): ${reviewWords.slice(0, 3).join(', ')}.`
    : ''

  const systemPrompt = `You are an expert Italian language teacher creating a listening comprehension exercise.

Generate a short Italian paragraph for level ${level} learners about the topic: "${topic}".

${reviewSection}

The paragraph should:
- Be 80-120 words long
- Be natural, engaging, and culturally interesting
- Contain exactly 4 NEW vocabulary words that are useful and worth learning
- Be at the right difficulty for ${level}: ${getLevelGuidance(level)}

IMPORTANT: Respond with valid JSON only, no text before or after.

{
  "passage": "The full Italian paragraph here",
  "translation": "Full English translation of the paragraph",
  "comprehensionQuestion": {
    "question": "A question in English testing understanding of the passage",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Why this is correct, referencing the passage"
  },
  "vocabularyWords": [
    {
      "word": "the Italian word",
      "translation": "English meaning",
      "definition": "Clear English definition with usage context",
      "grammar": "e.g. noun (m), verb, adjective, adverb — include gender for nouns",
      "exampleSentence": "A NEW Italian example sentence (different from the passage)",
      "exampleTranslation": "English translation of the example"
    }
  ],
  "topic": "${topic}",
  "level": "${level}"
}`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: `Generate a listening comprehension passage about "${topic}" for ${level} level.` }],
    })

    const rawText = response.content[0]?.text || ''
    let parsed
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
      else throw new Error('No JSON')
    } catch {
      return res.status(500).json({ error: 'Failed to parse response' })
    }

    res.json(parsed)
  } catch (err) {
    console.error('Listening passage error:', err.message)
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
}

function getLevelGuidance(level) {
  const guides = {
    A1: 'very simple present tense, basic vocabulary, short sentences, topics like greetings, family, food basics',
    A2: 'simple past tense, everyday vocabulary, basic connectors, topics like daily routine, shopping, weather',
    B1: 'various tenses including imperfetto and passato prossimo, moderate vocabulary, conjunctions, topics like travel, work, opinions',
    B2: 'subjunctive, conditional, complex vocabulary, idiomatic expressions, topics like culture, current events, abstract ideas',
    C1: 'advanced grammar, nuanced vocabulary, literary language, complex topics like philosophy, politics, art',
    C2: 'native-level complexity, sophisticated vocabulary, all registers, any topic',
  }
  return guides[level] || guides['B1']
}
