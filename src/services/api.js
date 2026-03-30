const API_BASE = '/api'

export async function sendMessage({ messages, systemPrompt, scenario }) {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, systemPrompt, scenario }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `API error: ${response.status}`)
  }

  return response.json()
}

export async function generateComprehensionQuestions({ passage, level = 'B1', questionCount = 3 }) {
  const response = await fetch(`${API_BASE}/comprehension/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passage, level, questionCount }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `API error: ${response.status}`)
  }

  return response.json()
}

export async function generateSentences({ difficulty, count = 10, exclude = [] }) {
  const systemPrompt = `Generate ${count} Italian sentences at difficulty level ${difficulty}/5.

Difficulty levels:
1 = Very short common phrases (3-6 words) - greetings, basic questions
2 = Short everyday sentences (6-12 words) - daily life, simple past/future
3 = Medium sentences with subjunctive, conditionals, complex grammar (10-18 words)
4 = Longer natural sentences with multiple clauses (15-25 words)
5 = Complex native-level sentences with formal/literary Italian (20-35 words)

IMPORTANT: Each sentence must be UNIQUE and different from these already-used sentences:
${exclude.slice(-20).map(s => `- "${s}"`).join('\n')}

Cover diverse topics: food, travel, work, family, health, culture, nature, technology, sports, politics, history, art, music, daily routines, emotions, weather, shopping, education.

Respond with ONLY valid JSON:
{"sentences": [{"text": "Italian sentence", "translation": "English translation", "difficulty": ${difficulty}}]}`

  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: `Generate ${count} unique Italian sentences at difficulty ${difficulty}.` }],
      systemPrompt,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate sentences')
  }

  const data = await response.json()
  try {
    const content = data.response || data.content || JSON.stringify(data)
    const parsed = typeof content === 'string' ? JSON.parse(content) : content
    return parsed.sentences || []
  } catch {
    return []
  }
}

export async function generateGrammarLesson({ category, userMistakes = [], level = 'B1' }) {
  const response = await fetch(`${API_BASE}/grammar/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, userMistakes, level }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `API error: ${response.status}`)
  }

  return response.json()
}
