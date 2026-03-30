import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, RotateCcw, Trophy } from 'lucide-react'
import { useGame } from '../contexts/GameContext'
import { getItemsDueForReview, getNextReviewDate } from '../utils/spacedRepetition'
import { getCategoryById } from '../data/mistakeCategories'
import { buildReviewCard } from '../utils/reviewHelpers'

export default function Review() {
  const { state, reviewItem, addXP } = useGame()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 })
  const [sessionDone, setSessionDone] = useState(false)

  const dueItems = useMemo(() => getItemsDueForReview(state.reviewItems), [state.reviewItems])

  const dueIndices = useMemo(() => {
    return state.reviewItems
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.nextReview <= new Date().toISOString().split('T')[0])
      .map(({ idx }) => idx)
  }, [state.reviewItems])

  const currentDueIndex = dueIndices[currentIndex]
  const currentItem = currentDueIndex !== undefined ? state.reviewItems[currentDueIndex] : null
  const nextReview = getNextReviewDate(state.reviewItems)

  // Build the card for current item
  const card = useMemo(() => {
    if (!currentItem) return null
    return buildReviewCard(currentItem)
  }, [currentItem])

  const category = currentItem ? getCategoryById(currentItem.category) : null

  const handleSelect = (optionIndex) => {
    if (showResult) return
    setSelected(optionIndex)
    setShowResult(true)

    const isCorrect = optionIndex === card.correctIndex
    setSessionStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }))

    // Auto-determine quality: correct = Easy(2), wrong = Wrong(0)
    const quality = isCorrect ? 2 : 0
    reviewItem(currentDueIndex, quality)

    // Auto-advance after delay
    setTimeout(() => {
      if (currentIndex + 1 >= dueIndices.length) {
        const finalCorrect = sessionStats.correct + (isCorrect ? 1 : 0)
        const finalTotal = sessionStats.total + 1
        const xp = finalCorrect * 5 + (finalCorrect === finalTotal ? 15 : 0)
        if (xp > 0) addXP(xp)
        setSessionDone(true)
      } else {
        setCurrentIndex((prev) => prev + 1)
        setSelected(null)
        setShowResult(false)
      }
    }, isCorrect ? 1200 : 2500) // Shorter delay for correct, longer for wrong to read explanation
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setSelected(null)
    setShowResult(false)
    setSessionStats({ correct: 0, total: 0 })
    setSessionDone(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cream">Review</h1>
        <p className="text-navy-600">
          {dueItems.length > 0
            ? `${dueItems.length} item${dueItems.length !== 1 ? 's' : ''} due for review`
            : 'Spaced repetition review'}
        </p>
      </div>

      {/* Empty state */}
      {dueItems.length === 0 && !sessionDone && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-olive/10 flex items-center justify-center">
            <CheckCircle size={32} className="text-olive" />
          </div>
          <h3 className="text-lg font-bold text-cream mb-2">All caught up!</h3>
          <p className="text-navy-600 text-sm max-w-sm mx-auto">
            {state.reviewItems.length === 0
              ? 'Start practicing to build your review deck. Mistakes you make will appear here for review.'
              : `You have ${state.reviewItems.length} items in your review deck. ${nextReview ? `Next review: ${new Date(nextReview).toLocaleDateString()}` : ''}`}
          </p>
        </div>
      )}

      {/* Session done */}
      {sessionDone && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-terracotta to-coral flex items-center justify-center">
            <Trophy size={32} className="text-white" />
          </div>
          <h3 className="text-lg font-bold text-cream mb-2">Review Complete!</h3>
          <div className="flex justify-center gap-8 mt-4 mb-6">
            <div>
              <p className="text-2xl font-bold text-cream">{sessionStats.correct}/{sessionStats.total}</p>
              <p className="text-xs text-navy-600">Correct</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-olive">
                +{sessionStats.correct * 5 + (sessionStats.correct === sessionStats.total ? 15 : 0)} XP
              </p>
              <p className="text-xs text-navy-600">Earned</p>
            </div>
          </div>
          <button onClick={handleRestart} className="btn-primary inline-flex items-center gap-2">
            <RotateCcw size={16} /> Review Again
          </button>
        </motion.div>
      )}

      {/* Review card */}
      {card && !sessionDone && (
        <div className="max-w-xl mx-auto">
          {/* Progress */}
          <div className="flex items-center justify-between mb-4 text-sm text-navy-600">
            <span>{currentIndex + 1} of {dueIndices.length}</span>
            <span className="flex items-center gap-1">
              {category?.icon} {category?.name}
            </span>
          </div>

          <div className="card">
            {/* Context sentence with highlighted mistake */}
            <div className="mb-5">
              <p className="text-xs text-navy-600 mb-2 uppercase tracking-wide">You said:</p>
              <p className="text-base text-cream leading-relaxed">
                {card.sentence.split(/\[|\]/).map((part, i) =>
                  i % 2 === 1 ? (
                    <span key={i} className="bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded font-medium">{part}</span>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </p>
            </div>

            {/* Hint */}
            <div className="bg-navy-800/50 rounded-xl p-3 mb-5">
              <p className="text-xs text-navy-600">{card.hint}</p>
            </div>

            {/* Multiple choice options */}
            <p className="text-xs text-navy-600 mb-3 uppercase tracking-wide">Which is correct?</p>
            <div className="space-y-2">
              {card.options.map((option, idx) => {
                let classes = 'w-full text-left px-4 py-3 rounded-xl text-sm transition-all border cursor-pointer '

                if (!showResult) {
                  classes += 'bg-navy-800 border-navy-700/50 text-cream hover:bg-navy-700/50 hover:border-navy-600'
                } else if (idx === card.correctIndex) {
                  classes += 'bg-olive/10 border-olive/30 text-olive font-medium'
                } else if (idx === selected) {
                  classes += 'bg-red-500/10 border-red-500/30 text-red-400'
                } else {
                  classes += 'bg-navy-800 border-navy-700/50 text-navy-600'
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    disabled={showResult}
                    className={classes}
                  >
                    <span className="font-medium mr-2 text-navy-600">{String.fromCharCode(65 + idx)}.</span>
                    {option}
                    {showResult && idx === card.correctIndex && (
                      <CheckCircle size={16} className="inline ml-2 text-olive" />
                    )}
                    {showResult && idx === selected && idx !== card.correctIndex && (
                      <XCircle size={16} className="inline ml-2 text-red-400" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Result feedback */}
            <AnimatePresence>
              {showResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 pt-4 border-t border-navy-700/30">
                  <div className={`flex items-center gap-2 mb-2 ${selected === card.correctIndex ? 'text-olive' : 'text-coral'}`}>
                    {selected === card.correctIndex ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span className="text-sm font-medium">
                      {selected === card.correctIndex ? 'Correct!' : `The answer is: ${card.correct}`}
                    </span>
                  </div>
                  {card.explanation && (
                    <p className="text-xs text-navy-600">{card.explanation}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  )
}
