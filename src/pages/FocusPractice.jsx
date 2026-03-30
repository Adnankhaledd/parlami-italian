import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Crosshair } from 'lucide-react'
import ChatWindow from '../components/Chat/ChatWindow'
import LevelUpModal from '../components/Gamification/LevelUpModal'
import AchievementUnlock from '../components/Gamification/AchievementUnlock'
import { useGame } from '../contexts/GameContext'
import { getCategoryById } from '../data/mistakeCategories'

export default function FocusPractice() {
  const { state, clearLevelUp, pendingAchievements, dismissAchievement } = useGame()
  const { mistakes, mistakeCounts } = state

  // Build a targeted system prompt based on weaknesses
  const focusPrompt = useMemo(() => {
    const topCategories = Object.entries(mistakeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id, count]) => ({ ...getCategoryById(id), count }))

    const recentMistakes = [...mistakes]
      .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
      .slice(0, 10)

    const repeatedMistakes = [...mistakes]
      .filter((m) => m.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const weaknessDescription = topCategories
      .map((c) => `${c.name} (${c.count} mistakes): ${c.description}`)
      .join('\n')

    const mistakeExamples = [...repeatedMistakes, ...recentMistakes]
      .slice(0, 8)
      .map((m) => `"${m.original}" → "${m.corrected}" (${m.explanation})`)
      .join('\n')

    return `You are a focused Italian language coach. The learner is at B1 level and you are specifically helping them work on their weak areas.

IMPORTANT: You must respond with valid JSON only. No text before or after the JSON.

THE LEARNER'S MAIN WEAKNESSES:
${weaknessDescription || 'General Italian practice'}

THEIR MOST COMMON MISTAKES:
${mistakeExamples || 'No specific mistakes recorded yet'}

YOUR STRATEGY:
- Steer the conversation to naturally require the grammar/vocabulary they struggle with
- For example, if they struggle with verb conjugation, ask questions that require different tenses
- If they struggle with gender agreement, use topics with lots of nouns and adjectives
- If they struggle with prepositions, discuss locations, times, and movements
- When they make a mistake in a weak area, give a clear, helpful correction
- Occasionally re-test areas they previously got wrong to see if they improved
- Celebrate when they get a previously weak area correct ("Great! You used the subjunctive perfectly this time!")

Respond with this exact JSON structure:
{
  "response": "Your Italian response (1-3 sentences, designed to practice their weak areas)",
  "corrections": [
    {
      "original": "what they said wrong",
      "corrected": "the correct Italian",
      "explanation": "Clear English explanation focusing on the rule",
      "category": "one of: verb_conjugation, gender_agreement, articles, prepositions, word_order, vocabulary, pronouns, subjunctive, spelling, other"
    }
  ],
  "vocabulary": ["new", "words", "used"],
  "encouragement": "Encouraging comment, especially noting improvement on weak areas"
}

Rules:
- Be warm and encouraging but more focused than free practice
- Keep responses short: 1-3 sentences
- Actively create situations where they need to use their weak grammar
- ALWAYS include the "category" field for each correction
- If they get a previously problematic area right, acknowledge it!
- Start by asking a question that requires their weakest grammar area`
  }, [mistakes, mistakeCounts])

  const topCategories = Object.entries(mistakeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id]) => getCategoryById(id))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-120px)] flex flex-col"
    >
      <div className="mb-4 flex items-start gap-4">
        <Link to="/insights" className="text-navy-600 hover:text-cream transition-colors mt-1">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Crosshair size={20} className="text-terracotta" />
            <h1 className="text-2xl font-bold text-cream">Focus Practice</h1>
          </div>
          <p className="text-navy-600 text-sm mt-1">
            Targeting: {topCategories.map((c) => `${c.icon} ${c.name}`).join(' · ') || 'General practice'}
          </p>
        </div>
      </div>

      <div className="flex-1 bg-navy-800/50 rounded-2xl border border-terracotta/20 overflow-hidden">
        <ChatWindow
          systemPrompt={focusPrompt}
          placeholder="Speak Italian... (Focus mode - targeting your weak areas)"
        />
      </div>

      <LevelUpModal level={state._levelUp} onClose={clearLevelUp} />
      {pendingAchievements.length > 0 && (
        <AchievementUnlock achievementId={pendingAchievements[0]} onDismiss={dismissAchievement} />
      )}
    </motion.div>
  )
}
