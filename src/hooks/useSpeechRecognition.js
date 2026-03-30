import { useState, useCallback, useRef, useEffect } from 'react'

export default function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const recognitionRef = useRef(null)

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const supported = !!SpeechRecognition

  useEffect(() => {
    if (!supported) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'it-IT'
    recognition.interimResults = true
    recognition.continuous = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (final) {
        setTranscript((prev) => (prev ? prev + ' ' + final : final).trim())
        setInterimTranscript('')
      } else {
        setInterimTranscript(interim)
      }
    }

    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error)
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
    }
  }, [supported])

  const start = useCallback(() => {
    if (!recognitionRef.current || isListening) return
    setTranscript('')
    setInterimTranscript('')
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch (err) {
      console.error('Failed to start recognition:', err)
    }
  }, [isListening])

  const stop = useCallback(() => {
    if (!recognitionRef.current || !isListening) return
    recognitionRef.current.stop()
    setIsListening(false)
  }, [isListening])

  const reset = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  return {
    isListening,
    transcript,
    interimTranscript,
    start,
    stop,
    reset,
    supported,
  }
}
