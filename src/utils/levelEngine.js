/**
 * Computes the user's active CEFR level (A1-C2) from performance signals.
 * This replaces hardcoded "B1" across the app.
 *
 * Signals used:
 * - Assessment result (strongest signal, if recent)
 * - Mistake rate and categories
 * - Word library mastery
 * - Comprehension quiz accuracy
 * - Total practice volume
 */

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const LEVEL_SCORES = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 }

export function computeLevel(state) {
  const signals = []

  // 1. Assessment (strongest signal — weighted 3x if recent, 2x if older)
  if (state.assessmentResult?.level) {
    const assessDate = new Date(state.assessmentResult.date || 0)
    const daysSince = (Date.now() - assessDate) / (1000 * 60 * 60 * 24)
    const weight = daysSince < 7 ? 3 : daysSince < 30 ? 2 : 1
    signals.push({ score: LEVEL_SCORES[state.assessmentResult.level] || 3, weight })
  }

  // 2. Placement level (from onboarding)
  if (state.placementLevel) {
    signals.push({ score: LEVEL_SCORES[state.placementLevel] || 3, weight: 1 })
  }

  // 3. Mistake sophistication — what categories of mistakes do they make?
  //    Basic mistakes (articles, gender) = lower level
  //    Advanced mistakes (subjunctive, word order) = higher level (they're attempting harder structures)
  const mistakeCounts = state.mistakeCounts || {}
  const totalMistakes = Object.values(mistakeCounts).reduce((a, b) => a + b, 0)
  if (totalMistakes > 5) {
    const advancedMistakes = (mistakeCounts.subjunctive || 0) + (mistakeCounts.word_order || 0) + (mistakeCounts.pronouns || 0)
    const basicMistakes = (mistakeCounts.articles || 0) + (mistakeCounts.gender_agreement || 0) + (mistakeCounts.spelling || 0)
    const advancedRatio = advancedMistakes / totalMistakes

    // If they're making subjunctive mistakes, they're at least B1+ (attempting it)
    let mistakeLevel = 3 // B1 default
    if (advancedRatio > 0.4) mistakeLevel = 4 // B2 — attempting complex grammar
    else if (advancedRatio > 0.2) mistakeLevel = 3.5
    else if (basicMistakes / totalMistakes > 0.6) mistakeLevel = 2 // A2 — mostly basic errors

    signals.push({ score: mistakeLevel, weight: 1 })
  }

  // 4. Word library depth
  const wordLib = state.wordLibrary || []
  if (wordLib.length > 0) {
    const mastered = wordLib.filter(w => w.mastered || (w.correctQuizzes || 0) >= 5).length
    let vocabLevel = 2 // A2
    if (mastered >= 100) vocabLevel = 5 // C1
    else if (mastered >= 50) vocabLevel = 4 // B2
    else if (mastered >= 20) vocabLevel = 3 // B1
    else if (mastered >= 5) vocabLevel = 2.5

    signals.push({ score: vocabLevel, weight: 0.5 })
  }

  // 5. Practice volume (more practice = slight upward nudge)
  const totalMessages = state.totalMessages || 0
  if (totalMessages > 50) {
    const perfectRate = (state.perfectMessages || 0) / totalMessages
    if (perfectRate > 0.6 && totalMessages > 100) {
      signals.push({ score: 4, weight: 0.5 }) // consistently correct → nudge up
    }
  }

  // If no signals, default to B1
  if (signals.length === 0) return 'B1'

  // Weighted average
  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0)
  const weightedScore = signals.reduce((sum, s) => sum + s.score * s.weight, 0) / totalWeight

  // Map back to CEFR
  const roundedScore = Math.round(weightedScore)
  return LEVELS[Math.max(0, Math.min(5, roundedScore - 1))]
}

/**
 * Returns a human-readable description of what the level means.
 */
export function getLevelDescription(level) {
  const descriptions = {
    A1: 'Beginner — basic phrases and simple sentences',
    A2: 'Elementary — everyday expressions and simple conversations',
    B1: 'Intermediate — can discuss familiar topics and travel situations',
    B2: 'Upper intermediate — can converse fluently on most topics',
    C1: 'Advanced — can express complex ideas with nuance',
    C2: 'Mastery — near-native comprehension and expression',
  }
  return descriptions[level] || descriptions.B1
}
