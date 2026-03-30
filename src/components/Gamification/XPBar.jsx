import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useGame } from '../../contexts/GameContext'
import { getXPProgress } from '../../data/levels'

export default function XPBar() {
  const { state } = useGame()
  const { current, next, progress, xpInLevel, xpNeeded } = getXPProgress(state.xp)

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-terracotta to-coral flex items-center justify-center">
          <Star size={16} className="text-white fill-white" />
        </div>
        <div className="hidden sm:block">
          <p className="text-xs text-navy-600 leading-none">Level {current.level}</p>
          <p className="text-sm font-semibold text-cream leading-tight">{current.name}</p>
        </div>
      </div>

      <div className="flex-1 max-w-md">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-navy-600">{state.xp.toLocaleString()} XP</span>
          {next && (
            <span className="text-xs text-navy-600">
              {xpInLevel}/{xpNeeded} to Lv.{next.level}
            </span>
          )}
        </div>
        <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-terracotta to-coral rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="text-right hidden sm:block shrink-0">
        <p className="text-xs text-navy-600">Today</p>
        <p className="text-sm font-semibold text-coral">+{state.todayXP || 0} XP</p>
      </div>
    </div>
  )
}
