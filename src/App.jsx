import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { GameProvider, useGame } from './contexts/GameContext'
import AppLayout from './components/Layout/AppLayout'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import Practice from './pages/Practice'
import Scenarios from './pages/Scenarios'
import ScenarioPlay from './pages/ScenarioPlay'
import Progress from './pages/Progress'
import Insights from './pages/Insights'
import FocusPractice from './pages/FocusPractice'
import Assessment from './pages/Assessment'
import Review from './pages/Review'
import ListeningPractice from './pages/ListeningPractice'
import SkillDashboard from './pages/SkillDashboard'
import DailyLesson from './pages/DailyLesson'
import GrammarLesson from './pages/GrammarLesson'
import Videos from './pages/Videos'
import QAPractice from './pages/QAPractice'
import WordListening from './pages/WordListening'

function AppContent() {
  const { state } = useGame()

  if (!state.onboardingComplete) {
    return <Onboarding />
  }

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/daily" element={<DailyLesson />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/qa" element={<QAPractice />} />
          <Route path="/words" element={<WordListening />} />
          <Route path="/listening" element={<ListeningPractice />} />
          <Route path="/scenarios" element={<Scenarios />} />
          <Route path="/scenarios/:id" element={<ScenarioPlay />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/grammar" element={<GrammarLesson />} />
          <Route path="/review" element={<Review />} />
          <Route path="/skills" element={<SkillDashboard />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/focus-practice" element={<FocusPractice />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/progress" element={<Progress />} />
        </Routes>
      </AnimatePresence>
    </AppLayout>
  )
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  )
}
