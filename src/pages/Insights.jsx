import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle, TrendingDown, Target, RotateCcw, ChevronDown, ChevronUp,
  Crosshair, MessageCircle,
} from 'lucide-react'
import { useGame } from '../contexts/GameContext'
import { mistakeCategories, getCategoryById } from '../data/mistakeCategories'

function WeaknessChart({ mistakeCounts }) {
  const total = Object.values(mistakeCounts).reduce((a, b) => a + b, 0)
  if (total === 0) return null

  // Sort by count descending
  const sorted = Object.entries(mistakeCounts)
    .map(([id, count]) => ({ ...getCategoryById(id), count }))
    .sort((a, b) => b.count - a.count)

  const maxCount = sorted[0]?.count || 1

  return (
    <div className="space-y-3">
      {sorted.map((cat) => {
        const pct = Math.round((cat.count / total) * 100)
        const barWidth = (cat.count / maxCount) * 100

        return (
          <div key={cat.id}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm">{cat.icon}</span>
                <span className="text-sm text-cream font-medium">{cat.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-navy-600">{cat.count} mistakes</span>
                <span className="text-xs font-semibold text-coral">{pct}%</span>
              </div>
            </div>
            <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  pct > 30 ? 'bg-red-400' : pct > 15 ? 'bg-coral' : 'bg-olive'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ duration: 0.8, delay: 0.1 }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MistakeList({ mistakes }) {
  const [expanded, setExpanded] = useState(false)
  const displayed = expanded ? mistakes : mistakes.slice(0, 8)

  return (
    <div className="space-y-2">
      {displayed.map((mistake, i) => {
        const cat = getCategoryById(mistake.category)
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-start gap-3 p-3 bg-navy-700/30 rounded-xl"
          >
            <span className="text-sm mt-0.5">{cat?.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-red-400 line-through text-sm">{mistake.original}</span>
                <span className="text-navy-600 text-xs">→</span>
                <span className="text-olive font-medium text-sm">{mistake.corrected}</span>
              </div>
              <p className="text-xs text-navy-600 leading-relaxed">{mistake.explanation}</p>
            </div>
            <div className="text-right shrink-0">
              {mistake.count > 1 && (
                <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-medium">
                  ×{mistake.count}
                </span>
              )}
            </div>
          </motion.div>
        )
      })}

      {mistakes.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm text-terracotta hover:text-terracotta-light transition-colors mx-auto"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? 'Show less' : `Show all ${mistakes.length} mistakes`}
        </button>
      )}
    </div>
  )
}

function TopWeaknesses({ mistakes, mistakeCounts }) {
  const total = Object.values(mistakeCounts).reduce((a, b) => a + b, 0)
  if (total === 0) return null

  // Find top 3 categories
  const topCategories = Object.entries(mistakeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id, count]) => ({
      ...getCategoryById(id),
      count,
      pct: Math.round((count / total) * 100),
    }))

  // Find most repeated mistakes
  const repeated = [...mistakes]
    .filter((m) => m.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Top weak categories */}
      <div className="card border-red-500/10">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown size={18} className="text-red-400" />
          <h3 className="text-sm font-semibold text-cream">Biggest Weaknesses</h3>
        </div>
        <div className="space-y-3">
          {topCategories.map((cat, i) => (
            <div key={cat.id} className="flex items-center gap-3">
              <span className="text-lg">{cat.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-cream">{cat.name}</p>
                <p className="text-xs text-navy-600">{cat.description}</p>
              </div>
              <span className="text-sm font-bold text-red-400">{cat.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Most repeated mistakes */}
      <div className="card border-coral/10">
        <div className="flex items-center gap-2 mb-4">
          <RotateCcw size={18} className="text-coral" />
          <h3 className="text-sm font-semibold text-cream">Recurring Mistakes</h3>
        </div>
        {repeated.length > 0 ? (
          <div className="space-y-3">
            {repeated.map((m, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="bg-coral/10 text-coral text-xs font-bold px-2 py-0.5 rounded-full mt-0.5">
                  ×{m.count}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 line-through text-sm">{m.original}</span>
                    <span className="text-navy-600 text-xs">→</span>
                    <span className="text-olive text-sm">{m.corrected}</span>
                  </div>
                  <p className="text-xs text-navy-600">{m.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-navy-600">No repeated mistakes yet. Keep practicing!</p>
        )}
      </div>
    </div>
  )
}

export default function Insights() {
  const { state } = useGame()
  const { mistakes, mistakeCounts } = state

  const hasMistakes = mistakes.length > 0

  // Sort mistakes by most recent first
  const sortedMistakes = useMemo(
    () => [...mistakes].sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen)),
    [mistakes]
  )

  // Build weakness summary for focus practice prompt
  const topWeakCategories = useMemo(() => {
    return Object.entries(mistakeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => getCategoryById(id))
  }, [mistakeCounts])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cream mb-1">Insights</h1>
        <p className="text-navy-600 text-sm">
          Your mistake patterns and areas to improve
        </p>
      </div>

      {!hasMistakes ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-navy-800 flex items-center justify-center">
            <Target size={32} className="text-navy-600" />
          </div>
          <h3 className="text-lg font-semibold text-cream mb-2">No mistakes tracked yet</h3>
          <p className="text-navy-600 text-sm mb-6 max-w-sm mx-auto">
            Start a conversation or roleplay scenario. Your mistakes will be tracked and analyzed here.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/practice" className="btn-primary">
              <MessageCircle size={16} className="inline mr-2" />
              Start Practicing
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Weaknesses */}
          <TopWeaknesses mistakes={mistakes} mistakeCounts={mistakeCounts} />

          {/* Focus Practice CTA */}
          {topWeakCategories.length > 0 && (
            <div className="card border-terracotta/20 bg-terracotta/5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-terracotta to-coral flex items-center justify-center shrink-0">
                  <Crosshair size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-cream mb-1">Focus Practice</h3>
                  <p className="text-sm text-navy-600 mb-3">
                    Practice a conversation that specifically targets your weak areas:
                    {' '}{topWeakCategories.map((c) => c.name).join(', ')}.
                  </p>
                  <Link
                    to="/focus-practice"
                    className="btn-primary inline-flex items-center gap-2 text-sm"
                  >
                    <Crosshair size={16} />
                    Start Focus Practice
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Weakness Breakdown Chart */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-coral" />
              <h3 className="text-sm font-semibold text-cream">Mistake Breakdown</h3>
              <span className="text-xs text-navy-600 ml-auto">{mistakes.length} total mistakes</span>
            </div>
            <WeaknessChart mistakeCounts={mistakeCounts} />
          </div>

          {/* Full Mistake History */}
          <div className="card">
            <h3 className="text-sm font-semibold text-cream mb-4">Recent Mistakes</h3>
            <MistakeList mistakes={sortedMistakes} />
          </div>
        </div>
      )}
    </motion.div>
  )
}
