import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, AlertCircle, BookOpen } from 'lucide-react'
import { useGame } from '../contexts/GameContext'
import { calculateCategoryStats, calculateTrends, MASTERY_COLORS } from '../utils/skillCalculation'

export default function SkillDashboard() {
  const { state } = useGame()

  const categoryStats = useMemo(
    () => calculateCategoryStats(state.mistakes, state.mistakeCounts, state.totalMessages),
    [state.mistakes, state.mistakeCounts, state.totalMessages]
  )

  const trends = useMemo(() => calculateTrends(state.mistakes), [state.mistakes])

  const totalMistakes = Object.values(state.mistakeCounts).reduce((sum, c) => sum + c, 0)
  const strongest = categoryStats.filter((c) => c.mistakeCount > 0).sort((a, b) => a.percentage - b.percentage)[0]
  const weakest = categoryStats.filter((c) => c.mistakeCount > 0).sort((a, b) => b.percentage - a.percentage)[0]
  const accuracy = state.totalMessages > 0
    ? Math.round((state.perfectMessages / state.totalMessages) * 100)
    : 0

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-6">
        <h1 className="text-2xl font-bold text-cream">Skill Breakdown</h1>
        <p className="text-navy-600">Your mastery across grammar categories</p>
      </motion.div>

      {/* Empty state */}
      {totalMistakes === 0 && (
        <motion.div variants={item} className="card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-navy-700/50 flex items-center justify-center">
            <AlertCircle size={32} className="text-navy-600" />
          </div>
          <h3 className="text-lg font-bold text-cream mb-2">No data yet</h3>
          <p className="text-navy-600 text-sm max-w-sm mx-auto">
            Start practicing Italian to see your skill breakdown. Your mistakes will be analyzed to show your strengths and weaknesses.
          </p>
        </motion.div>
      )}

      {totalMistakes > 0 && (
        <>
          {/* Overall summary */}
          <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card">
              <p className="text-2xl font-bold text-cream">{accuracy}%</p>
              <p className="text-xs text-navy-600">Overall Accuracy</p>
            </div>
            <div className="card">
              <p className="text-2xl font-bold text-cream">{totalMistakes}</p>
              <p className="text-xs text-navy-600">Total Mistakes</p>
            </div>
            <div className="card">
              <p className="text-sm font-bold text-olive">{strongest?.icon} {strongest?.name}</p>
              <p className="text-xs text-navy-600">Strongest Area</p>
            </div>
            <div className="card">
              <p className="text-sm font-bold text-red-400">{weakest?.icon} {weakest?.name}</p>
              <p className="text-xs text-navy-600">Needs Work</p>
            </div>
          </motion.div>

          {/* Radar chart */}
          <motion.div variants={item} className="card mb-8">
            <h2 className="text-sm font-semibold text-cream mb-4">Mastery Radar</h2>
            <div className="flex justify-center">
              <RadarChart stats={categoryStats} />
            </div>
          </motion.div>

          {/* Category cards */}
          <motion.div variants={item} className="grid md:grid-cols-2 gap-4">
            {categoryStats
              .filter((c) => c.id !== 'other')
              .sort((a, b) => b.mistakeCount - a.mistakeCount)
              .map((cat) => {
                const trend = trends[cat.id]
                const colors = MASTERY_COLORS[cat.mastery]
                const latestMistake = state.mistakes
                  .filter((m) => m.category === cat.id)
                  .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))[0]

                return (
                  <motion.div key={cat.id} variants={item} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.icon}</span>
                        <div>
                          <h3 className="text-sm font-semibold text-cream">{cat.name}</h3>
                          <p className="text-xs text-navy-600">{cat.mistakeCount} mistakes</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                          {cat.mastery}
                        </span>
                        {trend && (
                          <span className={`${
                            trend.trend === 'improving' ? 'text-olive' :
                            trend.trend === 'declining' ? 'text-red-400' : 'text-navy-600'
                          }`}>
                            {trend.trend === 'improving' ? <TrendingDown size={14} /> :
                             trend.trend === 'declining' ? <TrendingUp size={14} /> :
                             <Minus size={14} />}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mastery bar */}
                    <div className="w-full bg-navy-800 rounded-full h-1.5 mb-3">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          cat.mastery === 'Mastered' ? 'bg-olive' :
                          cat.mastery === 'Strong' ? 'bg-blue-400' :
                          cat.mastery === 'Developing' ? 'bg-coral' : 'bg-red-400'
                        }`}
                        style={{ width: `${cat.masteryScore}%` }}
                      />
                    </div>

                    {/* Latest mistake example */}
                    {latestMistake && (
                      <div className="text-xs bg-navy-800/50 rounded-lg p-2">
                        <span className="text-red-400/80 line-through">{latestMistake.original}</span>
                        <span className="text-navy-600 mx-1">→</span>
                        <span className="text-olive">{latestMistake.corrected}</span>
                      </div>
                    )}

                    {cat.mistakeCount > 0 && (
                      <Link to={`/grammar?category=${cat.id}`} className="text-xs text-terracotta hover:text-terracotta-light mt-2 inline-flex items-center gap-1">
                        <BookOpen size={12} /> Learn more
                      </Link>
                    )}
                  </motion.div>
                )
              })}
          </motion.div>
        </>
      )}
    </motion.div>
  )
}

function RadarChart({ stats }) {
  const filteredStats = stats.filter((s) => s.id !== 'other')
  const n = filteredStats.length
  const size = 200
  const cx = size / 2
  const cy = size / 2
  const maxR = 80

  // Draw concentric rings and axes
  const rings = [0.25, 0.5, 0.75, 1]
  const angleStep = (2 * Math.PI) / n

  const getPoint = (index, radius) => {
    const angle = angleStep * index - Math.PI / 2
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    }
  }

  const dataPoints = filteredStats.map((stat, i) => {
    const r = (stat.masteryScore / 100) * maxR
    return getPoint(i, r)
  })

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-64 h-64">
      {/* Concentric rings */}
      {rings.map((r) => (
        <polygon
          key={r}
          points={Array.from({ length: n }, (_, i) => {
            const p = getPoint(i, maxR * r)
            return `${p.x},${p.y}`
          }).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
      ))}

      {/* Axes */}
      {filteredStats.map((_, i) => {
        const p = getPoint(i, maxR)
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      })}

      {/* Data polygon */}
      <polygon points={dataPoints.map((p) => `${p.x},${p.y}`).join(' ')} fill="rgba(196,114,81,0.15)" stroke="rgba(196,114,81,0.6)" strokeWidth="1.5" />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#C47251" />
      ))}

      {/* Labels */}
      {filteredStats.map((stat, i) => {
        const labelR = maxR + 16
        const p = getPoint(i, labelR)
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="7"
          >
            {stat.icon}
          </text>
        )
      })}
    </svg>
  )
}
