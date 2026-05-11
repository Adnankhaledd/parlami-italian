import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Headphones, PenTool, MessageCircle, Mic, Play, RotateCcw, ArrowRight, ArrowLeft, Volume2, CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react'
import ChatWindow from '../components/Chat/ChatWindow'
import ShadowingExercise from '../components/Shadowing/ShadowingExercise'
import useSpeechSynthesis from '../hooks/useSpeechSynthesis'
import { useGame } from '../contexts/GameContext'
import { dictationSentences } from '../data/dictationSentences'
import { compareWords } from '../utils/textComparison'
import { generateSentences } from '../services/api'

const DIFFICULTY_RATES = { 1: 0.7, 2: 0.8, 3: 0.9, 4: 1.0, 5: 1.1 }

// Normalize sentence text for cross-session deduplication
const normalizeText = (text) => (text || '').toLowerCase().trim().replace(/\s+/g, ' ').slice(0, 80)

// Hook: every session pulls a fresh batch from the API.
// Hardcoded sentences are only a fallback if the API fails entirely.
function useFreshBatch(difficulty, count = 8) {
  const { state, completeSentence } = useGame()
  const [sentences, setSentences] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch a fresh batch from the API, excluding recent completions
  const fetchBatch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Recent completions to exclude: send the actual text so the AI knows
      const recentTexts = (state.completedSentenceIds || []).slice(-30)
      const newSentences = await generateSentences({
        difficulty,
        count,
        exclude: recentTexts,
      })

      if (newSentences.length > 0) {
        // Filter out anything that matches recently completed text (case-insensitive)
        const completedSet = new Set(recentTexts.map(normalizeText))
        const fresh = newSentences
          .filter(s => !completedSet.has(normalizeText(s.text)))
          .map(s => ({
            ...s,
            id: normalizeText(s.text),
            difficulty,
            generated: true,
          }))

        if (fresh.length > 0) {
          setSentences(fresh)
          return
        }
      }

      // API returned nothing usable — fall back to unseen hardcoded sentences
      throw new Error('AI returned no usable sentences')
    } catch (err) {
      console.error('Sentence batch fetch failed:', err.message)
      setError(err.message)
      const completedSet = new Set((state.completedSentenceIds || []).map(s => normalizeText(s)))
      const fallback = dictationSentences
        .filter(s => s.difficulty === difficulty)
        .filter(s => !completedSet.has(normalizeText(s.text)))
        .sort(() => Math.random() - 0.5)
        .slice(0, count)
        .map(s => ({ ...s, id: normalizeText(s.text) }))
      setSentences(fallback)
    } finally {
      setLoading(false)
    }
  }, [difficulty, count, state.completedSentenceIds])

  const markCompleted = useCallback((sentence) => {
    if (sentence?.text) {
      // Track by normalized text so dedup works across sessions, regardless of source
      completeSentence(normalizeText(sentence.text))
    }
  }, [completeSentence])

  return { sentences, loading, error, fetchBatch, markCompleted }
}

const LISTEN_SYSTEM_PROMPT = `You are a friendly Italian conversation partner for listening practice. Your name is Parlami.

IMPORTANT: You must respond with valid JSON only. No text before or after the JSON.

Respond with this exact JSON structure:
{
  "response": "Your Italian response here (2-3 sentences, natural conversation)",
  "corrections": [
    {
      "original": "what the user said wrong",
      "corrected": "the correct Italian",
      "explanation": "Brief English explanation",
      "category": "verb_conjugation|gender_agreement|articles|prepositions|word_order|vocabulary|pronouns|subjunctive|spelling|other"
    }
  ],
  "vocabulary": ["new", "words"],
  "encouragement": "Brief encouraging comment in English"
}

Rules:
- Talk like a REAL Italian person — natural, everyday language, not a textbook
- Use casual expressions and filler words (allora, tipo, cioè, senti, insomma, dai) naturally
- Use clear pronunciation since this is LISTENING practice, but keep the language authentic
- The user will hear your responses as audio, so speak like a friend would
- Vary your topics: food stories, weekend plans, funny things that happened, opinions on movies, travel memories
- Keep responses 2-3 sentences so they're easy to follow by ear`

export default function ListeningPractice() {
  const [mode, setMode] = useState(null) // null | 'dictation' | 'respond' | 'shadowing'

  if (!mode) {
    return <ModeSelection onSelect={setMode} />
  }

  if (mode === 'respond') {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-cream">Listen & Respond</h1>
            <p className="text-navy-600 text-sm">Listen to the audio, then respond in Italian</p>
          </div>
          <button
            onClick={() => setMode(null)}
            className="flex items-center gap-2 text-navy-600 hover:text-cream transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
        <div className="flex-1 bg-navy-800/50 rounded-2xl border border-navy-700/30 overflow-hidden">
          <ChatWindow
            systemPrompt={LISTEN_SYSTEM_PROMPT}
            listenMode={true}
            placeholder="Type your response in Italian..."
          />
        </div>
      </div>
    )
  }

  if (mode === 'shadowing') {
    return <ShadowingMode onBack={() => setMode(null)} />
  }

  return <DictationMode onBack={() => setMode(null)} />
}

function ModeSelection({ onSelect }) {
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cream">Listening Practice</h1>
        <p className="text-navy-600">Train your ear for Italian</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl">
        <motion.button
          variants={item}
          initial="hidden"
          animate="show"
          onClick={() => onSelect('dictation')}
          className="card-hover text-left group cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-terracotta to-coral flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <PenTool size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-cream mb-1">Dictation</h3>
              <p className="text-sm text-navy-600">
                Listen to Italian sentences and type what you hear. Test your comprehension word by word.
              </p>
              <p className="text-terracotta text-sm font-medium mt-3">Start dictation →</p>
            </div>
          </div>
        </motion.button>

        <motion.button
          variants={item}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.1 }}
          onClick={() => onSelect('respond')}
          className="card-hover text-left group cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-olive to-olive-dark flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MessageCircle size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-cream mb-1">Listen & Respond</h3>
              <p className="text-sm text-navy-600">
                Have a conversation where you hear audio first. Respond in Italian, then reveal the text.
              </p>
              <p className="text-olive text-sm font-medium mt-3">Start conversation →</p>
            </div>
          </div>
        </motion.button>

        <motion.button
          variants={item}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
          onClick={() => onSelect('shadowing')}
          className="card-hover text-left group cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Mic size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-cream mb-1">Shadowing</h3>
              <p className="text-sm text-navy-600">
                Listen to a sentence, then repeat it out loud. Compare your pronunciation to the original.
              </p>
              <p className="text-blue-400 text-sm font-medium mt-3">Start shadowing →</p>
            </div>
          </div>
        </motion.button>
      </div>
    </motion.div>
  )
}

function ShadowingMode({ onBack }) {
  const [difficulty, setDifficulty] = useState(2)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState({ total: 0, totalAccuracy: 0 })
  const [sessionDone, setSessionDone] = useState(false)
  const { addXP } = useGame()
  const { sentences, loading, error, fetchBatch, markCompleted } = useFreshBatch(difficulty, 8)

  // Auto-fetch a fresh batch on mount and whenever difficulty changes
  useEffect(() => {
    setCurrentIndex(0)
    setSessionStats({ total: 0, totalAccuracy: 0 })
    setSessionDone(false)
    fetchBatch()
  }, [difficulty]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleComplete = (accuracy) => {
    markCompleted(sentences[currentIndex])

    const newStats = {
      total: sessionStats.total + 1,
      totalAccuracy: sessionStats.totalAccuracy + accuracy,
    }
    setSessionStats(newStats)

    if (currentIndex + 1 >= sentences.length) {
      const avgAccuracy = Math.round(newStats.totalAccuracy / newStats.total)
      const xp = Math.round(avgAccuracy / 10) * newStats.total
      if (xp > 0) addXP(xp)
      setSessionDone(true)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  const handleNewSession = () => {
    setCurrentIndex(0)
    setSessionStats({ total: 0, totalAccuracy: 0 })
    setSessionDone(false)
    fetchBatch()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cream">Shadowing</h1>
          <p className="text-navy-600 text-sm">Listen and repeat out loud — fresh AI-generated sentences every session</p>
        </div>
        <button onClick={onBack} className="flex items-center gap-2 text-navy-600 hover:text-cream transition-colors text-sm">
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-navy-600">Difficulty:</span>
        {[1, 2, 3, 4, 5].map((d) => (
          <button key={d} onClick={() => setDifficulty(d)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${difficulty === d ? 'bg-terracotta text-white' : 'bg-navy-800 text-navy-600 hover:text-cream'}`}>
            {d}
          </button>
        ))}
        {error && (
          <span className="text-xs text-coral ml-auto">Using offline fallback</span>
        )}
      </div>

      {loading ? (
        <div className="card text-center py-12 max-w-xl mx-auto">
          <Loader2 size={32} className="text-terracotta mx-auto mb-3 animate-spin" />
          <p className="text-cream">Generating fresh sentences...</p>
          <p className="text-xs text-navy-600 mt-1">Brand new ones, never repeated</p>
        </div>
      ) : sessionDone ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center py-12 max-w-xl mx-auto">
          <Headphones size={32} className="text-blue-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-cream mb-4">Shadowing Complete!</h3>
          <p className="text-2xl font-bold text-olive mb-6">{Math.round(sessionStats.totalAccuracy / sessionStats.total)}% avg accuracy</p>
          <button onClick={handleNewSession} className="btn-primary inline-flex items-center gap-2">
            <Sparkles size={16} /> Get Fresh Batch
          </button>
        </motion.div>
      ) : sentences[currentIndex] ? (
        <div className="max-w-xl mx-auto">
          <p className="text-sm text-navy-600 mb-4">{currentIndex + 1} of {sentences.length}</p>
          <ShadowingExercise
            key={`${difficulty}-${currentIndex}-${sentences[currentIndex]?.id}`}
            sentence={sentences[currentIndex].text}
            translation={sentences[currentIndex].translation}
            difficulty={difficulty}
            onComplete={handleComplete}
          />
        </div>
      ) : (
        <div className="card text-center py-12 max-w-xl mx-auto">
          <Sparkles size={32} className="text-terracotta mx-auto mb-3" />
          <p className="text-cream mb-3">No sentences loaded</p>
          <button onClick={fetchBatch} className="btn-primary inline-flex items-center gap-2">
            <Sparkles size={16} /> Generate Fresh Batch
          </button>
        </div>
      )}
    </motion.div>
  )
}

function DictationMode({ onBack }) {
  const [difficulty, setDifficulty] = useState(2)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [result, setResult] = useState(null)
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0, totalAccuracy: 0 })
  const [sessionDone, setSessionDone] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [transcriptLevel, setTranscriptLevel] = useState(2) // 1=full, 2=italian only, 3=blurred, 4=hidden

  const { speak, speaking, stopSpeaking } = useSpeechSynthesis()
  const { addXP, incrementDictation } = useGame()
  const { sentences, loading, error, fetchBatch, markCompleted } = useFreshBatch(difficulty, 10)

  // Auto-fetch a fresh batch on mount and whenever difficulty changes
  useEffect(() => {
    setCurrentIndex(0)
    setUserInput('')
    setResult(null)
    setSessionStats({ correct: 0, total: 0, totalAccuracy: 0 })
    setSessionDone(false)
    setHasPlayed(false)
    fetchBatch()
  }, [difficulty]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentSentence = sentences[currentIndex]
  const rate = DIFFICULTY_RATES[difficulty]

  const handlePlay = useCallback(() => {
    if (currentSentence) {
      speak(currentSentence.text, rate)
      setHasPlayed(true)
    }
  }, [currentSentence, speak, rate])

  const handleCheck = () => {
    if (!currentSentence || !userInput.trim()) return
    const comparison = compareWords(userInput, currentSentence.text)
    setResult(comparison)
    incrementDictation()
    markCompleted(currentSentence)
    setSessionStats((prev) => ({
      correct: prev.correct + (comparison.accuracy >= 80 ? 1 : 0),
      total: prev.total + 1,
      totalAccuracy: prev.totalAccuracy + comparison.accuracy,
    }))
  }

  const handleNext = () => {
    if (currentIndex + 1 >= sentences.length) {
      const avgAccuracy = Math.round(sessionStats.totalAccuracy / sessionStats.total)
      const xp = sessionStats.correct * 5 + (avgAccuracy >= 90 ? 20 : 0)
      if (xp > 0) addXP(xp)
      setSessionDone(true)
    } else {
      setCurrentIndex((prev) => prev + 1)
      setUserInput('')
      setResult(null)
      setHasPlayed(false)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setUserInput('')
    setResult(null)
    setSessionStats({ correct: 0, total: 0, totalAccuracy: 0 })
    setSessionDone(false)
    setHasPlayed(false)
    fetchBatch()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !result) {
      e.preventDefault()
      handleCheck()
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cream">Dictation</h1>
          <p className="text-navy-600 text-sm">Listen and type what you hear</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-navy-600 hover:text-cream transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {/* Difficulty selector */}
      {!sessionDone && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-xs text-navy-600">Difficulty:</span>
          {[1, 2, 3, 4, 5].map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                difficulty === d
                  ? 'bg-terracotta text-white'
                  : 'bg-navy-800 text-navy-600 hover:text-cream'
              }`}
            >
              {d}
            </button>
          ))}
          <span className="text-xs text-navy-600 ml-4">Hints:</span>
          {[{l:1,t:'Full'},{l:2,t:'IT'},{l:3,t:'Blur'},{l:4,t:'None'}].map(({l,t}) => (
            <button key={l} onClick={() => setTranscriptLevel(l)}
              className={`px-2 h-8 rounded-lg text-xs font-medium transition-colors ${transcriptLevel === l ? 'bg-blue-500/20 text-blue-400' : 'bg-navy-800 text-navy-600 hover:text-cream'}`}>
              {t}
            </button>
          ))}
          {error && (
            <span className="text-xs text-coral ml-auto">Using offline fallback</span>
          )}
        </div>
      )}

      {/* Session done */}
      {sessionDone && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card text-center py-12 max-w-xl mx-auto"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-terracotta to-coral flex items-center justify-center">
            <Headphones size={32} className="text-white" />
          </div>
          <h3 className="text-lg font-bold text-cream mb-2">Dictation Complete!</h3>
          <div className="flex justify-center gap-8 mt-4 mb-6">
            <div>
              <p className="text-2xl font-bold text-cream">{sessionStats.correct}/{sessionStats.total}</p>
              <p className="text-xs text-navy-600">Sentences</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-olive">
                {Math.round(sessionStats.totalAccuracy / sessionStats.total)}%
              </p>
              <p className="text-xs text-navy-600">Avg Accuracy</p>
            </div>
          </div>
          <button onClick={handleRestart} className="btn-primary inline-flex items-center gap-2">
            <Sparkles size={16} />
            Get Fresh Batch
          </button>
        </motion.div>
      )}

      {/* Loading state */}
      {loading && !sessionDone && (
        <div className="card text-center py-12 max-w-xl mx-auto">
          <Loader2 size={32} className="text-terracotta mx-auto mb-3 animate-spin" />
          <p className="text-cream">Generating fresh sentences...</p>
          <p className="text-xs text-navy-600 mt-1">Brand new ones, never repeated</p>
        </div>
      )}

      {/* Dictation card */}
      {currentSentence && !sessionDone && !loading && (
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-4 text-sm text-navy-600">
            <span>{currentIndex + 1} of {sentences.length}</span>
            <span>Difficulty {difficulty}/5</span>
          </div>

          <div className="card">
            {/* Play button */}
            <div className="text-center mb-6">
              <button
                onClick={handlePlay}
                disabled={speaking}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-terracotta to-coral flex items-center justify-center mx-auto hover:scale-105 transition-transform disabled:opacity-50"
              >
                {speaking ? (
                  <Volume2 size={32} className="text-white animate-pulse" />
                ) : (
                  <Play size={32} className="text-white ml-1" />
                )}
              </button>
              <p className="text-xs text-navy-600 mt-3">
                {hasPlayed ? 'Click to replay' : 'Click to listen'}
              </p>
            </div>

            {/* Transcript hint based on level */}
            {currentSentence && !result && transcriptLevel <= 3 && (
              <div className="mb-4 text-center">
                {transcriptLevel === 1 && (
                  <>
                    <p className="text-sm text-cream">{currentSentence.text}</p>
                    <p className="text-xs text-navy-600 mt-1">{currentSentence.translation}</p>
                  </>
                )}
                {transcriptLevel === 2 && (
                  <p className="text-sm text-cream">{currentSentence.text}</p>
                )}
                {transcriptLevel === 3 && (
                  <p className="text-sm text-cream blur-sm hover:blur-none transition-all cursor-pointer select-none">{currentSentence.text}</p>
                )}
              </div>
            )}

            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type what you heard..."
                    autoFocus
                    className="w-full bg-navy-800 border border-navy-700/50 rounded-xl px-4 py-3 text-cream placeholder:text-navy-600 focus:outline-none focus:border-terracotta/50 transition-colors text-sm mb-4"
                  />
                  <button
                    onClick={handleCheck}
                    disabled={!userInput.trim() || !hasPlayed}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Check
                  </button>
                </motion.div>
              ) : (
                <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  {/* Accuracy */}
                  <div className={`flex items-center gap-2 mb-3 ${result.accuracy >= 80 ? 'text-olive' : 'text-coral'}`}>
                    {result.accuracy >= 80 ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    <span className="font-semibold">{result.accuracy}% accurate</span>
                  </div>

                  {/* Word-by-word results */}
                  <div className="bg-navy-800/50 rounded-xl p-4 mb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {result.results.filter(r => !r.extra).map((r, i) => (
                        <span
                          key={i}
                          className={`px-2 py-1 rounded text-sm ${
                            r.correct
                              ? 'bg-olive/10 text-olive'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                          title={r.correct ? '' : `You typed: "${r.userWord || '(missing)'}"`}
                        >
                          {r.word}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Translation */}
                  <p className="text-xs text-navy-600 mb-4">
                    Translation: {currentSentence.translation}
                  </p>

                  <button
                    onClick={handleNext}
                    className="btn-primary w-full inline-flex items-center justify-center gap-2"
                  >
                    {currentIndex + 1 >= sentences.length ? 'Finish' : 'Next Sentence'}
                    <ArrowRight size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  )
}
