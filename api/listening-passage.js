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
- Sound like a REAL Italian person talking or writing — NOT a textbook exercise
- Use natural, everyday Italian with casual expressions, filler words (tipo, cioè, insomma, allora), and conversational phrasing
- Feel like something you'd hear in a bar, at dinner, or in a podcast — not a language course
- Contain exactly 4 NEW vocabulary words that are useful in real conversations
- Be at the right difficulty for ${level}: ${getLevelGuidance(level)}

IMPORTANT: Respond with valid JSON only, no text before or after.

{
  "passage": "The full Italian paragraph here",
  "translation": "Full English translation of the paragraph",
  "comprehensionQuestions": [
    {
      "question": "A question in English testing understanding of the passage",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this is correct, referencing the passage"
    },
    {
      "question": "Second question about a detail or vocabulary meaning",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this is correct"
    },
    {
      "question": "Third question — inference or 'what does X mean in context'",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this is correct"
    }
  ],
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
}

RULES for comprehension questions:
- Question 1: main idea or general understanding
- Question 2: specific detail or fact from the passage
- Question 3: vocabulary in context or inference — what does a word/phrase mean based on context?
- Make wrong options plausible, not obviously wrong`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
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
    A1: 'very simple present tense, basic vocabulary, short sentences — like a friend explaining something simply. Topics: greetings, family, food, what they did today',
    A2: 'simple past tense, everyday vocabulary, basic connectors — like chatting with a neighbor. Topics: daily routine, shopping, weekend plans, weather complaints',
    B1: 'imperfetto and passato prossimo, moderate vocabulary, conjunctions — like telling a friend about a trip or a funny thing that happened. Topics: travel stories, work gossip, opinions on food/movies',
    B2: 'subjunctive, conditional, idiomatic expressions — like debating with friends at dinner. Topics: culture, current events, hypothetical scenarios, personal stories',
    C1: 'advanced grammar, nuanced vocabulary, subtle humor — like reading an Italian blog or podcast transcript. Topics: society, art, philosophy, regional differences',
    C2: 'native-level complexity, slang, wordplay, all registers — like an Italian editorial or stand-up comedy. Any topic, no simplification',
  }
  return guides[level] || guides['B1']
}
