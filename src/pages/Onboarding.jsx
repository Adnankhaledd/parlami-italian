import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plane, Briefcase, Home as HomeIcon, Heart, GraduationCap, Music, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import ChatWindow from '../components/Chat/ChatWindow'
import { useGame } from '../contexts/GameContext'

const GOALS = [
  { id: 'travel', label: 'Travel', icon: Plane, desc: 'Vacation & tourism in Italy' },
  { id: 'work', label: 'Work', icon: Briefcase, desc: 'Professional Italian' },
  { id: 'living', label: 'Living in Italy', icon: HomeIcon, desc: 'Daily life as a resident' },
  { id: 'dating', label: 'Relationships', icon: Heart, desc: 'Connect with Italian speakers' },
  { id: 'exam', label: 'Exam Prep', icon: GraduationCap, desc: 'CILS, CELI, or school exams' },
  { id: 'hobby', label: 'Hobby', icon: Music, desc: 'Culture, film, music, food' },
]

const TIME_OPTIONS = [5, 10, 15, 20, 30]

const PLACEMENT_PROMPT = `You are an Italian language placement evaluator. Your name is Parlami.

Your goal is to quickly determine the user's CEFR level (A0, A1, A2, B1, B2) through a short 5-turn conversation.

IMPORTANT: Respond with valid JSON only.

{
  "response": "Your Italian message (adapt difficulty based on their responses)",
  "corrections": [],
  "vocabulary": [],
  "encouragement": "",
  "assessment": null
}

Strategy:
- Turn 1: Start with a simple greeting and ask their name in Italian
- Turn 2: Ask about their daily routine (tests A1-A2)
- Turn 3: Ask them to describe something in the past tense (tests A2-B1)
- Turn 4: Ask their opinion on something with "perché" (tests B1)
- Turn 5: Ask a hypothetical question with subjunctive (tests B2)

After turn 5 (when messages array has 10 items), include an assessment:
{
  "response": "Your final Italian message",
  "corrections": [],
  "vocabulary": [],
  "encouragement": "Great job completing the placement!",
  "assessment": {
    "level": "B1",
    "sublevel": "B1.2",
    "breakdown": {"grammar": "B1", "vocabulary": "B1", "fluency": "A2", "comprehension": "B1"},
    "strengths": ["Good vocabulary range", "Clear communication"],
    "weaknesses": ["Past tense usage", "Subjunctive mood"],
    "recommendation": "Focus on passato prossimo vs imperfetto"
  }
}

Adjust your language complexity based on how well they respond. If they struggle with basic phrases, they're A0-A1. If they handle past tense well, they're at least A2-B1.`

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [goals, setGoals] = useState([])
  const [timeBudget, setTimeBudget] = useState(15)
  const [placementResult, setPlacementResult] = useState(null)
  const { setOnboarding, setAssessment } = useGame()

  const toggleGoal = (id) => {
    setGoals((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id])
  }

  const handleAssessment = (result) => {
    setPlacementResult(result)
    setAssessment(result)
    setStep(4)
  }

  const handleComplete = () => {
    setOnboarding({
      goals,
      timeBudget,
      placementLevel: placementResult?.level || 'A2',
    })
  }

  const canProceed = step === 0 || (step === 1 && goals.length > 0) || step === 2

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i <= step ? 'bg-terracotta' : 'bg-navy-700'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-terracotta to-coral flex items-center justify-center text-white font-bold text-3xl">
                P
              </div>
              <h1 className="text-3xl font-bold text-cream mb-3">Benvenuto a Parlami</h1>
              <p className="text-navy-600 text-lg mb-2">Your AI Italian conversation partner</p>
              <p className="text-navy-600 text-sm mb-8">
                Let&apos;s set up your personalized learning experience in 2 minutes.
              </p>
              <button onClick={() => setStep(1)} className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-3">
                Get Started <ArrowRight size={20} />
              </button>
            </motion.div>
          )}

          {/* Step 1: Goals */}
          {step === 1 && (
            <motion.div key="goals" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h2 className="text-2xl font-bold text-cream mb-2 text-center">What are your goals?</h2>
              <p className="text-navy-600 text-center mb-6">Select all that apply</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {GOALS.map(({ id, label, icon: Icon, desc }) => (
                  <button
                    key={id}
                    onClick={() => toggleGoal(id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      goals.includes(id)
                        ? 'bg-terracotta/10 border-terracotta/30 text-cream'
                        : 'bg-navy-800 border-navy-700/50 text-navy-600 hover:border-navy-600'
                    }`}
                  >
                    <Icon size={20} className={goals.includes(id) ? 'text-terracotta mb-2' : 'mb-2'} />
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs opacity-70">{desc}</p>
                    {goals.includes(id) && <Check size={14} className="text-terracotta mt-1" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="py-2.5 px-4 rounded-xl bg-navy-700 text-navy-600 hover:text-cream transition-colors">
                  <ArrowLeft size={18} />
                </button>
                <button onClick={() => setStep(2)} disabled={goals.length === 0} className="flex-1 btn-primary disabled:opacity-50 inline-flex items-center justify-center gap-2">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Time budget */}
          {step === 2 && (
            <motion.div key="time" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <h2 className="text-2xl font-bold text-cream mb-2">How much time per day?</h2>
              <p className="text-navy-600 mb-6">We&apos;ll build your daily plan around this</p>
              <div className="flex justify-center gap-3 mb-8">
                {TIME_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeBudget(t)}
                    className={`w-14 h-14 rounded-xl text-sm font-bold transition-all ${
                      timeBudget === t
                        ? 'bg-terracotta text-white scale-110'
                        : 'bg-navy-800 text-navy-600 hover:text-cream'
                    }`}
                  >
                    {t}<span className="text-xs block font-normal">min</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="py-2.5 px-4 rounded-xl bg-navy-700 text-navy-600 hover:text-cream transition-colors">
                  <ArrowLeft size={18} />
                </button>
                <button onClick={() => setStep(3)} className="flex-1 btn-primary inline-flex items-center justify-center gap-2">
                  Take Placement Test <ArrowRight size={16} />
                </button>
              </div>
              <button onClick={() => { setStep(4); setPlacementResult({ level: 'A2' }) }} className="text-xs text-navy-600 hover:text-cream mt-3 transition-colors">
                Skip placement test
              </button>
            </motion.div>
          )}

          {/* Step 3: Placement chat */}
          {step === 3 && (
            <motion.div key="placement" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <h2 className="text-xl font-bold text-cream mb-1 text-center">Quick Placement Test</h2>
              <p className="text-navy-600 text-center text-sm mb-4">Chat in Italian for 5 turns so we can find your level</p>
              <div className="h-[400px] bg-navy-800/50 rounded-2xl border border-navy-700/30 overflow-hidden">
                <ChatWindow
                  systemPrompt={PLACEMENT_PROMPT}
                  onAssessment={handleAssessment}
                  placeholder="Type in Italian..."
                />
              </div>
            </motion.div>
          )}

          {/* Step 4: Results */}
          {step === 4 && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-olive to-olive-dark flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{placementResult?.level || 'A2'}</span>
              </div>
              <h2 className="text-2xl font-bold text-cream mb-2">Your Level: {placementResult?.level || 'A2'}</h2>
              <p className="text-navy-600 mb-6">
                {placementResult?.recommendation || 'We\'ve set up your personalized learning path.'}
              </p>

              <div className="card text-left mb-6">
                <h3 className="text-sm font-bold text-cream mb-3">Your Daily Plan ({timeBudget} min)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-navy-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                    <span>{Math.max(3, Math.round(timeBudget * 0.15))} min — Review & warm-up</span>
                  </div>
                  <div className="flex items-center gap-2 text-navy-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-olive" />
                    <span>{Math.round(timeBudget * 0.25)} min — New dialogue & grammar</span>
                  </div>
                  <div className="flex items-center gap-2 text-navy-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-coral" />
                    <span>{Math.round(timeBudget * 0.2)} min — Shadowing practice</span>
                  </div>
                  <div className="flex items-center gap-2 text-navy-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span>{Math.round(timeBudget * 0.4)} min — Conversation practice</span>
                  </div>
                </div>
              </div>

              <button onClick={handleComplete} className="btn-primary w-full inline-flex items-center justify-center gap-2 text-lg py-3">
                Start Learning <ArrowRight size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
