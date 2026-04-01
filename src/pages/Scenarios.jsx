import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Check, Lock } from 'lucide-react'
import { scenarios, categories } from '../data/scenarios'
import { useGame } from '../contexts/GameContext'

function DifficultyStars({ difficulty }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= difficulty ? 'text-coral fill-coral' : 'text-navy-600'}
        />
      ))}
    </div>
  )
}

const categoryColors = {
  daily: 'from-terracotta to-terracotta-dark',
  social: 'from-coral to-coral-dark',
  professional: 'from-olive to-olive-dark',
  travel: 'from-blue-400 to-blue-600',
  cultural: 'from-purple-400 to-purple-600',
}

const categoryBorderColors = {
  daily: 'border-terracotta/20 hover:border-terracotta/40',
  social: 'border-coral/20 hover:border-coral/40',
  professional: 'border-olive/20 hover:border-olive/40',
  travel: 'border-blue-400/20 hover:border-blue-400/40',
  cultural: 'border-purple-400/20 hover:border-purple-400/40',
}

export default function Scenarios() {
  const [activeCategory, setActiveCategory] = useState('all')
  const { state } = useGame()

  const filtered = activeCategory === 'all'
    ? scenarios
    : scenarios.filter((s) => s.category === activeCategory)

  // Sort: uncompleted first, then completed
  const uncompleted = filtered.filter(s => !state.completedScenarios.includes(s.id))
  const completed = filtered.filter(s => state.completedScenarios.includes(s.id))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cream mb-1">Scenarios</h1>
        <p className="text-navy-600 text-sm">Practice real Italian conversations in different situations</p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
            activeCategory === 'all'
              ? 'bg-terracotta text-white'
              : 'bg-navy-800 text-navy-600 hover:text-cream border border-navy-700/50'
          }`}
        >
          All ({scenarios.length})
        </button>
        {categories.map((cat) => {
          const count = scenarios.filter((s) => s.category === cat.id).length
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-terracotta text-white'
                  : 'bg-navy-800 text-navy-600 hover:text-cream border border-navy-700/50'
              }`}
            >
              {cat.emoji} {cat.name} ({count})
            </button>
          )
        })}
      </div>

      {/* Uncompleted Scenarios */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {uncompleted.map((scenario, i) => (
          <ScenarioCard key={scenario.id} scenario={scenario} state={state} index={i} />
        ))}
      </div>

      {/* Completed section */}
      {completed.length > 0 && (
        <>
          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-navy-700/50" />
            <span className="text-xs text-navy-600 font-medium flex items-center gap-1.5">
              <Check size={12} className="text-olive" /> Completed ({completed.length})
            </span>
            <div className="h-px flex-1 bg-navy-700/50" />
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 opacity-80">
            {completed.map((scenario, i) => (
              <ScenarioCard key={scenario.id} scenario={scenario} state={state} index={i} />
            ))}
          </div>
        </>
      )}
    </motion.div>
  )
}

function ScenarioCard({ scenario, state, index }) {
  const isCompleted = state.completedScenarios.includes(scenario.id)
  const attempts = state.scenarioHistory?.[scenario.id]?.attempts || 0
  const category = categories.find((c) => c.id === scenario.category)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/scenarios/${scenario.id}`}>
        <div className={`card-hover relative overflow-hidden group ${categoryBorderColors[scenario.category]}`}>
          {/* Completion badge */}
          {isCompleted && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-olive/10 text-olive text-xs font-medium px-2 py-1 rounded-lg">
              <Check size={12} />
              {attempts > 1 ? `${attempts}x` : 'Done'}
            </div>
          )}

          {/* Category tag */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-lg bg-gradient-to-r ${categoryColors[scenario.category]} text-white`}>
              {category?.emoji} {category?.name}
            </span>
            <DifficultyStars difficulty={scenario.difficulty} />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-cream mb-0.5 group-hover:text-terracotta transition-colors">
            {scenario.title}
          </h3>
          <p className="text-xs text-navy-600 mb-2">{scenario.titleEn}</p>

          {/* Description */}
          <p className="text-sm text-navy-600 mb-3 line-clamp-2">
            {scenario.description}
          </p>

          {/* Key vocabulary preview */}
          <div className="flex flex-wrap gap-1.5">
            {scenario.keyVocabulary.slice(0, 4).map((word) => (
              <span key={word} className="text-xs bg-navy-700/50 text-cream/60 px-2 py-0.5 rounded-md">
                {word}
              </span>
            ))}
            {scenario.keyVocabulary.length > 4 && (
              <span className="text-xs text-navy-600">+{scenario.keyVocabulary.length - 4} more</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
