import { motion, AnimatePresence } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { achievements } from '../../data/achievements'

export default function AchievementUnlock({ achievementId, onDismiss }) {
  const achievement = achievements.find((a) => a.id === achievementId)
  if (!achievement) return null

  const Icon = achievement.icon || Trophy

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed top-20 right-6 z-50 cursor-pointer"
        onClick={onDismiss}
      >
        <div className="bg-navy-800 border border-olive/30 rounded-2xl p-4 pr-6 flex items-center gap-4 shadow-lg shadow-olive/10 max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-olive to-olive-dark flex items-center justify-center shrink-0">
            <Icon size={24} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-olive font-bold uppercase tracking-wider">Achievement Unlocked!</p>
            <p className="text-cream font-bold">{achievement.name}</p>
            <p className="text-sm text-navy-600">{achievement.description}</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
