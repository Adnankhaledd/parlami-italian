import { useState } from 'react'
import { motion } from 'framer-motion'
import { Volume2, VolumeX, Check, AlertCircle, Eye } from 'lucide-react'
import CorrectionHighlight from './CorrectionHighlight'

export default function ChatBubble({ message, onSpeak, speaking, audioOnly = false }) {
  const isUser = message.role === 'user'
  const isAI = message.role === 'assistant'
  const [revealed, setRevealed] = useState(false)

  const showText = !audioOnly || isUser || revealed

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[80%] ${
          isUser
            ? 'bg-terracotta/20 border border-terracotta/20 rounded-2xl rounded-br-md'
            : 'bg-navy-700/50 border border-navy-700/50 rounded-2xl rounded-bl-md'
        } px-4 py-3`}
      >
        {/* Main message text */}
        {showText ? (
          <p className={`text-sm leading-relaxed ${isUser ? 'text-cream' : 'text-cream'}`}>
            {message.text}
          </p>
        ) : (
          <div className="text-sm text-navy-600 italic">
            🎧 Audio message — listen carefully
          </div>
        )}

        {/* AI Response with TTS button */}
        {isAI && (
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onSpeak(message.text)}
              className="text-navy-600 hover:text-olive transition-colors p-1"
              title="Listen to pronunciation"
            >
              {speaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            {audioOnly && !revealed && (
              <button
                onClick={() => setRevealed(true)}
                className="text-navy-600 hover:text-cream transition-colors p-1 flex items-center gap-1 text-xs"
                title="Reveal text"
              >
                <Eye size={14} />
                <span>Reveal</span>
              </button>
            )}
          </div>
        )}

        {/* Corrections panel */}
        {showText && message.corrections && message.corrections.length > 0 && (
          <div className="mt-3 pt-3 border-t border-navy-600/30">
            {/* Full corrected sentence */}
            {message.correctedSentence && (
              <div className="bg-olive/10 border border-olive/20 rounded-lg px-3 py-2 mb-3">
                <p className="text-xs text-navy-600 mb-0.5 font-medium">Correct version:</p>
                <p className="text-sm text-olive font-medium">{message.correctedSentence}</p>
              </div>
            )}

            <div className="flex items-center gap-1.5 mb-2">
              <AlertCircle size={12} className="text-coral" />
              <span className="text-xs font-semibold text-coral">What to fix</span>
            </div>
            <div className="space-y-3">
              {message.corrections.map((correction, i) => (
                <div key={i} className="text-xs bg-navy-800/40 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-400/80 line-through">{correction.original}</span>
                    <span className="text-navy-600">→</span>
                    <span className="text-olive font-semibold">{correction.corrected}</span>
                  </div>
                  <p className="text-cream/70 text-xs leading-relaxed">{correction.explanation}</p>
                  {correction.category && (
                    <span className="inline-block mt-1 text-[10px] text-navy-600 bg-navy-800 px-2 py-0.5 rounded-full">
                      {correction.category.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Perfect message indicator */}
        {showText && message.corrections && message.corrections.length === 0 && isAI && (
          <div className="mt-2 pt-2 border-t border-navy-600/30 flex items-center gap-1.5">
            <Check size={12} className="text-olive" />
            <span className="text-xs text-olive font-medium">Perfect Italian!</span>
          </div>
        )}

        {/* Encouragement */}
        {showText && message.encouragement && (
          <p className="text-xs text-navy-600 mt-2 italic">{message.encouragement}</p>
        )}
      </div>
    </motion.div>
  )
}
