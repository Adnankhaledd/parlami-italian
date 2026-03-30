import { useState, useCallback, useRef, useEffect } from 'react'

export default function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false)
  const [supported] = useState(() => 'speechSynthesis' in window)
  const voiceRef = useRef(null)

  useEffect(() => {
    if (!supported) return

    function loadVoices() {
      const voices = window.speechSynthesis.getVoices()
      // Prefer Italian voices, specifically high-quality ones
      const italianVoices = voices.filter((v) => v.lang.startsWith('it'))

      if (italianVoices.length > 0) {
        // Prefer voices that sound natural (often contain "Google" or "Premium" or "Enhanced")
        const preferred = italianVoices.find(
          (v) => v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Enhanced')
        )
        voiceRef.current = preferred || italianVoices[0]
      }
    }

    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
    }
  }, [supported])

  const speak = useCallback(
    (text, rate = 0.9) => {
      if (!supported || !text) return

      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'it-IT'
      utterance.rate = rate
      utterance.pitch = 1

      if (voiceRef.current) {
        utterance.voice = voiceRef.current
      }

      utterance.onstart = () => setSpeaking(true)
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)

      window.speechSynthesis.speak(utterance)
    },
    [supported]
  )

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  return {
    speak,
    speaking,
    stopSpeaking,
    supported,
  }
}
