import { motion, AnimatePresence } from 'framer-motion'
import { Star, X } from 'lucide-react'

export default function LevelUpModal({ level, onClose }) {
  if (!level) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          className="bg-navy-800 border border-navy-700 rounded-3xl p-8 max-w-sm mx-4 text-center relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-navy-600 hover:text-cream">
            <X size={20} />
          </button>

          {/* Confetti-like dots */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: ['#e07a5f', '#f2cc8f', '#81b29a', '#f4f1de'][i % 4],
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  y: [0, -30 - Math.random() * 40],
                }}
                transition={{
                  duration: 1.5,
                  delay: Math.random() * 0.5,
                  repeat: 2,
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 10, delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-terracotta to-coral flex items-center justify-center"
          >
            <Star size={36} className="text-white fill-white" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-coral font-bold text-sm uppercase tracking-wider mb-1">Level Up!</p>
            <h2 className="text-3xl font-bold text-cream mb-1">Level {level.level}</h2>
            <p className="text-xl text-gradient font-bold mb-2">{level.name}</p>
            <p className="text-navy-600 text-sm">{level.nameEn}</p>
          </motion.div>

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={onClose}
            className="btn-primary mt-6 w-full"
          >
            Andiamo! 🎉
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
