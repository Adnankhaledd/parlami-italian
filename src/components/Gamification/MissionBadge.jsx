import { motion, AnimatePresence } from 'framer-motion'
import { Target, Trophy } from 'lucide-react'
import { useGame } from '../../contexts/GameContext'
import { STRUCTURE_BY_ID } from '../../data/structures'

// Small inline badge showing today's mission progress.
// Pulses briefly when progress increases.
export default function MissionBadge({ compact = false }) {
  const { state } = useGame()
  const mission = state.currentMission

  if (!mission) return null
  const today = new Date().toISOString().split('T')[0]
  if (mission.date !== today) return null

  const struct = STRUCTURE_BY_ID[mission.structureId]
  if (!struct) return null

  const percent = Math.min(100, (mission.progress / mission.target) * 100)
  const remaining = Math.max(0, mission.target - mission.progress)

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
        mission.completed ? 'bg-olive/15 text-olive' : 'bg-terracotta/15 text-terracotta'
      }`}>
        {mission.completed ? <Trophy size={12} /> : <Target size={12} />}
        <span>{mission.progress}/{mission.target}</span>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mission.progress}
        initial={{ scale: 0.95, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${
          mission.completed
            ? 'bg-olive/10 border-olive/30'
            : 'bg-terracotta/5 border-terracotta/30'
        }`}
      >
        {mission.completed ? (
          <Trophy size={14} className="text-olive shrink-0" />
        ) : (
          <Target size={14} className="text-terracotta shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-xs font-medium text-cream truncate">{struct.label}</span>
            <span className="text-xs font-mono font-bold text-cream shrink-0">
              {mission.progress}/{mission.target}
            </span>
          </div>
          <div className="h-1 bg-navy-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={`h-full ${mission.completed ? 'bg-olive' : 'bg-terracotta'}`}
            />
          </div>
        </div>
        {!mission.completed && remaining > 0 && (
          <span className="text-[10px] text-navy-600 shrink-0">{remaining} left</span>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
