import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { X, Trophy, ArrowRight, Home as HomeIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../../contexts/GameContext'
import { generateRecommendations } from '../../utils/recommendations'

export default function SessionWrapup({ sessionData, onContinue, onDone }) {
  const { state, addSessionHistory } = useGame()
  const navigate = useNavigate()

  const recommendation = useMemo(() => {
    const recs = generateRecommendations(state)
    return recs[0] || null
  }, [state])

  const handleDone = () => {
    addSessionHistory({
      date: new Date().toISOString(),
      ...sessionData,
    })
    if (onDone) onDone()
    else navigate('/')
  }

  const handleContinue = () => {
    addSessionHistory({
      date: new Date().toISOString(),
      ...sessionData,
    })
    if (onContinue) onContinue()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-navy-800 rounded-2xl border border-navy-700/50 p-6 max-w-md w-full shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-terracotta to-coral flex items-center justify-center">
            <Trophy size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-cream">Session Complete!</h2>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {sessionData.messagesSent != null && (
            <div className="bg-navy-900/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-cream">{sessionData.messagesSent}</p>
              <p className="text-xs text-navy-600">Messages</p>
            </div>
          )}
          {sessionData.xpEarned != null && (
            <div className="bg-navy-900/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-olive">+{sessionData.xpEarned}</p>
              <p className="text-xs text-navy-600">XP Earned</p>
            </div>
          )}
          {sessionData.accuracy != null && (
            <div className="bg-navy-900/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-cream">{sessionData.accuracy}%</p>
              <p className="text-xs text-navy-600">Accuracy</p>
            </div>
          )}
          {sessionData.wordsLearned != null && (
            <div className="bg-navy-900/50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-cream">{sessionData.wordsLearned}</p>
              <p className="text-xs text-navy-600">Words</p>
            </div>
          )}
        </div>

        {/* Recommendation */}
        {recommendation && (
          <div className="bg-navy-900/30 rounded-xl p-3 mb-6">
            <p className="text-xs text-navy-600 mb-1">Up next:</p>
            <p className="text-sm text-cream font-medium">{recommendation.icon} {recommendation.title}</p>
            <p className="text-xs text-navy-600">{recommendation.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDone}
            className="flex-1 py-2.5 px-4 rounded-xl bg-navy-700 text-cream hover:bg-navy-600 transition-colors text-sm font-medium inline-flex items-center justify-center gap-2"
          >
            <HomeIcon size={16} />
            Done
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 btn-primary text-sm inline-flex items-center justify-center gap-2"
          >
            Continue
            <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
