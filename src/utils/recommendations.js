import { getItemsDueForReview } from './spacedRepetition'
import { mistakeCategories } from '../data/mistakeCategories'
import { scenarios } from '../data/scenarios'

export function generateRecommendations(state) {
  const recs = []

  // 0. Daily lesson
  const today = new Date().toISOString().split('T')[0]
  if (state.dailyLessonProgress?.date !== today || !state.dailyLessonProgress?.completed) {
    recs.push({
      type: 'daily',
      title: "Today's Daily Lesson",
      description: 'A guided session with review, dialogue, shadowing, and conversation.',
      action: { label: 'Start lesson', to: '/daily' },
      priority: 0,
      icon: '📖',
    })
  }

  // 1. Review items due
  const dueCount = getItemsDueForReview(state.reviewItems || []).length
  if (dueCount > 0) {
    recs.push({
      type: 'review',
      title: `${dueCount} items to review`,
      description: 'Keep your knowledge fresh with spaced repetition.',
      action: { label: 'Start review', to: '/review' },
      priority: 1,
      icon: '🔄',
    })
  }

  // 2. Weakness-based
  const sortedCategories = mistakeCategories
    .map((cat) => ({ ...cat, count: state.mistakeCounts?.[cat.id] || 0 }))
    .filter((c) => c.count >= 3 && c.id !== 'other')
    .sort((a, b) => b.count - a.count)

  if (sortedCategories.length > 0) {
    const weakest = sortedCategories[0]
    recs.push({
      type: 'weakness',
      title: `Practice ${weakest.name}`,
      description: `You've made ${weakest.count} ${weakest.name.toLowerCase()} mistakes. Targeted practice helps.`,
      action: { label: 'Focus practice', to: '/focus-practice' },
      priority: 2,
      icon: weakest.icon,
    })
  }

  // 3. Scenario suggestion
  const uncompleted = scenarios.find((s) => !state.completedScenarios?.includes(s.id))
  if (uncompleted) {
    recs.push({
      type: 'scenario',
      title: uncompleted.titleEn,
      description: uncompleted.description,
      action: { label: 'Play scenario', to: `/scenarios/${uncompleted.id}` },
      priority: 3,
      icon: '🎭',
    })
  }

  // 4. Assessment
  const assessmentAge = state.assessmentResult?.date
    ? (Date.now() - new Date(state.assessmentResult.date).getTime()) / 86400000
    : Infinity

  if (!state.assessmentResult || assessmentAge > 30) {
    recs.push({
      type: 'assessment',
      title: state.assessmentResult ? 'Retake Assessment' : 'Take Level Assessment',
      description: state.assessmentResult
        ? `Last assessed ${Math.round(assessmentAge)} days ago. See how you've improved.`
        : 'Find out your CEFR level with a 10-minute conversation.',
      action: { label: 'Start assessment', to: '/assessment' },
      priority: 4,
      icon: '📊',
    })
  }

  // 5. Listening practice
  if ((state.totalMessages || 0) > 10 && (state.dictationCount || 0) < 5) {
    recs.push({
      type: 'listening',
      title: 'Try Listening Practice',
      description: 'Train your ear with dictation exercises and audio conversations.',
      action: { label: 'Start listening', to: '/listening' },
      priority: 5,
      icon: '🎧',
    })
  }

  // 6. Grammar
  if (sortedCategories.length > 0 && sortedCategories[0].count >= 5) {
    const top = sortedCategories[0]
    recs.push({
      type: 'grammar',
      title: `Grammar: ${top.name}`,
      description: 'Learn the rules behind your most common mistakes.',
      action: { label: 'Start lesson', to: `/grammar?category=${top.id}` },
      priority: 2.5,
      icon: '📚',
    })
  }

  // 6.5 Videos
  if ((state.totalMessages || 0) > 20 && (state.videosWatched || 0) < 3) {
    recs.push({
      type: 'videos',
      title: 'Watch Italian Videos',
      description: 'Authentic Italian content with comprehension questions.',
      action: { label: 'Browse videos', to: '/videos' },
      priority: 5.5,
      icon: '📺',
    })
  }

  // 7. Streak
  if ((state.streak || 0) === 0 && (state.totalMessages || 0) > 0) {
    recs.push({
      type: 'streak',
      title: 'Start a Streak',
      description: 'Practice daily to build a streak and stay consistent.',
      action: { label: 'Practice now', to: '/practice' },
      priority: 6,
      icon: '🔥',
    })
  }

  return recs.sort((a, b) => a.priority - b.priority).slice(0, 3)
}
