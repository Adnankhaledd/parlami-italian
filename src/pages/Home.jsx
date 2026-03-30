import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Map, Flame, Zap, TrendingUp, BookOpen, CheckCircle, ArrowRight } from 'lucide-react'
import { useGame } from '../contexts/GameContext'
import { getXPProgress } from '../data/levels'
import { scenarios } from '../data/scenarios'
import { generateRecommendations } from '../utils/recommendations'
import LevelUpModal from '../components/Gamification/LevelUpModal'
import AchievementUnlock from '../components/Gamification/AchievementUnlock'

export default function Home() {
  const { state, clearLevelUp, pendingAchievements, dismissAchievement } = useGame()
  const recommendations = useMemo(() => generateRecommendations(state), [state])
  const { current } = getXPProgress(state.xp)

  // Find a suggested scenario (first uncompleted one)
  const suggested = scenarios.find((s) => !state.completedScenarios.includes(s.id))

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Welcome Header */}
      <motion.div variants={item} className="mb-6">
        <h1 className="text-3xl font-bold text-cream mb-2">
          Ciao! 👋
        </h1>
        <p className="text-navy-600 text-lg">
          {state.placementLevel
            ? `Level ${state.placementLevel} · Ready to practice your Italian today?`
            : 'Ready to practice your Italian today?'}
        </p>
      </motion.div>

      {/* Daily Lesson Card */}
      <motion.div variants={item} className="mb-8">
        {(() => {
          const today = new Date().toISOString().split('T')[0]
          const dailyDone = state.dailyLessonProgress?.date === today && state.dailyLessonProgress?.completed
          return (
            <Link to="/daily">
              <div className={`rounded-2xl p-5 border transition-all ${dailyDone ? 'bg-olive/5 border-olive/20' : 'bg-gradient-to-r from-terracotta/10 to-coral/10 border-terracotta/20 hover:border-terracotta/40'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${dailyDone ? 'bg-olive/20' : 'bg-terracotta/20'}`}>
                      {dailyDone ? <CheckCircle size={24} className="text-olive" /> : <BookOpen size={24} className="text-terracotta" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-cream">{dailyDone ? "Today's Lesson Complete" : "Start Today's Lesson"}</h3>
                      <p className="text-xs text-navy-600">{dailyDone ? 'Come back tomorrow for a new topic' : `${state.timeBudget || 15} min guided session · Review, dialogue, shadowing & chat`}</p>
                    </div>
                  </div>
                  {!dailyDone && <ArrowRight size={20} className="text-terracotta" />}
                </div>
              </div>
            </Link>
          )
        })()}
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center">
              <Zap size={20} className="text-terracotta" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cream">{state.xp.toLocaleString()}</p>
              <p className="text-xs text-navy-600">Total XP</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center">
              <Flame size={20} className={state.streak > 0 ? 'text-coral fill-coral' : 'text-coral'} />
            </div>
            <div>
              <p className="text-2xl font-bold text-cream">{state.streak}</p>
              <p className="text-xs text-navy-600">Day Streak</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-olive/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-olive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cream">
                {state.totalMessages > 0
                  ? Math.round((state.perfectMessages / state.totalMessages) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-navy-600">Accuracy</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <BookOpen size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cream">{state.vocabularyCount}</p>
              <p className="text-xs text-navy-600">Words Learned</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div variants={item} className="mb-8">
          <h2 className="text-lg font-bold text-cream mb-4">Recommended for You</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <Link key={rec.type} to={rec.action.to}>
                <div className="card-hover h-full">
                  <span className="text-2xl mb-2 block">{rec.icon}</span>
                  <h3 className="text-sm font-bold text-cream mb-1">{rec.title}</h3>
                  <p className="text-xs text-navy-600 mb-2">{rec.description}</p>
                  <p className="text-terracotta text-xs font-medium">{rec.action.label} →</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Cards */}
      <motion.div variants={item} className="grid md:grid-cols-2 gap-6 mb-8">
        <Link to="/practice">
          <div className="card-hover group cursor-pointer h-full">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-terracotta to-coral flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <MessageCircle size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-cream mb-1">Free Practice</h3>
                <p className="text-sm text-navy-600">
                  Have a natural conversation in Italian. Talk about anything - your day, interests, or ask questions.
                </p>
                <p className="text-terracotta text-sm font-medium mt-3">Start talking →</p>
              </div>
            </div>
          </div>
        </Link>

        <Link to={suggested ? `/scenarios/${suggested.id}` : '/scenarios'}>
          <div className="card-hover group cursor-pointer h-full">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-olive to-olive-dark flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Map size={28} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-cream mb-1">
                  {suggested ? 'Continue: ' + suggested.titleEn : 'Browse Scenarios'}
                </h3>
                <p className="text-sm text-navy-600">
                  {suggested
                    ? suggested.description
                    : 'Practice real-life situations like ordering coffee, job interviews, and more.'}
                </p>
                <p className="text-olive text-sm font-medium mt-3">
                  {suggested ? 'Play scenario →' : 'Browse all →'}
                </p>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Level info */}
      <motion.div variants={item} className="card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-terracotta to-coral flex items-center justify-center text-white font-bold text-xl">
            {current.level}
          </div>
          <div>
            <p className="text-cream font-bold text-lg">{current.name}</p>
            <p className="text-navy-600 text-sm">{current.nameEn} · Level {current.level}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-navy-600">{state.completedScenarios.length}/{scenarios.length} scenarios</p>
            <p className="text-sm text-navy-600">{state.unlockedAchievements.length} achievements</p>
          </div>
        </div>
      </motion.div>

      {/* Level Up Modal */}
      <LevelUpModal level={state._levelUp} onClose={clearLevelUp} />

      {/* Achievement Unlock */}
      {pendingAchievements.length > 0 && (
        <AchievementUnlock
          achievementId={pendingAchievements[0]}
          onDismiss={dismissAchievement}
        />
      )}
    </motion.div>
  )
}
