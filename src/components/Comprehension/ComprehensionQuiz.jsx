import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { generateComprehensionQuestions } from '../../services/api'

export default function ComprehensionQuiz({ passage, level = 'B1', questionCount = 3, onComplete }) {
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    generateComprehensionQuestions({ passage, level, questionCount })
      .then((data) => {
        if (mounted && data.questions?.length > 0) {
          setQuestions(data.questions)
        } else if (mounted) {
          setError('Could not generate questions')
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [passage, level, questionCount])

  const currentQuestion = questions[currentIndex]

  const handleSelect = (idx) => {
    if (showResult) return
    setSelected(idx)
    setShowResult(true)
    if (idx === currentQuestion.correctAnswer) {
      setScore((s) => s + 1)
    }
  }

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setDone(true)
      if (onComplete) onComplete({ correct: score + (selected === currentQuestion?.correctAnswer ? 0 : 0), total: questions.length })
    } else {
      setCurrentIndex((i) => i + 1)
      setSelected(null)
      setShowResult(false)
    }
  }

  if (loading) {
    return (
      <div className="card text-center py-8">
        <Loader2 size={24} className="text-terracotta animate-spin mx-auto mb-2" />
        <p className="text-sm text-navy-600">Generating questions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-8">
        <AlertCircle size={24} className="text-coral mx-auto mb-2" />
        <p className="text-sm text-navy-600">{error}</p>
      </div>
    )
  }

  if (done) {
    const finalScore = score
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center py-8">
        <CheckCircle size={32} className="text-olive mx-auto mb-3" />
        <p className="text-lg font-bold text-cream mb-1">{finalScore}/{questions.length} Correct</p>
        <p className="text-sm text-navy-600">
          {finalScore === questions.length ? 'Perfect comprehension!' : finalScore >= questions.length / 2 ? 'Good understanding!' : 'Keep practicing your listening!'}
        </p>
      </motion.div>
    )
  }

  if (!currentQuestion) return null

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-navy-600">Question {currentIndex + 1} of {questions.length}</p>
        <p className="text-xs text-olive">{score} correct</p>
      </div>

      <p className="text-sm font-medium text-cream mb-4">{currentQuestion.question}</p>

      <div className="space-y-2 mb-4">
        {currentQuestion.options.map((option, idx) => {
          let classes = 'w-full text-left px-4 py-3 rounded-xl text-sm transition-colors border '
          if (!showResult) {
            classes += selected === idx
              ? 'bg-terracotta/10 border-terracotta/30 text-cream'
              : 'bg-navy-800 border-navy-700/50 text-cream hover:bg-navy-700/50'
          } else if (idx === currentQuestion.correctAnswer) {
            classes += 'bg-olive/10 border-olive/30 text-olive'
          } else if (idx === selected) {
            classes += 'bg-red-500/10 border-red-500/30 text-red-400'
          } else {
            classes += 'bg-navy-800 border-navy-700/50 text-navy-600'
          }

          return (
            <button key={idx} onClick={() => handleSelect(idx)} disabled={showResult} className={classes}>
              <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {showResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`flex items-center gap-2 mb-2 ${selected === currentQuestion.correctAnswer ? 'text-olive' : 'text-coral'}`}>
              {selected === currentQuestion.correctAnswer ? <CheckCircle size={16} /> : <XCircle size={16} />}
              <span className="text-sm font-medium">
                {selected === currentQuestion.correctAnswer ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            {currentQuestion.explanation && (
              <p className="text-xs text-navy-600 mb-3">{currentQuestion.explanation}</p>
            )}
            <button onClick={handleNext} className="btn-primary w-full text-sm">
              {currentIndex + 1 >= questions.length ? 'Finish' : 'Next Question'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
