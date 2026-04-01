import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, Loader2, CheckCircle, XCircle, ArrowRight, RotateCcw, Volume2, ChevronDown, ChevronUp } from 'lucide-react'
import { useGame } from '../contexts/GameContext'
import { sendMessage } from '../services/api'
import useSpeechSynthesis from '../hooks/useSpeechSynthesis'
import { buildMistakeContext } from '../utils/mistakeContext'

const TOPICS = [
  { id: 'daily', label: 'Daily Life', icon: '☀️', desc: 'Routine, food, home' },
  { id: 'travel', label: 'Travel', icon: '✈️', desc: 'Places, transport, hotels' },
  { id: 'work', label: 'Work & Study', icon: '💼', desc: 'Job, school, career' },
  { id: 'opinions', label: 'Opinions', icon: '💭', desc: 'Culture, news, ideas' },
  { id: 'hypothetical', label: 'Hypothetical', icon: '🔮', desc: 'If, would, could' },
  { id: 'random', label: 'Mix', icon: '🎲', desc: 'Surprise me' },
]

const QA_SYSTEM_PROMPT = (topic, level, turnCount) => `You are Parlami, an Italian conversation partner running a Q&A practice session.

IMPORTANT: Respond with valid JSON only. No text before or after the JSON.

The topic area is: ${topic}
The learner is at ${level} level.
This is turn ${turnCount} of the current topic thread.

Your job:
- Ask ONE clear question in Italian to the learner
- After they respond, correct their Italian, then ask a FOLLOW-UP question based on their answer
- Follow-ups should dig deeper into what they said (not jump to a new topic)
- After 3-4 follow-ups on the same thread, naturally transition to a related subtopic
- Gradually increase complexity: start with factual questions, move to opinions, then hypotheticals

Question difficulty by turn:
- Turns 1-2: Simple factual (Dove...? Quando...? Cosa...? Chi...?)
- Turns 3-4: Descriptive (Come...? Perché...? Racconta...)
- Turns 5+: Opinion/hypothetical (Cosa ne pensi...? Se potessi...? Secondo te...?)

Respond with this JSON:
{
  "response": "Your brief comment on their answer in Italian (1 sentence, acknowledging what they said) + your next question in Italian",
  "question": "Just the question part, extracted for display",
  "corrections": [
    {
      "original": "what they said wrong",
      "corrected": "correct Italian",
      "explanation": "Brief English explanation",
      "category": "verb_conjugation|gender_agreement|articles|prepositions|word_order|vocabulary|pronouns|subjunctive|spelling|other"
    }
  ],
  "modelAnswer": "A natural Italian answer that a native speaker might give to your previous question (2-3 sentences). Only include this after the learner has answered, not on the first question.",
  "vocabulary": ["useful", "new", "words"],
  "encouragement": "Brief encouraging comment in English",
  "topicTransition": false
}

Rules:
- Keep questions natural, not like an exam
- Reference their previous answers to make follow-ups feel connected
- If their answer is very short, encourage them to elaborate: "Puoi dirmi di più?"
- Include a modelAnswer showing how a native would answer YOUR PREVIOUS question (helps them learn natural phrasing)
- Set topicTransition to true when starting a new subtopic thread
- Be warm and conversational, like a friend practicing with them`

export default function QAPractice() {
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [messages, setMessages] = useState([]) // [{role, text, question?, corrections?, modelAnswer?, encouragement?}]
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [turnCount, setTurnCount] = useState(0)
  const [sessionStats, setSessionStats] = useState({ questions: 0, perfect: 0, mistakes: 0 })
  const [expandedModel, setExpandedModel] = useState(null) // index of expanded model answer

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const { speak, speaking, stopSpeaking } = useSpeechSynthesis()
  const { addXP, addMessage, addMistakes, addVocabulary } = useGame()
  const { state } = useGame()
  const level = state.placementLevel || state.assessmentResult?.level || 'B1'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Start session: get first question
  const startSession = useCallback(async (topic) => {
    setSelectedTopic(topic)
    setMessages([])
    setTurnCount(1)
    setSessionStats({ questions: 0, perfect: 0, mistakes: 0 })
    setIsLoading(true)
    setError(null)

    try {
      const result = await sendMessage({
        messages: [{ role: 'user', content: 'Start the Q&A session. Ask me your first question.' }],
        systemPrompt: QA_SYSTEM_PROMPT(topic.label, level, 1) + buildMistakeContext(state),
      })

      const aiMsg = {
        role: 'assistant',
        text: result.message,
        question: result.message,
        corrections: [],
        modelAnswer: null,
      }
      setMessages([aiMsg])
      speak(result.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [level, speak])

  const handleSend = useCallback(async () => {
    const text = inputText.trim()
    if (!text || isLoading) return

    const userMsg = { role: 'user', text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInputText('')
    setError(null)
    setIsLoading(true)

    const newTurn = turnCount + 1
    setTurnCount(newTurn)

    try {
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.text,
      }))

      const result = await sendMessage({
        messages: apiMessages,
        systemPrompt: QA_SYSTEM_PROMPT(selectedTopic.label, level, newTurn) + buildMistakeContext(state),
      })

      const isPerfect = !result.corrections || result.corrections.length === 0
      const mistakeCount = result.corrections?.length || 0

      // Try to extract modelAnswer from the parsed response
      let modelAnswer = null
      try {
        const parsed = JSON.parse(result.message)
        modelAnswer = parsed.modelAnswer
      } catch {
        // response wasn't raw JSON, check if backend extracted it
      }

      const aiMsg = {
        role: 'assistant',
        text: result.message,
        corrections: result.corrections || [],
        modelAnswer: modelAnswer,
        encouragement: result.encouragement || '',
        vocabulary: result.vocabulary || [],
      }

      setMessages((prev) => [...prev, aiMsg])

      // Gamification
      addXP(isPerfect ? 15 : 10)
      addMessage(isPerfect)
      if (result.corrections?.length > 0) addMistakes(result.corrections)
      if (result.vocabulary?.length > 0) addVocabulary(result.vocabulary)

      setSessionStats((prev) => ({
        questions: prev.questions + 1,
        perfect: prev.perfect + (isPerfect ? 1 : 0),
        mistakes: prev.mistakes + mistakeCount,
      }))

      // Speak the response
      speak(result.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [inputText, messages, isLoading, turnCount, selectedTopic, level, speak, addXP, addMessage, addMistakes, addVocabulary])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Topic selection
  if (!selectedTopic) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-cream">Q&A Practice</h1>
          <p className="text-navy-600">I ask, you answer in Italian. I correct and follow up.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl">
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => startSession(topic)}
              className="card-hover text-left group cursor-pointer"
            >
              <span className="text-2xl mb-2 block">{topic.icon}</span>
              <h3 className="text-sm font-bold text-cream mb-0.5">{topic.label}</h3>
              <p className="text-xs text-navy-600">{topic.desc}</p>
            </button>
          ))}
        </div>
      </motion.div>
    )
  }

  // Active session
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-cream">Q&A: {selectedTopic.icon} {selectedTopic.label}</h1>
          <p className="text-xs text-navy-600">
            {sessionStats.questions} answered · {sessionStats.perfect} perfect · {sessionStats.mistakes} corrections
          </p>
        </div>
        <button
          onClick={() => setSelectedTopic(null)}
          className="flex items-center gap-2 text-navy-600 hover:text-cream transition-colors text-sm"
        >
          <RotateCcw size={14} /> New Topic
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'assistant' ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {/* AI question/response */}
                <div className="bg-navy-700/50 border border-navy-700/50 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                  <p className="text-sm text-cream leading-relaxed">{msg.text}</p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => speaking ? stopSpeaking() : speak(msg.text)}
                      className="text-navy-600 hover:text-olive transition-colors p-1"
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>

                  {/* Corrections */}
                  {msg.corrections?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-navy-600/30">
                      <span className="text-xs font-semibold text-coral flex items-center gap-1 mb-2">
                        <XCircle size={12} /> Corrections
                      </span>
                      {msg.corrections.map((c, j) => (
                        <div key={j} className="text-xs mb-1.5">
                          <span className="text-red-400/80 line-through">{c.original}</span>
                          <span className="text-navy-600 mx-1">→</span>
                          <span className="text-olive font-medium">{c.corrected}</span>
                          <p className="text-navy-600 pl-1 mt-0.5">{c.explanation}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.corrections?.length === 0 && i > 0 && (
                    <div className="mt-2 pt-2 border-t border-navy-600/30 flex items-center gap-1.5">
                      <CheckCircle size={12} className="text-olive" />
                      <span className="text-xs text-olive font-medium">Perfect Italian!</span>
                    </div>
                  )}

                  {/* Model answer (collapsible) */}
                  {msg.modelAnswer && (
                    <div className="mt-2 pt-2 border-t border-navy-600/30">
                      <button
                        onClick={() => setExpandedModel(expandedModel === i ? null : i)}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                      >
                        {expandedModel === i ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        Native speaker example
                      </button>
                      <AnimatePresence>
                        {expandedModel === i && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <p className="text-xs text-blue-400/70 mt-1.5 italic bg-blue-500/5 rounded-lg p-2">{msg.modelAnswer}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Encouragement */}
                  {msg.encouragement && (
                    <p className="text-xs text-navy-600 mt-2 italic">{msg.encouragement}</p>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                <div className="bg-terracotta/20 border border-terracotta/20 rounded-2xl rounded-br-md px-4 py-3 max-w-[85%]">
                  <p className="text-sm text-cream">{msg.text}</p>
                </div>
              </motion.div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-navy-600 text-sm">
            <Loader2 size={14} className="animate-spin" />
            Thinking...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-navy-700/30 pt-4">
        <div className="flex items-end gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Answer in Italian..."
            disabled={isLoading}
            className="flex-1 bg-navy-800 border border-navy-700/50 rounded-xl px-4 py-3 text-cream placeholder:text-navy-600 focus:outline-none focus:border-terracotta/50 transition-colors text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="w-11 h-11 rounded-xl bg-terracotta hover:bg-terracotta-dark disabled:bg-navy-700 disabled:opacity-50 flex items-center justify-center transition-colors shrink-0"
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
