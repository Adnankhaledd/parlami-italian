import { motion, AnimatePresence } from 'framer-motion'
import { Zap } from 'lucide-react'

export default function XPNotification({ amount, show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.8 }}
          transition={{ duration: 0.5 }}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-2 bg-gradient-to-r from-terracotta to-coral text-white px-5 py-3 rounded-2xl shadow-lg shadow-terracotta/30"
        >
          <Zap size={20} className="fill-white" />
          <span className="font-bold text-lg">+{amount} XP</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
