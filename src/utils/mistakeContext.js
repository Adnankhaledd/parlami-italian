import { getCategoryById } from '../data/mistakeCategories'

/**
 * Builds a prompt block describing the user's mistake patterns.
 * Returns empty string for new users with no mistakes.
 */
export function buildMistakeContext(state) {
  const mistakes = state.mistakes || []
  const mistakeCounts = state.mistakeCounts || {}

  if (mistakes.length === 0) return ''

  // Top 3 weak categories
  const topCategories = Object.entries(mistakeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([catId, count]) => {
      const cat = getCategoryById(catId)
      return `- ${cat.name}: ${count} mistakes (${cat.description})`
    })

  // 5 most recent mistakes
  const recent = [...mistakes]
    .sort((a, b) => new Date(b.lastSeen || b.date) - new Date(a.lastSeen || a.date))
    .slice(0, 5)
    .map(m => `- "${m.original}" → "${m.corrected}" (${m.explanation || m.category})`)

  // 3 most repeated mistakes
  const repeated = [...mistakes]
    .filter(m => (m.count || 1) > 1)
    .sort((a, b) => (b.count || 1) - (a.count || 1))
    .slice(0, 3)
    .map(m => `- "${m.original}" → "${m.corrected}" (repeated ${m.count}x)`)

  let block = `\n\n--- LEARNER PROFILE ---
This learner has specific areas they struggle with. Pay attention to these patterns and gently correct them when they arise.

Weak areas:
${topCategories.join('\n')}

Recent mistakes:
${recent.join('\n')}`

  if (repeated.length > 0) {
    block += `\n\nRepeatedly confused:
${repeated.join('\n')}`
  }

  block += `\n\nWhen the learner makes a mistake in one of these areas, correct it clearly. When they get a previously weak area correct, briefly acknowledge it to build confidence.
--- END LEARNER PROFILE ---`

  return block
}
