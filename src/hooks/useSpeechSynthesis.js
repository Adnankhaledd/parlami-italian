import { useState, useCallback, useRef, useEffect } from 'react'

// Cache audio blobs so the same text isn't re-fetched
const audioCache = new Map()

async function speakWithOpenAI(text, speed = 0.9) {
  const cacheKey = `${text}__${speed}`
  let url = audioCache.get(cacheKey)

  if (!url) {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, speed }),
    })
    if (!response.ok) throw new Error('TTS API failed')
    const blob = await response.blob()
    url = URL.createObjectURL(blob)
    audioCache.set(cacheKey, url)
    // Keep cache under 50 entries
    if (audioCache.size > 50) {
      const firstKey = audioCache.keys().next().value
      URL.revokeObjectURL(audioCache.get(firstKey))
      audioCache.delete(firstKey)
    }
  }

  return url
}

export default function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false)
  const [supported] = useState(() => 'speechSynthesis' in window)
  const audioRef = useRef(null)
  const browserVoiceRef = useRef(null)

  // Load browser voices as fallback
  useEffect(() => {
    if (!supported) return
    function loadVoices() {
      const voices = window.speechSynthesis.getVoices()
      const italianVoices = voices.filter((v) => v.lang.startsWith('it'))
      if (italianVoices.length > 0) {
        const preferred = italianVoices.find(
          (v) => v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Enhanced')
        )
        browserVoiceRef.current = preferred || italianVoices[0]
      }
    }
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [supported])

  const speak = useCallback(async (text, rate = 0.9) => {
    if (!text) return

    // Stop anything currently playing
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (supported) window.speechSynthesis.cancel()

    setSpeaking(true)

    try {
      // Try OpenAI TTS first
      const url = await speakWithOpenAI(text, rate)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { setSpeaking(false); audioRef.current = null }
      audio.onerror = () => { setSpeaking(false); audioRef.current = null }
      await audio.play()
    } catch (err) {
      // Fallback to browser TTS
      console.warn('OpenAI TTS failed, falling back to browser TTS:', err.message)
      if (!supported) { setSpeaking(false); return }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'it-IT'
      utterance.rate = rate
      utterance.pitch = 1
      if (browserVoiceRef.current) utterance.voice = browserVoiceRef.current
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utterance)
    }
  }, [supported])

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (supported) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  return { speak, speaking, stopSpeaking, supported }
}
