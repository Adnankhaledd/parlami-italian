import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, Square, Volume2, Eye, EyeOff, Clock, Play, Pause,
  MessageCircle, AlertCircle, CheckCircle, ChevronDown, ChevronUp,
  RefreshCw, BookOpen, Trophy
} from 'lucide-react'
import { useGame } from '../contexts/GameContext'
import { sendMessage } from '../services/api'
import useSpeechSynthesis from '../hooks/useSpeechSynthesis'
import useSpeechRecognition from '../hooks/useSpeechRecognition'
import { buildMistakeContext } from '../utils/mistakeContext'

// Topics that rotate daily — feel like real conversations, not textbook exercises
const CONVERSATION_STARTERS = [
  "Ciao! Oggi parliamo del tuo weekend — cosa hai fatto? O se non hai ancora piani, cosa vorresti fare?",
  "Allora, dimmi una cosa... qual è l'ultimo film o serie che hai visto? Ti è piaciuto?",
  "Senti, oggi ti faccio una domanda — se potessi vivere in qualsiasi città italiana, dove andresti e perché?",
  "Ciao! Raccontami della tua giornata — com'è andata finora? Cosa hai fatto di bello?",
  "Oggi parliamo di cibo! Qual è il tuo piatto italiano preferito? Sai cucinarlo?",
  "Dimmi, hai viaggiato di recente? O hai qualche viaggio in programma? Raccontami!",
  "Allora, parliamo del lavoro — come va il lavoro? Cosa fai di solito durante la giornata?",
  "Oggi un argomento diverso — qual è la cosa più difficile dell'imparare l'italiano per te?",
  "Ciao! Se avessi una giornata libera domani, senza nessun impegno, cosa faresti?",
  "Senti, parliamo un po' di musica — che musica ascolti? Conosci qualche canzone italiana?",
  "Dimmi, come ti tiene in forma? Fai sport o vai in palestra? Raccontami della tua routine.",
  "Oggi ti chiedo — se potessi invitare tre persone a cena, vive o morte, chi inviteresti e perché?",
  "Allora, hai un ricordo bello di quando eri piccolo? Raccontamelo in italiano!",
  "Ciao! Oggi parliamo delle notizie — hai letto o sentito qualcosa di interessante ultimamente?",
  "Senti, parliamo un po' della tua famiglia — quanti siete? Dove vivono?",
]

function getDailyStarter() {
  // Pick a starter based on the date — so same starter all day, new one tomorrow
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
  return CONVERSATION_STARTERS[dayIndex % CONVERSATION_STARTERS.length]
}

function buildDailyPrompt(level, state) {
  const weakAreas = Object.entries(state.mistakeCounts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, count]) => `${cat.replace(/_/g, ' ')} (${count} mistakes)`)

  const recentMistakes = (state.mistakes || [])
    .slice(-5)
    .map(m => `"${m.original}" → "${m.corrected}"`)

  const vocabCount = (state.wordLibrary || []).length
  const assessNotes = state.assessmentResult
    ? `Last assessment: ${state.assessmentResult.level} overall. Speaking: ${state.assessmentResult.speaking?.level || '?'}. Listening: ${state.assessmentResult.listening?.level || '?'}. Weaknesses: ${(state.assessmentResult.weaknesses || []).join(', ')}`
    : ''

  return `You are Parlami, an Italian conversation partner for daily immersive practice. The learner is ${level} level.

THIS IS AN AUDIO-FIRST SESSION. The learner will HEAR your responses, not read them.

CRITICAL — HOW TO CORRECT MISTAKES IN YOUR SPOKEN RESPONSE:
If the learner made any grammar/vocabulary mistakes, your spoken response MUST start with a quick, friendly correction in this style:
  "Aspetta, una piccola cosa — si dice [correct version], non [what they said], perché [brief reason in Italian or English]. [Then continue the conversation naturally]."

OR more casually:
  "Senti, prima di rispondere — meglio dire [correct] invece di [wrong]. [Then your natural reply]."

Examples:
- "Aspetta, si dice 'sono andato' non 'ho andato' — 'andare' vuole essere come ausiliare. Comunque, dove sei andato di bello?"
- "Una piccola cosa: 'mi piace' va con 'a me', quindi 'a me piace il caffè', non 'io piace il caffè'. Allora, prendi tanti caffè al giorno?"
- "Eh, 'la macchina' è femminile, quindi 'la mia macchina', non 'il mio macchina'. Comunque, raccontami della tua macchina!"

If the learner had NO mistakes, just respond naturally without any correction. Maybe say "Perfetto!" or "Bene detto!" before continuing.

Other rules:
- Speak like a real Italian friend, casual and warm
- Use natural phrasing, filler words (allora, tipo, cioè, senti, insomma, dai, boh, mah)
- Keep total response 2-4 sentences (correction + continuation combined)
- The correction part should sound like a friend gently teaching, not a teacher lecturing
- After the correction, ALWAYS continue the conversation with a question or comment

IMPORTANT: You must respond with valid JSON only.

{
  "response": "Your Italian response — start with quick correction if needed, then continue conversation (2-4 sentences total)",
  "correctedSentence": "The user's full sentence rewritten correctly (if they had errors)",
  "corrections": [
    {
      "original": "what they said wrong",
      "corrected": "correct version",
      "explanation": "Detailed grammar explanation: what rule, what tense, why",
      "category": "verb_conjugation|gender_agreement|articles|prepositions|word_order|vocabulary|pronouns|subjunctive|spelling|other"
    }
  ],
  "vocabulary": ["useful_word_1", "useful_word_2"],
  "topicSuggestion": "If the conversation is dying, suggest a new topic direction here. Otherwise null.",
  "encouragement": "Brief encouragement in English (1 sentence)"
}

LEARNER CONTEXT:
- Level: ${level}
- Words learned: ${vocabCount}
${weakAreas.length > 0 ? `- Weak areas: ${weakAreas.join(', ')}` : ''}
${recentMistakes.length > 0 ? `- Recent mistakes: ${recentMistakes.join('; ')}` : ''}
${assessNotes ? `- ${assessNotes}` : ''}

CONVERSATION RULES:
- Naturally steer the conversation to touch their weak areas (${weakAreas.join(', ') || 'general grammar'}) without being obvious about it
- Ask follow-up questions to keep the conversation going — don't let it die
- If they give short answers, gently push for more: "Dai, raccontami di più!" or "E poi cosa è successo?"
- Vary topics: if you've been on one topic for 3+ exchanges, transition to something new
- React to what they say — be genuinely interested, not robotic
- Match ${level} level — challenge them slightly above comfort zone
- Remember: this is LISTENING practice too, so enunciate clearly even though you're casual`
}

export default function DailyPractice() {
  const { state, addXP, addMessage, addMistakes, addVocabulary, activeLevel } = useGame()
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const [sessionStats, setSessionStats] = useState({ exchanges: 0, corrections: 0, perfectCount: 0 })
  const [showSummary, setShowSummary] = useState(false)

  const { speak, speaking, stopSpeaking } = useSpeechSynthesis()
  const { isListening, transcript, interimTranscript, start, stop, reset, supported: micSupported } = useSpeechRecognition()
  const inputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const timerRef = useRef(null)

  const systemPrompt = useMemo(() => buildDailyPrompt(activeLevel, state), [activeLevel, state.mistakeCounts, state.assessmentResult])

  // Timer
  useEffect(() => {
    if (sessionStarted && !paused) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
      return () => clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [sessionStarted, paused])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Update input with speech transcript
  useEffect(() => {
    if (transcript && inputRef.current) {
      inputRef.current.value = transcript
    }
  }, [transcript])

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Start the session — AI speaks first
  const handleStart = useCallback(async () => {
    setSessionStarted(true)
    setIsLoading(true)
    setError(null)

    const starter = getDailyStarter()

    try {
      const result = await sendMessage({
        messages: [{ role: 'user', content: 'Ciao!' }],
        systemPrompt: systemPrompt + `\n\nSTART THE CONVERSATION with this opener (modify slightly to sound natural): "${starter}"`,
      })

      const aiMessage = {
        role: 'assistant',
        text: result.message,
        corrections: [],
        encouragement: '',
        vocabulary: result.vocabulary || [],
        revealed: false,
        timestamp: Date.now(),
      }

      setMessages([aiMessage])
      // Speak the opening message
      speak(result.message, 0.9)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [systemPrompt, speak])

  // Send user's response
  const handleSend = useCallback(async () => {
    const text = inputRef.current?.value?.trim() || transcript?.trim()
    if (!text || isLoading) return

    inputRef.current.value = ''
    reset()

    const userMessage = { role: 'user', text, timestamp: Date.now() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setIsLoading(true)
    setError(null)

    try {
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.text,
      }))

      const result = await sendMessage({
        messages: apiMessages,
        systemPrompt,
      })

      const corrections = result.corrections || []
      const isPerfect = corrections.length === 0

      const aiMessage = {
        role: 'assistant',
        text: result.message,
        originalUserText: text,
        correctedSentence: result.correctedSentence || '',
        corrections,
        encouragement: result.encouragement || '',
        vocabulary: result.vocabulary || [],
        revealed: false,
        timestamp: Date.now(),
      }

      setMessages(prev => [...prev, aiMessage])

      // Stats
      setSessionStats(prev => ({
        exchanges: prev.exchanges + 1,
        corrections: prev.corrections + corrections.length,
        perfectCount: prev.perfectCount + (isPerfect ? 1 : 0),
      }))

      // Gamification
      addXP(isPerfect ? 15 : 10)
      addMessage(isPerfect)
      if (result.vocabulary?.length > 0) addVocabulary(result.vocabulary)
      if (corrections.length > 0) {
        addMistakes(corrections.map(c => ({ ...c, sentenceContext: text })))
      }

      // Speak the AI's response
      speak(result.message, 0.9)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, transcript, systemPrompt, speak, addXP, addMessage, addVocabulary, addMistakes, reset])

  const handleMicStop = () => {
    stop()
    setTimeout(() => {
      const finalText = inputRef.current?.value?.trim()
      if (finalText) handleSend()
    }, 600)
  }

  const toggleReveal = (index) => {
    setMessages(prev => prev.map((m, i) => i === index ? { ...m, revealed: !m.revealed } : m))
  }

  // Pre-session screen
  if (!sessionStarted) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-[calc(100vh-150px)]">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-terracotta to-coral flex items-center justify-center shadow-lg">
            <MessageCircle size={44} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-cream mb-3">Daily Practice</h1>
          <p className="text-navy-600 mb-2 leading-relaxed">
            Immersive voice conversation. The AI speaks to you in Italian — you listen, then reply by speaking back. No reading, no typing. Just talking.
          </p>
          <p className="text-xs text-navy-600 mb-8">
            Tap the text to reveal it if you need help understanding something.
          </p>

          <div className="card text-left mb-6">
            <h3 className="text-sm font-semibold text-cream mb-3">Today's session:</h3>
            <div className="space-y-2 text-xs text-navy-600">
              <p className="flex items-center gap-2"><Volume2 size={14} className="text-terracotta shrink-0" /> AI speaks to you — listen without reading</p>
              <p className="flex items-center gap-2"><Mic size={14} className="text-terracotta shrink-0" /> You reply by speaking (or use your dictation app)</p>
              <p className="flex items-center gap-2"><Eye size={14} className="text-terracotta shrink-0" /> Tap any message to reveal the text if needed</p>
              <p className="flex items-center gap-2"><BookOpen size={14} className="text-terracotta shrink-0" /> Corrections shown below each exchange — review after</p>
            </div>
          </div>

          <button onClick={handleStart} disabled={isLoading} className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-3 w-full justify-center">
            <Play size={22} /> Start Conversation
          </button>
        </div>
      </motion.div>
    )
  }

  // Session summary
  if (showSummary) {
    const avgAccuracy = sessionStats.exchanges > 0
      ? Math.round(((sessionStats.exchanges - sessionStats.corrections) / sessionStats.exchanges) * 100)
      : 100
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto text-center py-12">
        <Trophy size={48} className="text-yellow-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-cream mb-2">Session Complete!</h2>
        <p className="text-navy-600 mb-6">You practiced for {formatTime(elapsed)}</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card py-3">
            <p className="text-2xl font-bold text-cream">{sessionStats.exchanges}</p>
            <p className="text-xs text-navy-600">Exchanges</p>
          </div>
          <div className="card py-3">
            <p className="text-2xl font-bold text-olive">{sessionStats.perfectCount}</p>
            <p className="text-xs text-navy-600">Perfect</p>
          </div>
          <div className="card py-3">
            <p className="text-2xl font-bold text-terracotta">{sessionStats.corrections}</p>
            <p className="text-xs text-navy-600">Corrections</p>
          </div>
        </div>

        <button onClick={() => { setSessionStarted(false); setMessages([]); setElapsed(0); setSessionStats({ exchanges: 0, corrections: 0, perfectCount: 0 }); setShowSummary(false) }}
          className="btn-primary inline-flex items-center gap-2">
          <RefreshCw size={16} /> New Session
        </button>
      </motion.div>
    )
  }

  // Main conversation view
  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-cream">Daily Practice</h1>
          <span className="text-xs text-navy-600 bg-navy-800 px-2 py-0.5 rounded-full">{activeLevel}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <Clock size={14} className="text-navy-600" />
            <span className="font-mono text-cream">{formatTime(elapsed)}</span>
          </div>
          <button onClick={() => setPaused(!paused)} className="text-navy-600 hover:text-cream transition-colors">
            {paused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button onClick={() => setShowSummary(true)} className="text-xs text-navy-600 hover:text-cream transition-colors bg-navy-800 px-2 py-1 rounded-lg">
            End
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4">
        {messages.map((msg, i) => (
          <DailyMessage
            key={i}
            message={msg}
            index={i}
            onReveal={() => toggleReveal(i)}
            onSpeak={() => speak(msg.text, 0.9)}
            speaking={speaking}
          />
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-navy-700/50 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-navy-600 text-sm">
                <div className="w-2 h-2 bg-terracotta rounded-full animate-pulse" />
                Thinking...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-2 mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Input area — centered mic button */}
      <div className="p-4 flex flex-col items-center gap-3">
        {/* Live transcript while speaking */}
        {isListening && (transcript || interimTranscript) && (
          <div className="w-full p-2 bg-terracotta/5 border border-terracotta/10 rounded-xl">
            <p className="text-sm text-cream/70 italic text-center">
              {transcript}
              {interimTranscript && <span className="text-terracotta/50"> {interimTranscript}</span>}
            </p>
          </div>
        )}

        <div className="flex items-center gap-4">
          {/* Mic button — primary interaction */}
          <button
            onClick={isListening ? handleMicStop : () => { reset(); start() }}
            disabled={isLoading || speaking || !micSupported}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
              isListening
                ? 'bg-red-500 hover:bg-red-600'
                : isLoading || speaking
                  ? 'bg-navy-700 opacity-50'
                  : 'bg-gradient-to-br from-terracotta to-coral hover:scale-105'
            }`}
          >
            {isListening ? <Square size={28} className="text-white fill-white" /> : <Mic size={32} className="text-white" />}
            {isListening && (
              <span className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-30" />
            )}
          </button>
        </div>

        <p className="text-xs text-navy-600">
          {speaking ? 'Listening to AI...' : isListening ? 'Speaking... tap to send' : isLoading ? 'Waiting...' : 'Tap to speak'}
        </p>

        {/* Fallback text input for dictation app users */}
        <div className="w-full flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Or type / paste from dictation app..."
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend() } }}
            className="flex-1 bg-navy-800/50 border border-navy-700/30 rounded-xl px-3 py-2 text-cream placeholder:text-navy-700 text-sm focus:outline-none focus:border-terracotta/30"
          />
          <button onClick={handleSend} disabled={isLoading} className="px-3 py-2 bg-navy-800 rounded-xl text-navy-600 hover:text-cream transition-colors text-sm">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

// Individual message bubble — audio-first, reveal on tap
function DailyMessage({ message, index, onReveal, onSpeak, speaking }) {
  const isUser = message.role === 'user'
  const isAI = message.role === 'assistant'
  const [showCorrections, setShowCorrections] = useState(false)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${
        isUser
          ? 'bg-terracotta/20 border border-terracotta/20 rounded-2xl rounded-br-md'
          : 'bg-navy-700/50 border border-navy-700/50 rounded-2xl rounded-bl-md'
      } px-4 py-3`}>

        {/* AI message: audio-first — hidden by default */}
        {isAI && !message.revealed ? (
          <div className="flex items-center gap-3">
            <button onClick={onSpeak} className="shrink-0 w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center hover:bg-navy-700 transition-colors">
              <Volume2 size={18} className={`text-cream ${speaking ? 'animate-pulse' : ''}`} />
            </button>
            <div className="flex-1">
              <p className="text-sm text-navy-600 italic">Audio message — listen first</p>
              <button onClick={onReveal} className="text-xs text-navy-700 hover:text-navy-600 transition-colors mt-1 flex items-center gap-1">
                <Eye size={10} /> Reveal text
              </button>
            </div>
          </div>
        ) : isAI ? (
          <div>
            <div className="flex items-start gap-2">
              <button onClick={onSpeak} className="shrink-0 mt-0.5 text-navy-600 hover:text-cream transition-colors">
                <Volume2 size={14} />
              </button>
              <p className="text-sm text-cream leading-relaxed">{message.text}</p>
            </div>
            <button onClick={onReveal} className="text-xs text-navy-700 hover:text-navy-600 transition-colors mt-1 flex items-center gap-1">
              <EyeOff size={10} /> Hide text
            </button>
          </div>
        ) : (
          // User message — always show
          <p className="text-sm text-cream">{message.text}</p>
        )}

        {/* Corrections toggle for AI messages that had corrections */}
        {isAI && message.corrections && message.corrections.length > 0 && (
          <div className="mt-2 pt-2 border-t border-navy-600/20">
            <button
              onClick={() => setShowCorrections(!showCorrections)}
              className="flex items-center gap-1.5 text-xs text-coral hover:text-coral/80 transition-colors"
            >
              <AlertCircle size={12} />
              {message.corrections.length} correction{message.corrections.length !== 1 ? 's' : ''}
              {showCorrections ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            <AnimatePresence>
              {showCorrections && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  {/* Inline diff */}
                  {message.correctedSentence && (
                    <div className="mt-2 bg-olive/10 border border-olive/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-navy-600 mb-0.5 font-medium">Correct version:</p>
                      <p className="text-xs text-olive font-medium">{message.correctedSentence}</p>
                    </div>
                  )}

                  <div className="mt-2 space-y-2">
                    {message.corrections.map((c, j) => (
                      <div key={j} className="bg-navy-800/40 rounded-lg px-2 py-1.5 text-xs">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-red-400 line-through">{c.original}</span>
                          <span className="text-navy-600">→</span>
                          <span className="text-olive font-semibold">{c.corrected}</span>
                        </div>
                        <p className="text-cream/60 text-xs">{c.explanation}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Perfect indicator */}
        {isAI && message.corrections && message.corrections.length === 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-navy-600/20 flex items-center gap-1">
            <CheckCircle size={11} className="text-olive" />
            <span className="text-xs text-olive">Perfect!</span>
          </div>
        )}
      </div>
    </div>
  )
}
