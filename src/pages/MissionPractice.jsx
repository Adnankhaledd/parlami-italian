import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target, Trophy, Mic, Square, Send, ArrowLeft, ArrowRight,
  CheckCircle, XCircle, AlertCircle, Volume2, RotateCcw, Loader2, Sparkles
} from 'lucide-react'
import { useGame } from '../contexts/GameContext'
import { sendMessage } from '../services/api'
import useSpeechSynthesis from '../hooks/useSpeechSynthesis'
import useSpeechRecognition from '../hooks/useSpeechRecognition'
import { STRUCTURE_BY_ID } from '../data/structures'

const TOTAL_QUESTIONS = 5

function buildDrillPrompt(structure, level) {
  return `You are running a focused mini-lesson drill on Italian ${structure.label}.

Your job each turn:
1. Read the user's reply
2. Score whether they CORRECTLY used the target structure (${structure.label})
3. Give brief feedback in Italian + the correct version if they didn't use it
4. Be encouraging — this is practice, mistakes are fine

The user is at ${level} level. Speak natural conversational Italian.

DEFINITIONS — what counts as using ${structure.label}:
${structure.description}

Examples of CORRECT use:
${structure.examples.map(ex => `- ${ex}`).join('\n')}

You must respond with ONLY this JSON:
{
  "feedback": "Brief Italian feedback (1-2 sentences) — encouraging, points out what worked or what to fix",
  "usedCorrectly": true | false,
  "correctVersion": "If they didn't use the target structure correctly, rewrite their reply using ${structure.label}. Otherwise empty string.",
  "tip": "One short tip in English about the structure (only if they got it wrong, otherwise empty string)"
}

Important:
- "usedCorrectly": true only if they ACTUALLY used ${structure.label} (not just a related structure)
- If they avoided the structure entirely (paraphrased around it), set usedCorrectly: false
- If they attempted it but conjugated it wrong, set usedCorrectly: false but acknowledge the attempt in feedback
- Keep feedback warm and brief — they're doing focused practice, not a conversation
- NO markdown formatting in any field`
}

export default function MissionPractice() {
  const { state, addXP, recordStructureUsage, setDailyMission } = useGame()
  const navigate = useNavigate()
  const { speak, speaking } = useSpeechSynthesis()
  const { isListening, transcript, start, stop, reset, supported: micSupported } = useSpeechRecognition()
  const inputRef = useRef(null)

  const mission = state.currentMission
  const today = new Date().toISOString().split('T')[0]
  const missionIsToday = mission && mission.date === today
  const structure = mission ? STRUCTURE_BY_ID[mission.structureId] : null

  const [questionIndex, setQuestionIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)

  // Build the 5 questions — cycle through elicitations if fewer than 5
  const questions = useMemo(() => {
    if (!structure) return []
    const elicits = [...(structure.elicitations || [])]
    // Shuffle
    for (let i = elicits.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[elicits[i], elicits[j]] = [elicits[j], elicits[i]]
    }
    const result = []
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
      result.push(elicits[i % elicits.length])
    }
    return result
  }, [structure])

  const currentQuestion = questions[questionIndex]

  // Speak the question when it appears
  useEffect(() => {
    if (currentQuestion && !done && !feedback) {
      const t = setTimeout(() => speak(currentQuestion, 0.9), 200)
      return () => clearTimeout(t)
    }
  }, [currentQuestion, done, feedback]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update input from speech
  useEffect(() => {
    if (transcript) setUserInput(transcript)
  }, [transcript])

  if (!missionIsToday || !structure) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto text-center py-12">
        <Target size={40} className="text-navy-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-cream mb-2">No mission set for today</h2>
        <p className="text-sm text-navy-600 mb-6">Pick a structure to practice from the Missions page.</p>
        <Link to="/missions" className="btn-primary inline-flex items-center gap-2">
          <Target size={16} /> Go to Missions
        </Link>
      </motion.div>
    )
  }

  const handleSubmit = async () => {
    if (!userInput.trim() || loading) return
    setLoading(true)
    setError(null)
    if (isListening) stop()

    try {
      const result = await sendMessage({
        messages: [
          { role: 'assistant', content: currentQuestion },
          { role: 'user', content: userInput.trim() },
        ],
        systemPrompt: buildDrillPrompt(structure, state.placementLevel || 'B1'),
      })

      // The chat API wraps response into result.message — try to parse JSON from it
      let parsed = null
      try {
        const raw = result.message || ''
        const match = raw.match(/\{[\s\S]*\}/)
        if (match) parsed = JSON.parse(match[0])
      } catch {
        // ignore — we'll show fallback
      }

      const usedCorrectly = parsed?.usedCorrectly === true
      const fb = {
        feedback: parsed?.feedback || result.message || 'Risposta ricevuta!',
        usedCorrectly,
        correctVersion: parsed?.correctVersion || '',
        tip: parsed?.tip || '',
      }
      setFeedback(fb)

      // Update progress IF used correctly — deterministic, not relying on structuresUsed array
      if (usedCorrectly) {
        recordStructureUsage([structure.id])
        setCorrectCount(c => c + 1)
        addXP(8)
      } else {
        addXP(3) // partial credit for trying
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    setFeedback(null)
    setUserInput('')
    reset()
    if (questionIndex + 1 >= TOTAL_QUESTIONS) {
      setDone(true)
      addXP(25) // bonus for completing the drill
    } else {
      setQuestionIndex(i => i + 1)
    }
  }

  const handleRestart = () => {
    setQuestionIndex(0)
    setUserInput('')
    setFeedback(null)
    setCorrectCount(0)
    setDone(false)
    reset()
  }

  const handleNewMission = () => {
    // Reset and let user pick another from missions page
    navigate('/missions')
  }

  const handleMicClick = () => {
    if (isListening) {
      stop()
    } else {
      reset()
      setUserInput('')
      start()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading && !feedback) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Done screen
  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center py-12">
        <Trophy size={48} className="text-yellow-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-cream mb-2">Drill Complete!</h2>
        <p className="text-navy-600 mb-6">{structure.label}</p>

        <div className="card mb-6">
          <p className="text-4xl font-bold text-olive mb-1">{correctCount}/{TOTAL_QUESTIONS}</p>
          <p className="text-xs text-navy-600">correct uses of {structure.label}</p>
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={handleRestart} className="btn-primary inline-flex items-center justify-center gap-2">
            <RotateCcw size={16} /> Practice this structure again
          </button>
          <button onClick={handleNewMission} className="py-2 px-4 rounded-xl bg-navy-800 hover:bg-navy-700 text-cream text-sm transition-colors inline-flex items-center justify-center gap-2">
            <Target size={14} /> Pick a new mission
          </button>
        </div>
      </motion.div>
    )
  }

  const progress = ((questionIndex + (feedback ? 1 : 0)) / TOTAL_QUESTIONS) * 100

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Link to="/missions" className="flex items-center gap-1.5 text-navy-600 hover:text-cream text-sm transition-colors">
          <ArrowLeft size={14} /> Back to missions
        </Link>
        <span className="text-xs text-navy-600 bg-navy-800 px-2 py-1 rounded-full">
          {questionIndex + 1} / {TOTAL_QUESTIONS}
        </span>
      </div>

      {/* Mission header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Target size={16} className="text-terracotta" />
          <span className="text-xs font-bold uppercase tracking-wider text-terracotta">Mission Drill</span>
        </div>
        <h1 className="text-2xl font-bold text-cream">{structure.label}</h1>
        <p className="text-sm text-navy-600 mt-1">{structure.description}</p>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-navy-800 rounded-full overflow-hidden mb-6">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
          className="h-full bg-gradient-to-r from-terracotta to-coral"
        />
      </div>

      {/* Question card */}
      <div className="card mb-4">
        <div className="flex items-start gap-2 mb-3">
          <p className="text-xs font-bold uppercase tracking-wide text-navy-600 shrink-0">Question {questionIndex + 1}</p>
        </div>
        <div className="flex items-start gap-3 mb-2">
          <p className="text-cream text-base leading-relaxed flex-1">{currentQuestion}</p>
          <button
            onClick={() => speak(currentQuestion, 0.9)}
            disabled={speaking}
            className="shrink-0 w-9 h-9 rounded-full bg-navy-800 hover:bg-terracotta/20 flex items-center justify-center text-navy-600 hover:text-terracotta transition-colors disabled:opacity-50"
            title="Listen again"
          >
            <Volume2 size={14} />
          </button>
        </div>
        <p className="text-xs text-navy-600 italic mt-3">
          Answer using {structure.label} — try to use the structure naturally in your reply.
        </p>
      </div>

      {/* User input or feedback */}
      <AnimatePresence mode="wait">
        {!feedback ? (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="card">
              <textarea
                ref={inputRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer in Italian, or use the mic..."
                rows={3}
                className="w-full bg-navy-800 border border-navy-700/50 rounded-xl px-4 py-3 text-cream placeholder:text-navy-600 focus:outline-none focus:border-terracotta/50 transition-colors text-sm resize-none mb-3"
                autoFocus
                disabled={loading}
              />
              <div className="flex gap-2">
                {micSupported && (
                  <button
                    onClick={handleMicClick}
                    disabled={loading}
                    className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      isListening ? 'bg-red-500 text-white' : 'bg-navy-800 text-navy-600 hover:text-cream'
                    }`}
                    title={isListening ? 'Stop' : 'Speak'}
                  >
                    {isListening ? <Square size={18} /> : <Mic size={18} />}
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!userInput.trim() || loading}
                  className="flex-1 btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Evaluating...</> : <><Send size={16} /> Submit</>}
                </button>
              </div>
              {error && <p className="text-xs text-coral mt-2">{error}</p>}
            </div>
          </motion.div>
        ) : (
          <motion.div key="feedback" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Result */}
            <div className={`card border-2 mb-3 ${feedback.usedCorrectly ? 'border-olive/40' : 'border-coral/40'}`}>
              <div className="flex items-center gap-2 mb-3">
                {feedback.usedCorrectly ? (
                  <>
                    <CheckCircle size={18} className="text-olive" />
                    <span className="text-sm font-bold text-olive">Used {structure.label} correctly!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} className="text-coral" />
                    <span className="text-sm font-bold text-coral">Try again — you didn't use {structure.label}</span>
                  </>
                )}
              </div>

              {/* Your answer */}
              <div className="bg-navy-800/50 rounded-lg px-3 py-2 mb-3">
                <p className="text-xs text-navy-600 mb-0.5">You said:</p>
                <p className="text-sm text-cream">{userInput}</p>
              </div>

              {/* Correct version (if not used correctly) */}
              {feedback.correctVersion && (
                <div className="bg-olive/10 border border-olive/20 rounded-lg px-3 py-2 mb-3">
                  <p className="text-xs text-navy-600 mb-0.5">A version using {structure.label}:</p>
                  <p className="text-sm text-olive font-medium flex items-center gap-2">
                    {feedback.correctVersion}
                    <button
                      onClick={() => speak(feedback.correctVersion, 0.9)}
                      disabled={speaking}
                      className="text-olive/70 hover:text-olive transition-colors"
                    >
                      <Volume2 size={12} />
                    </button>
                  </p>
                </div>
              )}

              {/* Italian feedback */}
              <p className="text-sm text-cream/90 mb-2">{feedback.feedback}</p>

              {/* Grammar tip */}
              {feedback.tip && (
                <p className="text-xs text-navy-600 italic mt-2">💡 {feedback.tip}</p>
              )}
            </div>

            <button onClick={handleNext} className="btn-primary w-full inline-flex items-center justify-center gap-2">
              {questionIndex + 1 >= TOTAL_QUESTIONS ? (
                <><Trophy size={16} /> Finish Drill</>
              ) : (
                <>Next Question <ArrowRight size={16} /></>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score so far */}
      <div className="mt-4 text-center text-xs text-navy-600">
        Correct so far: <span className="text-olive font-semibold">{correctCount}/{questionIndex + (feedback ? 1 : 0)}</span>
      </div>
    </motion.div>
  )
}
