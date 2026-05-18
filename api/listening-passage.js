import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { level = 'B1', topic = 'daily life', reviewWords = [], register = 'spoken' } = req.body

  const reviewSection = reviewWords.length > 0
    ? `IMPORTANT: Naturally weave in 1-2 of these words the learner is still acquiring (they've seen them before but need more exposure): ${reviewWords.slice(0, 3).join(', ')}.`
    : ''

  const systemPrompt = `You are an expert Italian language teacher creating a listening comprehension exercise.

Generate a short Italian paragraph for level ${level} learners about the topic: "${topic}".

${reviewSection}

REGISTER — this is critical, the whole passage must match this style:
${getRegisterGuidance(register)}

The paragraph should:
- Be 80-120 words long
- Sound like a REAL Italian person talking — NOT a textbook exercise
- Contain exactly 4 NEW vocabulary words that fit the register above (for "street", at least 2 of the 4 vocab words should be actual slang/gergo terms)
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

function getRegisterGuidance(register) {
  const guides = {
    standard: `STANDARD ITALIAN — clean, neutral, well-formed. Like a news report, a magazine article, or a clearly-spoken podcast. Correct grammar, no slang, minimal filler. Still natural (not stiff textbook Italian), but polished and register-neutral. This is the Italian a learner should produce in writing or formal speech.`,

    spoken: `SPOKEN / CASUAL ITALIAN — the way friends actually talk to each other. Use:
- Filler words and discourse markers: allora, tipo, cioè, insomma, comunque, niente, boh, dai, magari, vabbè
- Contractions and elisions: 'sto, 'sta, 'na, c'ho, non c'ho, m'ha detto
- Common colloquial verbs/expressions: fregarsene, beccarsi, farcela, mettersi, andarsene
- Informal "tu", rhetorical questions, trailing thoughts
- Natural rhythm of real conversation — interruptions of thought, "eh", "no?"
Keep it understandable but unmistakably spoken, not written.`,

    street: `STREET ITALIAN / GERGO GIOVANILE — how it's REALLY spoken among young people and on the street. This is the main point of the exercise, so lean in hard:
- Heavy slang and gergo: raga, fra/frate/zio/bro, bella, beddu, scialla, sbatti (hassle), che sbatti, una cifra (a lot), spacca (it rocks), figata, che figata, flexare, ghostare, cringe, crush, mood, stare in palla, stare sbattuto, farsi le pare, paranoia, in para, bella zio, tranqui, ci sta, fomo, droppare, taggare
- Truncations and street rhythm: 'mbe, 'sti, 'na cosa, te lo giuro, oh raga, ao
- Intensifiers: troppo, da paura, assurdo, pazzesco, di brutto
- Light regional flavor (Roman / Milanese youth speech) is welcome, but keep it broadly understandable
- NO heavy profanity — keep it PG-13 (mild "che cavolo", "che palle" is fine)
Make it sound like a voice note a 20-year-old sends to their friends, not a lesson.`,
  }
  return guides[register] || guides.spoken
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
