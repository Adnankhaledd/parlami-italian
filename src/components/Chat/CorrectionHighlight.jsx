import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CorrectionHighlight({ correction }) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <span className="relative inline">
      <span
        className="border-b-2 border-coral border-dashed cursor-help text-coral"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        {correction.corrected}
      </span>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
          >
            <div className="bg-navy-900 border border-navy-700 rounded-xl p-3 shadow-xl text-sm min-w-[200px] max-w-[300px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-400 line-through text-xs">{correction.original}</span>
                <span className="text-navy-600">→</span>
                <span className="text-olive font-medium text-xs">{correction.corrected}</span>
              </div>
              <p className="text-cream/80 text-xs leading-relaxed">{correction.explanation}</p>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-navy-900 border-r border-b border-navy-700" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}
