import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target, Trophy, Sparkles, ArrowRight, RefreshCw, CheckCircle,
  TrendingUp, AlertCircle, BarChart3, Zap, Calendar
} from 'lucide-react'
import { useGame } from '../contexts/GameContext'
import { TRACKED_STRUCTURES, STRUCTURE_BY_ID, pickDailyMission } from '../data/structures'

export default function Missions() {
  const { state, setDailyMission, skipMission } = useGame()
  const today = new Date().toISOString().split('T')[0]

  const mission = state.currentMission
  const missionIsToday = mission && mission.date === today

  // Compute all-time usage totals for the avoidance dashboard
  const usageStats = useMemo(() => {
    const totals = {}
    const last7Days = {}
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
    for (const date of Object.keys(state.structureUsage || {})) {
      for (const [sid, count] of Object.entries(state.structureUsage[date] || {})) {
        totals[sid] = (totals[sid] || 0) + count
        if (date >= sevenDaysAgo) {
          last7Days[sid] = (last7Days[sid] || 0) + count
        }
      }
    }
    return { totals, last7Days }
  }, [state.structureUsage])

  const totalAllUses = Object.values(usageStats.totals).reduce((a, b) => a + b, 0)

  // Find top 3 most-avoided structures
  const mostAvoided = useMemo(() => {
    return [...TRACKED_STRUCTURES]
      .map(s => ({ ...s, uses: usageStats.totals[s.id] || 0 }))
      .filter(s => s.priority <= 2)
      .sort((a, b) => a.uses - b.uses)
      .slice(0, 3)
  }, [usageStats])

  const handleStartTodaysMission = () => {
    if (missionIsToday) return
    const picked = pickDailyMission(state.structureUsage, state.missionHistory || [])
    setDailyMission(picked.id, 5)
  }

  const handlePickStructure = (structureId) => {
    setDailyMission(structureId, 5)
  }

  const currentStructure = mission ? STRUCTURE_BY_ID[mission.structureId] : null

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Target size={20} className="text-terracotta" />
          <h1 className="text-2xl font-bold text-cream">Plateau Breaker</h1>
        </div>
        <p className="text-navy-600 text-sm">
          B1 → C1 happens by forcing the grammar you avoid. Pick a daily target structure and use it 5 times in conversation.
        </p>
      </div>

      {/* Today's mission */}
      {missionIsToday && currentStructure ? (
        <ActiveMissionCard mission={mission} structure={currentStructure} onSkip={skipMission} />
      ) : (
        <NoMissionCard onStart={handleStartTodaysMission} />
      )}

      {/* Most-avoided structures */}
      {totalAllUses > 5 && (
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-coral" />
            <h2 className="text-sm font-bold text-cream">Your most-avoided structures</h2>
          </div>
          <p className="text-xs text-navy-600 mb-4">
            These are the advanced structures you use the least. They're the ones holding you at B1.
          </p>
          <div className="space-y-2">
            {mostAvoided.map(s => (
              <button
                key={s.id}
                onClick={() => handlePickStructure(s.id)}
                className="w-full text-left px-4 py-3 rounded-xl bg-navy-800/40 border border-navy-700/50 hover:border-terracotta/50 hover:bg-terracotta/5 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-cream group-hover:text-terracotta">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-coral font-bold">{s.uses} uses</span>
                    <ArrowRight size={14} className="text-navy-600 group-hover:text-terracotta" />
                  </div>
                </div>
                <p className="text-xs text-navy-600 line-clamp-1">{s.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full structure tracker */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-olive" />
          <h2 className="text-sm font-bold text-cream">Structure usage tracker</h2>
        </div>
        <p className="text-xs text-navy-600 mb-4">
          How often you use each advanced structure across all conversations. Click any to set as today's mission.
        </p>
        <div className="space-y-1.5">
          {TRACKED_STRUCTURES.map(s => {
            const allTime = usageStats.totals[s.id] || 0
            const week = usageStats.last7Days[s.id] || 0
            const isActive = mission?.structureId === s.id && missionIsToday
            return (
              <button
                key={s.id}
                onClick={() => handlePickStructure(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-terracotta/10 border border-terracotta/40'
                    : 'bg-navy-800/30 border border-transparent hover:bg-navy-700/30'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-cream font-medium truncate">{s.label}</span>
                    {isActive && (
                      <span className="text-[10px] font-bold text-terracotta bg-terracotta/10 px-1.5 py-0.5 rounded">ACTIVE</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="text-navy-600">7d:</span>
                  <span className={`font-mono font-semibold w-6 text-right ${week === 0 ? 'text-coral/60' : 'text-cream'}`}>{week}</span>
                  <span className="text-navy-600">total:</span>
                  <span className={`font-mono font-semibold w-8 text-right ${allTime === 0 ? 'text-coral/60' : 'text-olive'}`}>{allTime}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mission history */}
      {(state.missionHistory || []).length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-blue-400" />
            <h2 className="text-sm font-bold text-cream">Recent missions</h2>
          </div>
          <div className="space-y-2">
            {[...(state.missionHistory || [])].reverse().slice(0, 7).map((m, i) => {
              const struct = STRUCTURE_BY_ID[m.structureId]
              if (!struct) return null
              const ratio = `${m.finalProgress}/${m.target}`
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-navy-600 w-20">
                      {m.date ? new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                    </span>
                    <span className="text-cream">{struct.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono ${m.completed ? 'text-olive' : 'text-coral'}`}>{ratio}</span>
                    {m.completed && <CheckCircle size={14} className="text-olive" />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function ActiveMissionCard({ mission, structure, onSkip }) {
  const [showSkip, setShowSkip] = useState(false)
  const remaining = Math.max(0, mission.target - mission.progress)
  const percent = Math.min(100, (mission.progress / mission.target) * 100)

  return (
    <motion.div
      initial={{ scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`card border-2 mb-6 ${mission.completed ? 'border-olive/50' : 'border-terracotta/40'}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-terracotta">Today's Mission</span>
            {mission.completed && (
              <span className="text-xs font-bold uppercase tracking-wider text-olive flex items-center gap-1">
                <Trophy size={12} /> Complete!
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-cream">{structure.label}</h2>
          <p className="text-sm text-navy-600 mt-1">{structure.description}</p>
        </div>
        <div className={`shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl ${
          mission.completed ? 'bg-olive/20 text-olive' : 'bg-terracotta/20 text-terracotta'
        }`}>
          {mission.progress}/{mission.target}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-navy-800 rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full ${mission.completed ? 'bg-gradient-to-r from-olive to-olive-dark' : 'bg-gradient-to-r from-terracotta to-coral'}`}
        />
      </div>

      {/* Examples */}
      <div className="bg-navy-800/40 rounded-lg p-3 mb-4">
        <p className="text-xs font-semibold text-navy-600 mb-2 uppercase tracking-wide">Examples to model</p>
        <ul className="space-y-1">
          {structure.examples.slice(0, 3).map((ex, i) => (
            <li key={i} className="text-sm text-cream">• {ex}</li>
          ))}
        </ul>
      </div>

      {/* Action */}
      <div className="space-y-2">
        <Link
          to="/missions/practice"
          className="btn-primary w-full inline-flex items-center justify-center gap-2 text-sm"
        >
          <Zap size={16} />
          {mission.completed ? 'Practice this structure again' : 'Start 5-question drill'}
        </Link>
        <div className="flex gap-2">
          <Link
            to="/daily-practice"
            className="flex-1 inline-flex items-center justify-center gap-2 text-xs py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-cream transition-colors"
          >
            Or use it in conversation
          </Link>
          <button
            onClick={() => setShowSkip(!showSkip)}
            className="px-3 rounded-xl bg-navy-800 hover:bg-navy-700 text-navy-600 hover:text-cream text-xs transition-colors"
            title="Pick a different structure"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showSkip && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-navy-700/30">
              <p className="text-xs text-navy-600 mb-2">Pick a different structure for today:</p>
              <div className="grid grid-cols-2 gap-1.5">
                {TRACKED_STRUCTURES.filter(s => s.id !== structure.id).slice(0, 6).map(s => (
                  <button
                    key={s.id}
                    onClick={() => { onSkip(s.id); setShowSkip(false) }}
                    className="text-left px-2 py-1.5 rounded-lg bg-navy-800/50 hover:bg-terracotta/10 text-xs text-cream transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function NoMissionCard({ onStart }) {
  return (
    <motion.div
      initial={{ scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="card text-center py-10 mb-6 border-terracotta/20 border-dashed border-2"
    >
      <Sparkles size={32} className="text-terracotta mx-auto mb-3" />
      <h2 className="text-lg font-bold text-cream mb-2">Pick today's mission</h2>
      <p className="text-sm text-navy-600 mb-5 max-w-md mx-auto">
        We'll auto-pick a structure you've been avoiding. Use it 5 times in any conversation today to complete the mission.
      </p>
      <button onClick={onStart} className="btn-primary inline-flex items-center gap-2">
        <Target size={16} /> Start today's mission
      </button>
    </motion.div>
  )
}
