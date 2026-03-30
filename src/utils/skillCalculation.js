import { mistakeCategories } from '../data/mistakeCategories'

export function calculateCategoryStats(mistakes, mistakeCounts, totalMessages) {
  const totalMistakes = Object.values(mistakeCounts).reduce((sum, c) => sum + c, 0)

  return mistakeCategories.map((cat) => {
    const count = mistakeCounts[cat.id] || 0
    const percentage = totalMistakes > 0 ? (count / totalMistakes) * 100 : 0
    const frequency = totalMessages > 0 ? (count / totalMessages) * 100 : 0

    return {
      ...cat,
      mistakeCount: count,
      percentage: Math.round(percentage),
      frequency: Math.round(frequency * 10) / 10,
      mastery: getMasteryLevel(percentage, frequency),
      masteryScore: getMasteryScore(percentage, frequency),
    }
  })
}

function getMasteryLevel(percentage, frequency) {
  if (percentage <= 3 && frequency <= 2) return 'Mastered'
  if (percentage <= 12 && frequency <= 8) return 'Strong'
  if (percentage <= 25 && frequency <= 15) return 'Developing'
  return 'Weak'
}

function getMasteryScore(percentage, frequency) {
  // 0–100 score where higher is better
  const pScore = Math.max(0, 100 - percentage * 3)
  const fScore = Math.max(0, 100 - frequency * 5)
  return Math.round((pScore + fScore) / 2)
}

export function calculateTrends(mistakes) {
  const now = new Date()
  const weekAgo = new Date(now - 7 * 86400000).toISOString()
  const twoWeeksAgo = new Date(now - 14 * 86400000).toISOString()

  const trends = {}

  for (const cat of mistakeCategories) {
    const recent = mistakes.filter(
      (m) => m.category === cat.id && m.lastSeen >= weekAgo
    ).length
    const previous = mistakes.filter(
      (m) => m.category === cat.id && m.lastSeen >= twoWeeksAgo && m.lastSeen < weekAgo
    ).length

    let trend = 'stable'
    if (recent < previous && previous > 0) trend = 'improving'
    else if (recent > previous) trend = 'declining'

    trends[cat.id] = { trend, recent, previous, delta: recent - previous }
  }

  return trends
}

export const MASTERY_COLORS = {
  Mastered: { bg: 'bg-olive/10', text: 'text-olive', border: 'border-olive/20' },
  Strong: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  Developing: { bg: 'bg-coral/10', text: 'text-coral', border: 'border-coral/20' },
  Weak: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
}
