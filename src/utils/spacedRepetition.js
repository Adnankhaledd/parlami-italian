// Leitner box system: 5 boxes with increasing intervals
const BOX_INTERVALS = [1, 2, 4, 7, 14] // days

export function initReviewItem(mistake) {
  const today = new Date().toISOString().split('T')[0]
  return {
    ...mistake,
    box: 0,
    nextReview: today,
    reviewCount: 0,
    lastReviewDate: null,
    type: 'mistake',
  }
}

export function calculateNextReview(item, quality) {
  const today = new Date().toISOString().split('T')[0]
  let newBox = item.box

  if (quality === 0) {
    // Wrong — back to box 0
    newBox = 0
  } else if (quality === 1) {
    // Hard — stay in same box
    newBox = item.box
  } else if (quality === 2) {
    // Easy — advance one box (max 4)
    newBox = Math.min(item.box + 1, BOX_INTERVALS.length - 1)
  }

  const intervalDays = BOX_INTERVALS[newBox]
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + intervalDays)

  return {
    ...item,
    box: newBox,
    nextReview: nextDate.toISOString().split('T')[0],
    reviewCount: item.reviewCount + 1,
    lastReviewDate: today,
  }
}

export function getItemsDueForReview(items) {
  const today = new Date().toISOString().split('T')[0]
  return items.filter((item) => item.nextReview <= today)
}

export function getNextReviewDate(items) {
  if (items.length === 0) return null
  const futureDates = items
    .map((item) => item.nextReview)
    .filter((d) => d > new Date().toISOString().split('T')[0])
    .sort()
  return futureDates[0] || null
}
