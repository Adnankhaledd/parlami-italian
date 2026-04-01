import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, RotateCcw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatBubble from './ChatBubble'
import MicButton from './MicButton'
import XPNotification from '../Gamification/XPNotification'
import useSpeechRecognition from '../../hooks/useSpeechRecognition'
import useSpeechSynthesis from '../../hooks/useSpeechSynthesis'
import { useGame } from '../../contexts/GameContext'
import { sendMessage } from '../../services/api'
import { applyColloquialMode } from '../../utils/colloquialPrompt'
import { buildMistakeContext } from '../../utils/mistakeContext'

function getDefaultPrompt(level = 'B1') {
  return `You are a friendly Italian conversation partner helping a ${level}-level learner practice speaking. Your name is Parlami.

IMPORTANT: You must respond with valid JSON only. No text before or after the JSON.

Respond with this exact JSON structure:
{
  "response": "Your Italian response here (1-3 sentences, ${level} level)",
  "corrections": [
    {
      "original": "what the user said wrong",
      "corrected": "the correct Italian",
      "explanation": "Brief English explanation of the grammar/vocabulary rule",
      "category": "one of: verb_conjugation, gender_agreement, articles, prepositions, word_order, vocabulary, pronouns, subjunctive, spelling, other"
    }
  ],
  "vocabulary": ["new", "words", "used"],
  "encouragement": "Brief encouraging comment in English (1 sentence)"
}

Correction categories explained:
- verb_conjugation: wrong tense, wrong conjugation form
- gender_agreement: masculine/feminine mismatch on nouns/adjectives
- articles: wrong definite/indefinite article
- prepositions: wrong preposition or missing articulated preposition
- word_order: sentence structure issues
- vocabulary: wrong word choice, false friends
- pronouns: object/reflexive/relative pronoun errors
- subjunctive: missing or wrong subjunctive mood
- spelling: typos, missing accents
- other: anything else

Rules:
- Speak like a real Italian friend, NOT a textbook. Use natural, everyday Italian the way people actually talk to each other.
- Include casual expressions, filler words (tipo, cioè, insomma, allora), and natural phrasing.
- Keep responses short: 1-3 sentences
- Identify ALL grammar, vocabulary, and syntax errors in the user's Italian
- ALWAYS include the "category" field for each correction
- If the user's Italian is perfect, return an empty corrections array
- Match your Italian to ${level} level — challenge them slightly above their comfort zone
- Be warm, patient, and encouraging
- Include 1-3 new vocabulary words the user might not know
- If the user writes in English, gently encourage them to try in Italian
- VARIETY IS CRITICAL: Never repeat the same questions, topics, or conversation starters. Each conversation should explore different themes (food, travel, work, hobbies, culture, current events, family, dreams, opinions, daily routines, etc.)
- Vary your sentence structures, vocabulary level, and conversational style to keep practice fresh and challenging`
}

export default function ChatWindow({
  systemPrompt,
  scenario = null,
  onScenarioProgress,
  onAssessment,
  onMessageCount,
  placeholder = 'Speak or type in Italian...',
  listenMode = false,
  forceMessage = null,
}) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [xpGained, setXpGained] = useState(null)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const { isListening, transcript, interimTranscript, start, stop, reset, supported: micSupported } = useSpeechRecognition()
  const { speak, speaking, stopSpeaking, supported: ttsSupported } = useSpeechSynthesis()
  const { addXP, addMessage, addVocabulary, addMistakes, state: gameState, setColloquialMode, activeLevel } = useGame()

  // Use provided prompt or generate default with active level
  const basePrompt = systemPrompt || getDefaultPrompt(activeLevel)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Update input with speech transcript
  useEffect(() => {
    if (transcript) {
      setInputText(transcript)
    }
  }, [transcript])

  // Handle forced message (e.g. assessment cutoff)
  useEffect(() => {
    if (forceMessage && !isLoading) {
      setInputText(forceMessage)
      // Trigger send on next tick
      setTimeout(() => {
        const fakeEvent = { trim: () => forceMessage }
        // Directly invoke send logic
        const text = forceMessage
        const userMessage = { role: 'user', text, timestamp: Date.now() }
        const newMessages = [...messages, userMessage]
        setMessages(newMessages)
        setInputText('')
        setIsLoading(true)

        const apiMessages = newMessages.map((m) => ({
          role: m.role,
          content: m.role === 'user' ? m.text : m.rawResponse || m.text,
        }))

        const effectivePrompt = applyColloquialMode(basePrompt + buildMistakeContext(gameState), gameState.colloquialMode)

        sendMessage({ messages: apiMessages, systemPrompt: effectivePrompt, scenario })
          .then((result) => {
            const aiMessage = {
              role: 'assistant', text: result.message, rawResponse: result.message,
              corrections: result.corrections || [], encouragement: result.encouragement || '',
              vocabulary: result.vocabulary || [], timestamp: Date.now(),
            }
            setMessages((prev) => [...prev, aiMessage])
            if (result.assessment && onAssessment) onAssessment(result.assessment)
            if (ttsSupported && result.message) speak(result.message)
          })
          .catch((err) => setError(err.message))
          .finally(() => setIsLoading(false))
      }, 100)
    }
  }, [forceMessage]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = useCallback(async () => {
    const text = inputText.trim()
    if (!text || isLoading) return

    // Add user message
    const userMessage = { role: 'user', text, timestamp: Date.now() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputText('')
    reset()
    setError(null)
    setIsLoading(true)

    try {
      // Build conversation history for API
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.role === 'user' ? m.text : m.rawResponse || m.text,
      }))

      const effectivePrompt = applyColloquialMode(systemPrompt, gameState.colloquialMode)

      const result = await sendMessage({
        messages: apiMessages,
        systemPrompt: effectivePrompt,
        scenario,
      })

      // Parse AI response
      const aiMessage = {
        role: 'assistant',
        text: result.message,
        rawResponse: result.message,
        corrections: result.corrections || [],
        encouragement: result.encouragement || '',
        vocabulary: result.vocabulary || [],
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, aiMessage])

      // Gamification
      const isPerfect = !result.corrections || result.corrections.length === 0
      let xp = 10 // base XP for speaking

      if (isPerfect) {
        xp += 25 // bonus for perfect sentence
      }

      addXP(xp)
      addMessage(isPerfect)

      if (result.vocabulary && result.vocabulary.length > 0) {
        addVocabulary(result.vocabulary)
        xp += result.vocabulary.length * 5
      }

      // Track mistakes with sentence context
      if (result.corrections && result.corrections.length > 0) {
        const correctionsWithContext = result.corrections.map((c) => ({
          ...c,
          sentenceContext: text, // the user's original message
        }))
        addMistakes(correctionsWithContext)
      }

      // Handle assessment result
      if (result.assessment && onAssessment) {
        onAssessment(result.assessment)
      }

      // Show XP notification
      setXpGained(xp)
      setTimeout(() => setXpGained(null), 2000)

      // Auto-speak the response
      if (ttsSupported && result.message) {
        speak(result.message)
      }

      // Notify scenario of progress
      if (onScenarioProgress) {
        onScenarioProgress(newMessages.length + 1)
      }

      // Notify message count (user messages only)
      if (onMessageCount) {
        const userMsgCount = newMessages.filter(m => m.role === 'user').length
        onMessageCount(userMsgCount)
      }
    } catch (err) {
      setError(err.message || 'Failed to get response. Make sure the backend is running.')
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [inputText, messages, isLoading, systemPrompt, scenario, addXP, addMessage, addVocabulary, addMistakes, speak, ttsSupported, reset, onScenarioProgress])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleMicStop = () => {
    stop()
    // Auto-send after a short delay to capture final transcript
    setTimeout(() => {
      const finalText = inputRef.current?.value?.trim()
      if (finalText) {
        handleSend()
      }
    }, 500)
  }

  const handleNewChat = () => {
    setMessages([])
    setInputText('')
    setError(null)
    reset()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-terracotta/20 to-coral/20 flex items-center justify-center">
                <span className="text-3xl">🇮🇹</span>
              </div>
              <h3 className="text-lg font-semibold text-cream mb-2">
                {scenario ? scenario.titleEn : 'Free Conversation'}
              </h3>
              <p className="text-navy-600 text-sm max-w-sm">
                {scenario
                  ? scenario.description
                  : 'Start speaking or typing in Italian. I\'ll help you practice and correct any mistakes!'}
              </p>
            </div>
          </div>
        )}

        {messages.map((message, i) => (
          <ChatBubble
            key={i}
            message={message}
            onSpeak={speaking ? stopSpeaking : speak}
            speaking={speaking}
            audioOnly={listenMode && message.role === 'assistant'}
          />
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start mb-4"
          >
            <div className="bg-navy-700/50 border border-navy-700/50 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-navy-600">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-4 mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Colloquial toggle */}
      <div className="border-t border-navy-700/30 px-4 pt-2 flex items-center gap-2">
        <button
          onClick={() => setColloquialMode(!gameState.colloquialMode)}
          className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
            gameState.colloquialMode
              ? 'bg-coral/15 text-coral border border-coral/30'
              : 'bg-navy-800 text-navy-600 border border-navy-700/50 hover:text-cream'
          }`}
        >
          {gameState.colloquialMode ? '~ Colloquial' : 'Formal'}
        </button>
      </div>

      {/* Input area */}
      <div className="border-t-0 p-4 pt-2">
        {/* Interim speech display */}
        {isListening && (interimTranscript || transcript) && (
          <div className="mb-3 p-3 bg-terracotta/5 border border-terracotta/10 rounded-xl">
            <p className="text-sm text-cream/70 italic">
              {transcript}
              {interimTranscript && (
                <span className="text-terracotta/50">{' '}{interimTranscript}</span>
              )}
            </p>
          </div>
        )}

        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Listening...' : placeholder}
              disabled={isLoading}
              className="w-full bg-navy-800 border border-navy-700/50 rounded-xl px-4 py-3 text-cream placeholder:text-navy-600 focus:outline-none focus:border-terracotta/50 transition-colors text-sm"
            />
          </div>

          <MicButton
            isListening={isListening}
            onStart={start}
            onStop={handleMicStop}
            disabled={isLoading}
            supported={micSupported}
          />

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="w-11 h-11 rounded-xl bg-terracotta hover:bg-terracotta-dark disabled:bg-navy-700 disabled:opacity-50 flex items-center justify-center transition-colors shrink-0"
          >
            <Send size={18} className="text-white" />
          </button>

          {messages.length > 0 && (
            <button
              onClick={handleNewChat}
              className="w-11 h-11 rounded-xl bg-navy-700 hover:bg-navy-600 flex items-center justify-center transition-colors shrink-0"
              title="New conversation"
            >
              <RotateCcw size={16} className="text-navy-600" />
            </button>
          )}
        </div>
      </div>

      {/* XP Notification */}
      <XPNotification amount={xpGained} show={xpGained !== null} />
    </div>
  )
}
