import { Mic, MicOff, Square } from 'lucide-react'
import { motion } from 'framer-motion'

export default function MicButton({ isListening, onStart, onStop, disabled, supported }) {
  if (!supported) {
    return (
      <div className="text-center text-navy-600 text-sm">
        <MicOff size={20} className="mx-auto mb-1" />
        Speech recognition not supported in this browser.
        <br />Use Chrome for the best experience.
      </div>
    )
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={isListening ? onStop : onStart}
      disabled={disabled}
      className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
        isListening
          ? 'bg-red-500 hover:bg-red-600 mic-glow'
          : disabled
          ? 'bg-navy-700 cursor-not-allowed opacity-50'
          : 'bg-gradient-to-br from-terracotta to-coral hover:shadow-lg hover:shadow-terracotta/30'
      }`}
    >
      {isListening ? (
        <Square size={22} className="text-white fill-white" />
      ) : (
        <Mic size={24} className="text-white" />
      )}

      {/* Pulse rings when recording */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-30" />
          <span
            className="absolute inset-[-8px] rounded-full border border-red-500/20 animate-ping opacity-20"
            style={{ animationDelay: '0.5s' }}
          />
        </>
      )}
    </motion.button>
  )
}
