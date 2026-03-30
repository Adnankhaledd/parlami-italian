import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Mic, MicOff, Volume2, CheckCircle, XCircle, RotateCcw, Keyboard } from 'lucide-react'
import useSpeechSynthesis from '../../hooks/useSpeechSynthesis'
import useSpeechRecognition from '../../hooks/useSpeechRecognition'
import { compareWords } from '../../utils/textComparison'

const DIFFICULTY_RATES = { 1: 0.7, 2: 0.8, 3: 0.9, 4: 1.0, 5: 1.1 }

export default function ShadowingExercise({ sentence, translation, difficulty = 2, onComplete }) {
  const [phase, setPhase] = useState('listen') // listen | repeat | type | result
  const [result, setResult] = useState(null)
  const [typedInput, setTypedInput] = useState('')

  const { speak, speaking } = useSpeechSynthesis()
  const { isListening, transcript, start, stop, reset, supported: micSupported } = useSpeechRecognition()

  const rate = DIFFICULTY_RATES[difficulty] || 0.9

  const handlePlay = useCallback(() => {
    speak(sentence, rate)
  }, [sentence, speak, rate])

  const handleStartRepeat = useCallback(() => {
    reset()
    setPhase('repeat')
    start()
  }, [start, reset])

  const handleStartTyping = useCallback(() => {
    setTypedInput('')
    setPhase('type')
  }, [])

  const handleStopRepeat = useCallback(() => {
    stop()
    setTimeout(() => {
      const finalText = transcript || ''
      const comparison = compareWords(finalText, sentence)
      setResult(comparison)
      setPhase('result')
    }, 500)
  }, [stop, transcript, sentence])

  const handleSubmitTyped = useCallback(() => {
    const comparison = compareWords(typedInput, sentence)
    setResult(comparison)
    setPhase('result')
  }, [typedInput, sentence])

  const handleRetry = () => {
    reset()
    setResult(null)
    setTypedInput('')
    setPhase('listen')
  }

  const handleNext = () => {
    if (onComplete) onComplete(result?.accuracy || 0)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmitTyped()
    }
  }

  return (
    <div className="card">
      {/* Sentence display */}
      <div className="text-center mb-4">
        <p className="text-cream font-medium">{sentence}</p>
        {translation && <p className="text-xs text-navy-600 mt-1">{translation}</p>}
      </div>

      <AnimatePresence mode="wait">
        {phase === 'listen' && (
          <motion.div key="listen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <button
              onClick={handlePlay}
              disabled={speaking}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-terracotta to-coral flex items-center justify-center mx-auto hover:scale-105 transition-transform disabled:opacity-50 mb-3"
            >
              {speaking ? (
                <Volume2 size={24} className="text-white animate-pulse" />
              ) : (
                <Play size={24} className="text-white ml-0.5" />
              )}
            </button>
            <p className="text-xs text-navy-600 mb-4">Listen first, then repeat or type</p>
            <div className="flex gap-2">
              <button
                onClick={handleStartRepeat}
                disabled={!micSupported}
                className="flex-1 btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Mic size={16} />
                Speak
              </button>
              <button
                onClick={handleStartTyping}
                className="flex-1 py-2.5 px-4 rounded-xl bg-navy-700 text-cream hover:bg-navy-600 transition-colors text-sm font-medium inline-flex items-center justify-center gap-2"
              >
                <Keyboard size={16} />
                Type
              </button>
            </div>
          </motion.div>
        )}

        {phase === 'repeat' && (
          <motion.div key="repeat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-navy-700'}`}>
              {isListening ? <Mic size={24} className="text-white" /> : <MicOff size={24} className="text-navy-600" />}
            </div>
            {transcript && (
              <p className="text-sm text-cream/70 italic mb-3">{transcript}</p>
            )}
            <p className="text-xs text-navy-600 mb-4">{isListening ? 'Listening... speak now' : 'Processing...'}</p>
            <button onClick={handleStopRepeat} className="btn-primary">
              Done Speaking
            </button>
          </motion.div>
        )}

        {phase === 'type' && (
          <motion.div key="type" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="text-xs text-navy-600 mb-2">Type what you heard:</p>
            <input
              type="text"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type the Italian sentence..."
              autoFocus
              className="w-full bg-navy-800 border border-navy-700/50 rounded-xl px-4 py-3 text-cream placeholder:text-navy-600 focus:outline-none focus:border-terracotta/50 transition-colors text-sm mb-3"
            />
            <button
              onClick={handleSubmitTyped}
              disabled={!typedInput.trim()}
              className="btn-primary w-full disabled:opacity-50"
            >
              Check
            </button>
          </motion.div>
        )}

        {phase === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`flex items-center justify-center gap-2 mb-3 ${result.accuracy >= 70 ? 'text-olive' : 'text-coral'}`}>
              {result.accuracy >= 70 ? <CheckCircle size={20} /> : <XCircle size={20} />}
              <span className="font-semibold">{result.accuracy}% match</span>
            </div>

            <div className="bg-navy-800/50 rounded-xl p-3 mb-4">
              <div className="flex flex-wrap gap-1.5 justify-center">
                {result.results.filter(r => !r.extra).map((r, i) => (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded text-sm ${
                      r.correct ? 'bg-olive/10 text-olive' : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {r.word}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleRetry} className="flex-1 py-2 px-3 rounded-xl bg-navy-700 text-navy-600 hover:text-cream transition-colors text-sm inline-flex items-center justify-center gap-1">
                <RotateCcw size={14} /> Retry
              </button>
              <button onClick={handleNext} className="flex-1 btn-primary text-sm">
                Next
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
