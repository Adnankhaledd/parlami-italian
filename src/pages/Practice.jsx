import { motion } from 'framer-motion'
import ChatWindow from '../components/Chat/ChatWindow'
import LevelUpModal from '../components/Gamification/LevelUpModal'
import AchievementUnlock from '../components/Gamification/AchievementUnlock'
import { useGame } from '../contexts/GameContext'

export default function Practice() {
  const { state, clearLevelUp, pendingAchievements, dismissAchievement } = useGame()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-120px)] flex flex-col"
    >
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-cream">Free Practice</h1>
        <p className="text-navy-600 text-sm">Talk about anything in Italian. I'll correct your mistakes.</p>
      </div>

      <div className="flex-1 bg-navy-800/50 rounded-2xl border border-navy-700/30 overflow-hidden">
        <ChatWindow />
      </div>

      <LevelUpModal level={state._levelUp} onClose={clearLevelUp} />
      {pendingAchievements.length > 0 && (
        <AchievementUnlock achievementId={pendingAchievements[0]} onDismiss={dismissAchievement} />
      )}
    </motion.div>
  )
}
