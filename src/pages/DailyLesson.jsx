import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, RefreshCw, MessageCircle, Headphones, Mic, CheckCircle, ArrowRight, Play, Trophy, Volume2 } from 'lucide-react'
import { useGame } from '../contexts/GameContext'
import { getItemsDueForReview } from '../utils/spacedRepetition'
import { getCategoryById } from '../data/mistakeCategories'
import { dailyTopics } from '../data/dailyTopics'
import { sendMessage } from '../services/api'
import ChatWindow from '../components/Chat/ChatWindow'
import ShadowingExercise from '../components/Shadowing/ShadowingExercise'
import ComprehensionQuiz from '../components/Comprehension/ComprehensionQuiz'
import useSpeechSynthesis from '../hooks/useSpeechSynthesis'

const STEPS = [
  { icon: RefreshCw, label: 'Review', color: 'terracotta' },
  { icon: BookOpen, label: 'Dialogue', color: 'olive' },
  { icon: Mic, label: 'Shadow', color: 'blue-400' },
  { icon: Headphones, label: 'Listen', color: 'coral' },
  { icon: MessageCircle, label: 'Chat', color: 'terracotta' },
  { icon: Trophy, label: 'Done', color: 'olive' },
]

export default function DailyLesson() {
  const { state, reviewItem, addXP, setDailyProgress, incrementDailyLessons } = useGame()
  const [currentStep, setCurrentStep] = useState(0)
  const [stepData, setStepData] = useState({})

  const today = new Date().toISOString().split('T')[0]
  const alreadyDone = state.dailyLessonProgress?.date === today && state.dailyLessonProgress?.completed

  // Pick today's topic
  const topic = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
    return dailyTopics[dayOfYear % dailyTopics.length]
  }, [])

  const handleNextStep = () => setCurrentStep((s) => Math.min(s + 1, 5))

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cream">Daily Lesson</h1>
        <p className="text-navy-600">Today: {topic.titleEn}</p>
      </div>

      {/* Already done state */}
      {alreadyDone && currentStep === 0 && (
        <div className="card text-center py-12 max-w-lg mx-auto">
          <CheckCircle size={48} className="text-olive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-cream mb-2">Today&apos;s Lesson Complete!</h2>
          <p className="text-navy-600 text-sm mb-6">Come back tomorrow for a new topic.</p>
          <button onClick={() => setCurrentStep(0)} className="btn-secondary text-sm">
            Redo Today&apos;s Lesson
          </button>
        </div>
      )}

      {(!alreadyDone || currentStep > 0) && (
        <>
          {/* Step progress */}
          <div className="flex items-center gap-1 mb-8 max-w-lg mx-auto">
            {STEPS.map((step, i) => {
              const StepIcon = step.icon
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors ${
                    i < currentStep ? 'bg-olive/20 text-olive' :
                    i === currentStep ? 'bg-terracotta/20 text-terracotta' :
                    'bg-navy-800 text-navy-600'
                  }`}>
                    {i < currentStep ? <CheckCircle size={14} /> : <StepIcon size={14} />}
                  </div>
                  <span className="text-[10px] text-navy-600">{step.label}</span>
                  {i < STEPS.length - 1 && (
                    <div className={`hidden sm:block absolute w-full h-0.5 top-4 ${i < currentStep ? 'bg-olive/30' : 'bg-navy-700'}`} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <ReviewStep key="review" state={state} reviewItem={reviewItem} onComplete={(data) => { setStepData(d => ({...d, review: data})); handleNextStep() }} />
            )}
            {currentStep === 1 && (
              <DialogueStep key="dialogue" topic={topic} level={state.placementLevel || 'B1'} onComplete={(data) => { setStepData(d => ({...d, dialogue: data})); handleNextStep() }} />
            )}
            {currentStep === 2 && (
              <ShadowStep key="shadow" lines={stepData.dialogue?.lines || []} onComplete={(data) => { setStepData(d => ({...d, shadow: data})); handleNextStep() }} />
            )}
            {currentStep === 3 && (
              <ListenStep key="listen" dialogue={stepData.dialogue?.fullText || ''} level={state.placementLevel || 'B1'} onComplete={() => handleNextStep()} />
            )}
            {currentStep === 4 && (
              <ChatStep key="chat" topic={topic} onComplete={() => handleNextStep()} />
            )}
            {currentStep === 5 && (
              <WrapupStep key="wrapup" stepData={stepData} topic={topic} addXP={addXP} setDailyProgress={setDailyProgress} incrementDailyLessons={incrementDailyLessons} />
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  )
}

function ReviewStep({ state, reviewItem, onComplete }) {
  const dueItems = useMemo(() => {
    const items = getItemsDueForReview(state.reviewItems)
    return items.slice(0, 5)
  }, [state.reviewItems])

  const dueIndices = useMemo(() => {
    return state.reviewItems
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => item.nextReview <= new Date().toISOString().split('T')[0])
      .slice(0, 5)
      .map(({ idx }) => idx)
  }, [state.reviewItems])

  const [current, setCurrent] = useState(0)
  const [input, setInput] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [correct, setCorrect] = useState(0)

  if (dueItems.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto card text-center py-8">
        <CheckCircle size={32} className="text-olive mx-auto mb-3" />
        <p className="text-cream font-medium mb-2">No items due for review</p>
        <p className="text-xs text-navy-600 mb-4">Your spaced repetition deck is up to date.</p>
        <button onClick={() => onComplete({ reviewed: 0, correct: 0 })} className="btn-primary text-sm">Continue to Dialogue</button>
      </motion.div>
    )
  }

  const currentItem = dueItems[current]
  const currentIdx = dueIndices[current]

  const handleCheck = () => {
    const isCorrect = input.trim().toLowerCase() === currentItem.corrected.trim().toLowerCase()
    setShowResult(true)
    if (isCorrect) setCorrect((c) => c + 1)
  }

  const handleQuality = (quality) => {
    reviewItem(currentIdx, quality)
    if (current + 1 >= dueItems.length) {
      onComplete({ reviewed: dueItems.length, correct })
    } else {
      setCurrent((c) => c + 1)
      setInput('')
      setShowResult(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto">
      <h2 className="text-lg font-bold text-cream mb-4">Warm-up Review</h2>
      <p className="text-xs text-navy-600 mb-4">{current + 1} of {dueItems.length}</p>
      <div className="card">
        <p className="text-xs text-navy-600 mb-1">Correct this:</p>
        <p className="text-lg text-red-400/80 font-medium mb-4">{currentItem.original}</p>
        {!showResult ? (
          <>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder="Type the correction..." autoFocus
              className="w-full bg-navy-800 border border-navy-700/50 rounded-xl px-4 py-3 text-cream placeholder:text-navy-600 focus:outline-none focus:border-terracotta/50 text-sm mb-3" />
            <button onClick={handleCheck} disabled={!input.trim()} className="btn-primary w-full disabled:opacity-50">Check</button>
          </>
        ) : (
          <>
            <p className="text-sm text-olive mb-1">Correct: {currentItem.corrected}</p>
            <p className="text-xs text-navy-600 mb-3">{currentItem.explanation}</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleQuality(0)} className="py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm">Wrong</button>
              <button onClick={() => handleQuality(1)} className="py-2 rounded-xl bg-coral/10 text-coral hover:bg-coral/20 text-sm">Hard</button>
              <button onClick={() => handleQuality(2)} className="py-2 rounded-xl bg-olive/10 text-olive hover:bg-olive/20 text-sm">Easy</button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

function DialogueStep({ topic, level, onComplete }) {
  const [dialogue, setDialogue] = useState(null)
  const [loading, setLoading] = useState(true)
  const { speak, speaking } = useSpeechSynthesis()

  useEffect(() => {
    let mounted = true
    sendMessage({
      messages: [{ role: 'user', content: `Generate a dialogue about: ${topic.dialoguePrompt}` }],
      systemPrompt: `You generate Italian dialogues for ${level} level learners.

IMPORTANT: Respond with valid JSON only.

{
  "response": "",
  "corrections": [],
  "vocabulary": [],
  "encouragement": "",
  "dialogue": {
    "lines": [
      {"speaker": "Speaker name", "italian": "Italian text", "english": "English translation", "note": "Optional grammar note"}
    ]
  }
}

Generate a natural 6-8 line dialogue about the given topic. Each line should be 1-2 sentences. Include grammar notes for key structures. Use ${level} level Italian.`,
    }).then((data) => {
      if (mounted) {
        const lines = data.message ? [] : []
        // Try to extract dialogue from raw response
        try {
          const raw = JSON.parse(data.message || '{}')
          if (raw.lines) setDialogue({ lines: raw.lines, fullText: raw.lines.map(l => l.italian).join('. ') })
        } catch {
          // Fallback: use the dialogue from the response if it was parsed
        }
        // Check if the backend parsed it
        if (!dialogue) {
          // Generate simple fallback dialogue
          const fallbackLines = [
            { speaker: 'Marco', italian: 'Buongiorno! Come stai oggi?', english: 'Good morning! How are you today?', note: 'Informal greeting with "tu" form' },
            { speaker: 'Giulia', italian: 'Sto bene, grazie! E tu?', english: "I'm fine, thanks! And you?", note: '"Stare" for temporary states' },
            { speaker: 'Marco', italian: 'Benissimo! Hai già fatto colazione?', english: 'Great! Have you already had breakfast?', note: 'Passato prossimo with "avere"' },
            { speaker: 'Giulia', italian: 'Sì, ho preso un caffè e un cornetto al bar.', english: 'Yes, I had a coffee and croissant at the bar.', note: '"Prendere" for ordering food/drinks' },
            { speaker: 'Marco', italian: 'Andiamo insieme domani mattina?', english: 'Shall we go together tomorrow morning?', note: 'Present tense for future plans' },
            { speaker: 'Giulia', italian: 'Certo, volentieri! A che ora ci vediamo?', english: 'Sure, gladly! What time shall we meet?', note: 'Reflexive verb "vedersi"' },
          ]
          if (mounted) setDialogue({ lines: fallbackLines, fullText: fallbackLines.map(l => l.italian).join('. ') })
        }
      }
    }).catch(() => {
      if (mounted) {
        const fallbackLines = [
          { speaker: 'Marco', italian: 'Buongiorno! Come stai oggi?', english: 'Good morning! How are you today?' },
          { speaker: 'Giulia', italian: 'Sto bene, grazie! Che bella giornata!', english: "I'm fine, thanks! What a beautiful day!" },
          { speaker: 'Marco', italian: 'Sì, dovremmo uscire a fare una passeggiata.', english: 'Yes, we should go out for a walk.' },
          { speaker: 'Giulia', italian: 'Buona idea! Andiamo al parco vicino casa.', english: 'Good idea! Let\'s go to the park near home.' },
        ]
        setDialogue({ lines: fallbackLines, fullText: fallbackLines.map(l => l.italian).join('. ') })
      }
    }).finally(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [topic, level]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto card text-center py-8">
      <div className="animate-spin w-6 h-6 border-2 border-terracotta border-t-transparent rounded-full mx-auto mb-3" />
      <p className="text-sm text-navy-600">Generating today&apos;s dialogue...</p>
    </motion.div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto">
      <h2 className="text-lg font-bold text-cream mb-4">New Dialogue</h2>
      <div className="space-y-3 mb-6">
        {dialogue?.lines.map((line, i) => (
          <div key={i} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-terracotta font-medium mb-1">{line.speaker}</p>
                <p className="text-sm text-cream font-medium">{line.italian}</p>
                <p className="text-xs text-navy-600 mt-1">{line.english}</p>
                {line.note && <p className="text-xs text-olive/70 mt-1 italic">{line.note}</p>}
              </div>
              <button onClick={() => speak(line.italian)} className="text-navy-600 hover:text-olive transition-colors p-1 shrink-0">
                {speaking ? <Volume2 size={14} className="animate-pulse" /> : <Play size={14} />}
              </button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => onComplete(dialogue)} className="btn-primary w-full inline-flex items-center justify-center gap-2">
        Continue to Shadowing <ArrowRight size={16} />
      </button>
    </motion.div>
  )
}

function ShadowStep({ lines, onComplete }) {
  const [current, setCurrent] = useState(0)
  const [accuracies, setAccuracies] = useState([])

  const practiceLines = lines.slice(0, 4) // Take first 4 lines for shadowing

  if (practiceLines.length === 0) {
    return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto card text-center py-8">
      <p className="text-navy-600 mb-4">No lines available for shadowing.</p>
      <button onClick={() => onComplete({ avgAccuracy: 0 })} className="btn-primary text-sm">Skip</button>
    </motion.div>
  }

  const handleComplete = (accuracy) => {
    const newAccuracies = [...accuracies, accuracy]
    setAccuracies(newAccuracies)
    if (current + 1 >= practiceLines.length) {
      const avg = Math.round(newAccuracies.reduce((a, b) => a + b, 0) / newAccuracies.length)
      onComplete({ avgAccuracy: avg })
    } else {
      setCurrent((c) => c + 1)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto">
      <h2 className="text-lg font-bold text-cream mb-2">Shadowing Practice</h2>
      <p className="text-xs text-navy-600 mb-4">Listen, then repeat out loud — {current + 1} of {practiceLines.length}</p>
      <ShadowingExercise
        key={current}
        sentence={practiceLines[current].italian}
        translation={practiceLines[current].english}
        difficulty={2}
        onComplete={handleComplete}
      />
    </motion.div>
  )
}

function ListenStep({ dialogue, level, onComplete }) {
  if (!dialogue) {
    return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto card text-center py-8">
      <button onClick={onComplete} className="btn-primary text-sm">Skip to Chat</button>
    </motion.div>
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto">
      <h2 className="text-lg font-bold text-cream mb-4">Listening Comprehension</h2>
      <ComprehensionQuiz
        passage={dialogue}
        level={level}
        questionCount={2}
        onComplete={() => onComplete()}
      />
    </motion.div>
  )
}

function ChatStep({ topic, onComplete }) {
  const chatPrompt = `You are a friendly Italian conversation partner. The topic today is: ${topic.titleEn} (${topic.title}).

IMPORTANT: Respond with valid JSON only.
{
  "response": "Your Italian response (1-3 sentences about today's topic)",
  "corrections": [{"original": "...", "corrected": "...", "explanation": "...", "category": "..."}],
  "vocabulary": [],
  "encouragement": ""
}

Start by introducing today's topic naturally in Italian. Keep the conversation focused on "${topic.titleEn}". Use vocabulary related to "${topic.vocabularyTheme}".`

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-cream">Free Chat</h2>
          <p className="text-xs text-navy-600">Practice today&apos;s topic in conversation</p>
        </div>
        <button onClick={onComplete} className="btn-primary text-sm inline-flex items-center gap-1">
          Finish <ArrowRight size={14} />
        </button>
      </div>
      <div className="h-[350px] bg-navy-800/50 rounded-2xl border border-navy-700/30 overflow-hidden">
        <ChatWindow systemPrompt={chatPrompt} placeholder={`Talk about ${topic.titleEn.toLowerCase()}...`} />
      </div>
    </motion.div>
  )
}

function WrapupStep({ stepData, topic, addXP, setDailyProgress, incrementDailyLessons }) {
  useEffect(() => {
    addXP(50) // Completion bonus
    setDailyProgress({ date: new Date().toISOString().split('T')[0], completed: true, topicId: topic.id })
    incrementDailyLessons()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto card text-center py-10">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-olive to-olive-dark flex items-center justify-center">
        <Trophy size={32} className="text-white" />
      </div>
      <h2 className="text-xl font-bold text-cream mb-2">Lesson Complete!</h2>
      <p className="text-navy-600 text-sm mb-6">You completed today&apos;s lesson on &quot;{topic.titleEn}&quot;</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-navy-900/50 rounded-xl p-3">
          <p className="text-lg font-bold text-olive">+50</p>
          <p className="text-xs text-navy-600">Bonus XP</p>
        </div>
        <div className="bg-navy-900/50 rounded-xl p-3">
          <p className="text-lg font-bold text-cream">{stepData.review?.reviewed || 0}</p>
          <p className="text-xs text-navy-600">Reviewed</p>
        </div>
        <div className="bg-navy-900/50 rounded-xl p-3">
          <p className="text-lg font-bold text-cream">{stepData.shadow?.avgAccuracy || '-'}%</p>
          <p className="text-xs text-navy-600">Shadow Acc.</p>
        </div>
      </div>

      <p className="text-sm text-navy-600">See you tomorrow!</p>
    </motion.div>
  )
}
