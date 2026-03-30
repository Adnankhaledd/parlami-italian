// Normalize text for comparison (handle accents, case)
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function compareWords(userText, correctText) {
  const userWords = normalize(userText).split(' ').filter(Boolean)
  const correctWords = normalize(correctText).split(' ').filter(Boolean)

  const results = correctWords.map((word, i) => {
    const userWord = userWords[i] || ''
    const correct = userWord === word
    return { word, userWord, correct, index: i }
  })

  // Extra words typed by user
  if (userWords.length > correctWords.length) {
    for (let i = correctWords.length; i < userWords.length; i++) {
      results.push({ word: '', userWord: userWords[i], correct: false, index: i, extra: true })
    }
  }

  const correctCount = results.filter((r) => r.correct).length
  const accuracy = correctWords.length > 0 ? Math.round((correctCount / correctWords.length) * 100) : 0

  return { results, accuracy, correctCount, totalWords: correctWords.length }
}
