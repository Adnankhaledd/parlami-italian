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

export async function generateListeningPassage({ level = 'B1', topic = 'daily life', reviewWords = [], register = 'spoken' }) {
  const response = await fetch(`${API_BASE}/listening-passage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, topic, reviewWords, register }),
  })
  if (!response.ok) throw new Error('Failed to generate passage')
  return response.json()
}

export async function generateSentences({ difficulty, count = 8, exclude = [] }) {
  const response = await fetch(`${API_BASE}/generate-sentences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ difficulty, count, exclude }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate sentences')
  }

  const data = await response.json()
  return data.sentences || []
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
