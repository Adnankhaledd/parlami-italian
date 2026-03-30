import { motion } from 'framer-motion'
import {
  Zap, Flame, MessageCircle, Target, BookOpen, Trophy, Star, Check, Lock,
} from 'lucide-react'
import { useGame } from '../contexts/GameContext'
import { getXPProgress } from '../data/levels'
import { achievements as allAchievements } from '../data/achievements'
import { scenarios, categories } from '../data/scenarios'

function StatsCard({ icon: Icon, value, label, color = 'terracotta' }) {
  const colorMap = {
    terracotta: 'bg-terracotta/10 text-terracotta',
    coral: 'bg-coral/10 text-coral',
    olive: 'bg-olive/10 text-olive',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold text-cream">{value}</p>
          <p className="text-xs text-navy-600">{label}</p>
        </div>
      </div>
    </div>
  )
}

function StreakCalendar({ practiceHistory, streak }) {
  // Generate last 84 days (12 weeks)
  const days = []
  const today = new Date()
  for (let i = 83; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const practiced = practiceHistory.some((h) => h?.date === dateStr)
    days.push({ date: dateStr, practiced, dayOfWeek: date.getDay() })
  }

  // Group into weeks
  const weeks = []
  let currentWeek = []
  days.forEach((day) => {
    currentWeek.push(day)
    if (day.dayOfWeek === 6) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })
  if (currentWeek.length > 0) weeks.push(currentWeek)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-cream">Practice Calendar</h3>
        <div className="flex items-center gap-1.5">
          <Flame size={14} className={streak > 0 ? 'text-coral fill-coral' : 'text-navy-600'} />
          <span className="text-sm font-bold text-cream">{streak} day streak</span>
        </div>
      </div>

      <div className="flex gap-1 justify-end">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                className={`w-3 h-3 rounded-sm ${
                  day.practiced
                    ? 'bg-olive'
                    : 'bg-navy-700/50'
                }`}
                title={day.date}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-xs text-navy-600">Less</span>
        <div className="w-3 h-3 rounded-sm bg-navy-700/50" />
        <div className="w-3 h-3 rounded-sm bg-olive/50" />
        <div className="w-3 h-3 rounded-sm bg-olive" />
        <span className="text-xs text-navy-600">More</span>
      </div>
    </div>
  )
}

function AchievementGrid({ unlockedAchievements }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-cream mb-4">
        Achievements ({unlockedAchievements.length}/{allAchievements.length})
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {allAchievements.map((achievement) => {
          const unlocked = unlockedAchievements.includes(achievement.id)
          const Icon = achievement.icon || Trophy

          return (
            <div
              key={achievement.id}
              className={`flex flex-col items-center text-center p-3 rounded-xl transition-all ${
                unlocked
                  ? 'bg-olive/10 border border-olive/20'
                  : 'bg-navy-700/20 border border-navy-700/30 opacity-40'
              }`}
              title={`${achievement.name} - ${achievement.description}`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                  unlocked
                    ? 'bg-gradient-to-br from-olive to-olive-dark'
                    : 'bg-navy-700'
                }`}
              >
                {unlocked ? (
                  <Icon size={18} className="text-white" />
                ) : (
                  <Lock size={14} className="text-navy-600" />
                )}
              </div>
              <p className={`text-xs font-medium ${unlocked ? 'text-cream' : 'text-navy-600'}`}>
                {achievement.name}
              </p>
              <p className="text-xs text-navy-600 mt-0.5 leading-tight">
                {achievement.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ScenarioProgress({ completedScenarios }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-cream mb-4">
        Scenario Progress ({completedScenarios.length}/{scenarios.length})
      </h3>
      <div className="space-y-3">
        {categories.map((cat) => {
          const catScenarios = scenarios.filter((s) => s.category === cat.id)
          const completed = catScenarios.filter((s) =>
            completedScenarios.includes(s.id)
          ).length
          const progress = catScenarios.length > 0 ? completed / catScenarios.length : 0

          return (
            <div key={cat.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-cream">
                  {cat.emoji} {cat.name}
                </span>
                <span className="text-xs text-navy-600">
                  {completed}/{catScenarios.length}
                </span>
              </div>
              <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-olive to-olive-dark rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Progress() {
  const { state } = useGame()
  const { current, next, progress } = getXPProgress(state.xp)
  const accuracy = state.totalMessages > 0
    ? Math.round((state.perfectMessages / state.totalMessages) * 100)
    : 0

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cream mb-1">Progress</h1>
        <p className="text-navy-600 text-sm">Track your Italian learning journey</p>
      </div>

      {/* Level Card */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-terracotta to-coral flex items-center justify-center text-white font-bold text-2xl">
            {current.level}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-cream">{current.name}</h2>
            <p className="text-sm text-navy-600">{current.nameEn}</p>
            {next && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-navy-600 mb-1">
                  <span>Level {current.level}</span>
                  <span>Level {next.level} ({next.name})</span>
                </div>
                <div className="h-3 bg-navy-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-terracotta to-coral rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard icon={Zap} value={state.xp.toLocaleString()} label="Total XP" color="terracotta" />
        <StatsCard icon={Flame} value={state.bestStreak} label="Best Streak" color="coral" />
        <StatsCard icon={Target} value={`${accuracy}%`} label="Accuracy" color="olive" />
        <StatsCard icon={BookOpen} value={state.vocabularyCount} label="Words Learned" color="blue" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <StatsCard icon={MessageCircle} value={state.totalMessages} label="Messages Sent" color="terracotta" />
        <StatsCard icon={Star} value={state.perfectMessages} label="Perfect Messages" color="olive" />
      </div>

      {/* Calendar & Scenarios side by side */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <StreakCalendar practiceHistory={state.practiceHistory} streak={state.streak} />
        <ScenarioProgress completedScenarios={state.completedScenarios} />
      </div>

      {/* Achievements */}
      <AchievementGrid unlockedAchievements={state.unlockedAchievements} />
    </motion.div>
  )
}
