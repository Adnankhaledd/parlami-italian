import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Loader2, AlertCircle, ArrowRight, Lightbulb } from 'lucide-react'
import { useGame } from '../contexts/GameContext'
import { generateGrammarLesson } from '../services/api'
import { mistakeCategories, getCategoryById } from '../data/mistakeCategories'

export default function GrammarLesson() {
  const [searchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')
  const { state, incrementGrammar } = useGame()

  const category = useMemo(() => {
    if (categoryParam) return categoryParam
    // Default to top mistake category
    const sorted = Object.entries(state.mistakeCounts || {})
      .filter(([id]) => id !== 'other')
      .sort(([, a], [, b]) => b - a)
    return sorted[0]?.[0] || 'verb_conjugation'
  }, [categoryParam, state.mistakeCounts])

  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(category)

  const categoryInfo = getCategoryById(selectedCategory)
  const userMistakes = (state.mistakes || []).filter((m) => m.category === selectedCategory).slice(0, 5)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    setLesson(null)

    generateGrammarLesson({
      category: selectedCategory,
      userMistakes,
      level: state.placementLevel || state.assessmentResult?.level || 'B1',
    })
      .then((data) => {
        if (mounted) {
          setLesson(data)
          incrementGrammar()
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [selectedCategory]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cream">Grammar Lesson</h1>
        <p className="text-navy-600">Learn the rules behind your mistakes</p>
      </div>

      {/* Category selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {mistakeCategories.filter((c) => c.id !== 'other').map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-terracotta/15 text-terracotta border border-terracotta/30'
                : 'bg-navy-800 text-navy-600 hover:text-cream border border-navy-700/50'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {loading && (
        <div className="card text-center py-12">
          <Loader2 size={24} className="text-terracotta animate-spin mx-auto mb-2" />
          <p className="text-sm text-navy-600">Generating your personalized lesson...</p>
        </div>
      )}

      {error && (
        <div className="card text-center py-12">
          <AlertCircle size={24} className="text-coral mx-auto mb-2" />
          <p className="text-sm text-navy-600">{error}</p>
        </div>
      )}

      {lesson && !loading && (
        <div className="max-w-3xl space-y-6">
          {/* Title */}
          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{categoryInfo?.icon}</span>
              <div>
                <h2 className="text-lg font-bold text-cream">{lesson.title}</h2>
                {lesson.titleIt && <p className="text-sm text-terracotta">{lesson.titleIt}</p>}
              </div>
            </div>
            <p className="text-sm text-cream/80 leading-relaxed whitespace-pre-line">{lesson.explanation}</p>
          </div>

          {/* Examples */}
          {lesson.examples?.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-bold text-cream mb-4">Examples</h3>
              <div className="space-y-3">
                {lesson.examples.map((ex, i) => (
                  <div key={i} className="bg-navy-800/50 rounded-xl p-3">
                    <p className="text-sm font-medium text-olive">{ex.italian}</p>
                    <p className="text-xs text-navy-600 mt-1">{ex.english}</p>
                    {ex.note && (
                      <p className="text-xs text-terracotta/80 mt-1 italic">{ex.note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tip */}
          {lesson.tip && (
            <div className="card bg-olive/5 border-olive/20">
              <div className="flex items-start gap-2">
                <Lightbulb size={16} className="text-olive shrink-0 mt-0.5" />
                <p className="text-sm text-cream/80">{lesson.tip}</p>
              </div>
            </div>
          )}

          {/* Practice prompts */}
          {lesson.practicePrompts?.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-bold text-cream mb-3">Try these in conversation:</h3>
              <ul className="space-y-2 mb-4">
                {lesson.practicePrompts.map((prompt, i) => (
                  <li key={i} className="text-sm text-cream/70 flex items-start gap-2">
                    <span className="text-terracotta">•</span>
                    {prompt}
                  </li>
                ))}
              </ul>
              <Link to="/focus-practice" className="btn-primary inline-flex items-center gap-2 text-sm">
                Practice This <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
