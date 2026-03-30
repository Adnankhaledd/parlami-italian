import { useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Circle, Star, Trophy } from 'lucide-react'
import ChatWindow from '../components/Chat/ChatWindow'
import LevelUpModal from '../components/Gamification/LevelUpModal'
import AchievementUnlock from '../components/Gamification/AchievementUnlock'
import { getScenarioById, categories } from '../data/scenarios'
import { useGame } from '../contexts/GameContext'

export default function ScenarioPlay() {
  const { id } = useParams()
  const navigate = useNavigate()
  const scenario = getScenarioById(id)
  const { state, addXP, completeScenario, clearLevelUp, pendingAchievements, dismissAchievement } = useGame()
  const [turnCount, setTurnCount] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [objectivesCompleted, setObjectivesCompleted] = useState([])

  if (!scenario) {
    return (
      <div className="text-center py-20">
        <p className="text-navy-600 mb-4">Scenario not found</p>
        <Link to="/scenarios" className="btn-primary">Browse Scenarios</Link>
      </div>
    )
  }

  const category = categories.find((c) => c.id === scenario.category)
  const isAlreadyCompleted = state.completedScenarios.includes(scenario.id)

  const handleProgress = useCallback((messageCount) => {
    const turns = Math.floor(messageCount / 2) // user + AI = 1 turn
    setTurnCount(turns)

    // Auto-complete objectives based on progress
    const newObjectives = []
    scenario.objectives.forEach((obj, i) => {
      if (turns >= (i + 1) * Math.ceil(scenario.minTurns / scenario.objectives.length)) {
        if (!objectivesCompleted.includes(i)) {
          newObjectives.push(i)
        }
      }
    })

    if (newObjectives.length > 0) {
      setObjectivesCompleted((prev) => [...prev, ...newObjectives])
    }

    // Check completion
    if (turns >= scenario.minTurns && !completed) {
      setCompleted(true)
      completeScenario(scenario.id)
      addXP(100) // Scenario completion bonus
    }
  }, [scenario, completed, objectivesCompleted, completeScenario, addXP])

  const scenarioSystemPrompt = `${scenario.systemPrompt}

IMPORTANT: You must respond with valid JSON only. No text before or after the JSON.

Respond with this exact JSON structure:
{
  "response": "Your Italian response here (1-3 sentences, stay in character)",
  "corrections": [
    {
      "original": "what the user said wrong",
      "corrected": "the correct Italian",
      "explanation": "Brief English explanation",
      "category": "one of: verb_conjugation, gender_agreement, articles, prepositions, word_order, vocabulary, pronouns, subjunctive, spelling, other"
    }
  ],
  "vocabulary": ["new", "words", "used"],
  "encouragement": "Brief encouraging comment in English"
}

ALWAYS include the "category" field for each correction.
Key vocabulary for this scenario: ${scenario.keyVocabulary.join(', ')}
Try to naturally incorporate these words when appropriate.
If the user's Italian is perfect, return an empty corrections array.`

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-120px)] flex gap-6"
    >
      {/* Sidebar - Scenario Info */}
      <div className="hidden lg:block w-80 shrink-0 space-y-4">
        <Link
          to="/scenarios"
          className="flex items-center gap-2 text-navy-600 hover:text-cream transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back to Scenarios
        </Link>

        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{category?.emoji}</span>
            <div>
              <h2 className="text-lg font-bold text-cream">{scenario.title}</h2>
              <p className="text-xs text-navy-600">{scenario.titleEn}</p>
            </div>
          </div>

          <p className="text-sm text-navy-600 mb-4">{scenario.description}</p>

          {/* Difficulty */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-navy-600">Difficulty:</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={14}
                  className={i <= scenario.difficulty ? 'text-coral fill-coral' : 'text-navy-700'}
                />
              ))}
            </div>
          </div>

          {/* Objectives */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-navy-600 uppercase tracking-wider mb-2">
              Objectives
            </h4>
            <div className="space-y-2">
              {scenario.objectives.map((obj, i) => (
                <div key={i} className="flex items-start gap-2">
                  {objectivesCompleted.includes(i) ? (
                    <Check size={14} className="text-olive mt-0.5 shrink-0" />
                  ) : (
                    <Circle size={14} className="text-navy-700 mt-0.5 shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      objectivesCompleted.includes(i) ? 'text-olive' : 'text-navy-600'
                    }`}
                  >
                    {obj}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Vocabulary */}
          <div>
            <h4 className="text-xs font-semibold text-navy-600 uppercase tracking-wider mb-2">
              Key Vocabulary
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {scenario.keyVocabulary.map((word) => (
                <span
                  key={word}
                  className="text-xs bg-navy-700/50 text-cream/70 px-2 py-1 rounded-lg"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Completion status */}
        {(completed || isAlreadyCompleted) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card border-olive/30 bg-olive/5"
          >
            <div className="flex items-center gap-3">
              <Trophy size={24} className="text-olive" />
              <div>
                <p className="text-olive font-bold">Scenario Complete!</p>
                <p className="text-xs text-navy-600">+100 XP earned</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-navy-800/50 rounded-2xl border border-navy-700/30 overflow-hidden flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden border-b border-navy-700/30 px-4 py-3 flex items-center gap-3">
          <Link to="/scenarios" className="text-navy-600">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-sm font-bold text-cream">{scenario.title}</h2>
            <p className="text-xs text-navy-600">
              {objectivesCompleted.length}/{scenario.objectives.length} objectives
            </p>
          </div>
        </div>

        <ChatWindow
          systemPrompt={scenarioSystemPrompt}
          scenario={scenario}
          onScenarioProgress={handleProgress}
          placeholder={`Speak Italian... (${category?.name} scenario)`}
        />
      </div>

      <LevelUpModal level={state._levelUp} onClose={clearLevelUp} />
      {pendingAchievements.length > 0 && (
        <AchievementUnlock achievementId={pendingAchievements[0]} onDismiss={dismissAchievement} />
      )}
    </motion.div>
  )
}
