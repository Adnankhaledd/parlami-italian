import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Volume2, CheckCircle, XCircle, ChevronRight,
  Library, Loader2, RefreshCw, Star, Trophy, Search,
  ArrowLeft, Sparkles, Brain
} from 'lucide-react'
import { useGame } from '../contexts/GameContext'
import { generateListeningPassage } from '../services/api'
import useSpeechSynthesis from '../hooks/useSpeechSynthesis'

const TOPICS = [
  { id: 'daily life', label: 'Daily Life', emoji: '🏠' },
  { id: 'food and cooking', label: 'Food & Cooking', emoji: '🍝' },
  { id: 'travel and places', label: 'Travel', emoji: '✈️' },
  { id: 'work and career', label: 'Work', emoji: '💼' },
  { id: 'family and relationships', label: 'Family', emoji: '👨‍👩‍👧' },
  { id: 'Italian culture and history', label: 'Culture', emoji: '🏛️' },
  { id: 'health and body', label: 'Health', emoji: '🏥' },
  { id: 'nature and environment', label: 'Nature', emoji: '🌿' },
  { id: 'sports and leisure', label: 'Sports', emoji: '⚽' },
  { id: 'technology and modern life', label: 'Technology', emoji: '💻' },
  { id: 'shopping and money', label: 'Shopping', emoji: '🛍️' },
  { id: 'news and society', label: 'Society', emoji: '📰' },
]

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

const MASTERY_COLORS = {
  new: 'text-terracotta bg-terracotta/10 border-terracotta/30',
  learning: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  familiar: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  mastered: 'text-olive bg-olive/10 border-olive/30',
}

function getMastery(w) {
  if (w.mastered || (w.correctQuizzes || 0) >= 5) return 'mastered'
  if ((w.correctQuizzes || 0) >= 3) return 'familiar'
  if ((w.correctQuizzes || 0) >= 1) return 'learning'
  return 'new'
}

export default function WordListening() {
  const [tab, setTab] = useState('listen')

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setTab('listen')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${tab === 'listen' ? 'bg-terracotta text-white' : 'text-navy-600 hover:text-cream'}`}>
          <Volume2 size={16} /> Listen & Learn
        </button>
        <button onClick={() => setTab('library')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${tab === 'library' ? 'bg-terracotta text-white' : 'text-navy-600 hover:text-cream'}`}>
          <Library size={16} /> Word Library
          <WordCount />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'listen' ? (
          <motion.div key="listen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ListenAndLearn />
          </motion.div>
        ) : (
          <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WordLibrary />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function WordCount() {
  const { state } = useGame()
  const count = state.wordLibrary?.length || 0
  if (!count) return null
  return <span className="bg-navy-700 text-navy-600 text-xs rounded-full px-2 py-0.5">{count}</span>
}

// ─── Listen & Learn ──────────────────────────────────────────────────────────

function ListenAndLearn() {
  const { state, addXP, addWordToLibrary, encounterWord, quizWordCorrect, quizWordWrong } = useGame()
  const [level, setLevel] = useState(state.assessmentResult?.speakingLevel || 'B1')
  const [topic, setTopic] = useState(TOPICS[0])
  // setup | loading | listen | questions | words | quiz | done
  const [phase, setPhase] = useState('setup')
  const [passage, setPassage] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizAnswer, setQuizAnswer] = useState(null)
  const [quizAnswered, setQuizAnswered] = useState(false)
  const [quizCorrectCount, setQuizCorrectCount] = useState(0)

  const { speak, speaking } = useSpeechSynthesis()

  const reviewWords = useMemo(() => {
    return (state.wordLibrary || [])
      .filter(w => !w.mastered && (w.correctQuizzes || 0) < 5)
      .map(w => w.word)
      .slice(0, 5)
  }, [state.wordLibrary])

  const questions = useMemo(() => {
    if (!passage) return []
    // Support both old (comprehensionQuestion) and new (comprehensionQuestions) format
    if (passage.comprehensionQuestions) return passage.comprehensionQuestions
    if (passage.comprehensionQuestion) return [passage.comprehensionQuestion]
    return []
  }, [passage])

  const vocabWords = passage?.vocabularyWords || []

  const handleGenerate = useCallback(async () => {
    setPhase('loading')
    setPassage(null)
    setQuestionIndex(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setCorrectCount(0)
    setQuizIndex(0)
    setQuizAnswer(null)
    setQuizAnswered(false)
    setQuizCorrectCount(0)
    try {
      const data = await generateListeningPassage({ level, topic: topic.id, reviewWords })
      setPassage(data)
      setPhase('listen')
    } catch (err) {
      console.error(err)
      setPhase('setup')
      alert('Failed to generate passage. Check your connection.')
    }
  }, [level, topic, reviewWords])

  const handlePlay = useCallback(() => {
    if (passage?.passage) speak(passage.passage, 0.85)
  }, [passage, speak])

  // ─── Comprehension Questions ───
  const handleAnswer = (idx) => {
    if (answered) return
    setSelectedAnswer(idx)
    setAnswered(true)
    if (idx === questions[questionIndex]?.correctIndex) {
      setCorrectCount(c => c + 1)
      addXP(3)
    }
  }

  const handleNextQuestion = () => {
    if (questionIndex + 1 < questions.length) {
      setQuestionIndex(i => i + 1)
      setSelectedAnswer(null)
      setAnswered(false)
    } else {
      // Auto-save words & move to word review
      autoSaveWords()
      setPhase('words')
    }
  }

  // ─── Auto-save words ───
  const autoSaveWords = () => {
    for (const w of vocabWords) {
      const exists = (state.wordLibrary || []).some(
        lw => lw.word?.toLowerCase() === w.word?.toLowerCase()
      )
      if (exists) {
        encounterWord(w.word)
      } else {
        addWordToLibrary({
          word: w.word, translation: w.translation, definition: w.definition,
          grammar: w.grammar, exampleSentence: w.exampleSentence,
          exampleTranslation: w.exampleTranslation, level, topic: topic.id,
        })
      }
    }
  }

  // ─── Word Quiz ───
  const quizWords = useMemo(() => {
    // Build quiz: show Italian word → pick the English translation
    return vocabWords.map(w => {
      const wrongOptions = vocabWords
        .filter(v => v.word !== w.word)
        .map(v => v.translation)
        .slice(0, 2)
      // Add a decoy if we don't have enough
      while (wrongOptions.length < 3) wrongOptions.push('something else')
      const allOptions = [w.translation, ...wrongOptions.slice(0, 3)].sort(() => Math.random() - 0.5)
      return { ...w, options: allOptions, correctIdx: allOptions.indexOf(w.translation) }
    })
  }, [vocabWords])

  const currentQuiz = quizWords[quizIndex]

  const handleQuizAnswer = (idx) => {
    if (quizAnswered) return
    setQuizAnswer(idx)
    setQuizAnswered(true)
    if (idx === currentQuiz.correctIdx) {
      quizWordCorrect(currentQuiz.word)
      setQuizCorrectCount(c => c + 1)
      addXP(2)
    } else {
      quizWordWrong(currentQuiz.word)
    }
  }

  const handleNextQuiz = () => {
    if (quizIndex + 1 < quizWords.length) {
      setQuizIndex(i => i + 1)
      setQuizAnswer(null)
      setQuizAnswered(false)
    } else {
      addXP(10)
      setPhase('done')
    }
  }

  // ─── Render ───

  if (phase === 'setup') {
    return (
      <div className="max-w-2xl">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-cream">Listen & Learn</h1>
          <p className="text-navy-600 text-sm mt-1">Listen to a passage, answer questions, then quiz yourself on the new words.</p>
        </div>

        <div className="card mt-6">
          <div className="mb-5">
            <p className="text-xs text-navy-600 mb-2 font-medium uppercase tracking-wide">Your Level</p>
            <div className="flex gap-2">
              {LEVELS.map(l => (
                <button key={l} onClick={() => setLevel(l)}
                  className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors ${level === l ? 'bg-terracotta text-white' : 'bg-navy-800 text-navy-600 hover:text-cream'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs text-navy-600 mb-2 font-medium uppercase tracking-wide">Topic</p>
            <div className="grid grid-cols-3 gap-2">
              {TOPICS.map(t => (
                <button key={t.id} onClick={() => setTopic(t)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors text-left ${topic.id === t.id ? 'bg-terracotta/20 text-terracotta border border-terracotta/40' : 'bg-navy-800 text-navy-600 hover:text-cream border border-transparent'}`}>
                  <span>{t.emoji}</span>
                  <span className="font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {reviewWords.length > 0 && (
            <div className="mb-5 p-3 bg-navy-800/50 rounded-xl border border-navy-700/30">
              <p className="text-xs text-navy-600 mb-1.5 flex items-center gap-1.5">
                <Brain size={12} className="text-terracotta" />
                Words you're still learning will appear in the passage:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {reviewWords.map(w => (
                  <span key={w} className="px-2 py-0.5 bg-terracotta/10 text-terracotta text-xs rounded-full">{w}</span>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleGenerate} className="btn-primary w-full flex items-center justify-center gap-2">
            <Sparkles size={16} /> Generate Passage
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 size={32} className="text-terracotta animate-spin" />
        <p className="text-cream font-medium">Generating your passage...</p>
        <p className="text-navy-600 text-sm">Creating a {level} level passage about {topic.label}</p>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card max-w-md mx-auto text-center py-12">
        <Trophy size={40} className="text-yellow-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-cream mb-4">Session Complete!</h2>
        <div className="flex justify-center gap-8 mb-6">
          <div>
            <p className="text-2xl font-bold text-cream">{correctCount}/{questions.length}</p>
            <p className="text-xs text-navy-600">Comprehension</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-olive">{quizCorrectCount}/{quizWords.length}</p>
            <p className="text-xs text-navy-600">Word Quiz</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-terracotta">{vocabWords.length}</p>
            <p className="text-xs text-navy-600">Words Added</p>
          </div>
        </div>
        <p className="text-navy-600 text-sm mb-6">Words saved to your library. Get them right in 5 quizzes to master them.</p>
        <button onClick={() => setPhase('setup')} className="btn-primary flex items-center justify-center gap-2 mx-auto">
          <RefreshCw size={16} /> Another Passage
        </button>
      </motion.div>
    )
  }

  if (!passage) return null

  return (
    <div className="max-w-2xl">
      <button onClick={() => setPhase('setup')} className="flex items-center gap-1.5 text-navy-600 hover:text-cream text-sm mb-4 transition-colors">
        <ArrowLeft size={14} /> Change topic
      </button>

      {/* Progress indicator */}
      <div className="flex items-center gap-1.5 mb-4">
        {['listen', 'questions', 'words', 'quiz'].map((p, i) => (
          <div key={p} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${['listen', 'questions', 'words', 'quiz'].indexOf(phase) >= i ? 'bg-terracotta' : 'bg-navy-700'}`} />
            {i < 3 && <div className={`w-8 h-0.5 ${['listen', 'questions', 'words', 'quiz'].indexOf(phase) > i ? 'bg-terracotta' : 'bg-navy-700'}`} />}
          </div>
        ))}
        <span className="text-xs text-navy-600 ml-2">
          {phase === 'listen' ? 'Listen' : phase === 'questions' ? `Question ${questionIndex + 1}/${questions.length}` : phase === 'words' ? 'New Words' : `Quiz ${quizIndex + 1}/${quizWords.length}`}
        </span>
      </div>

      {/* ── Listen Phase ── */}
      {phase === 'listen' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-navy-600 font-medium uppercase tracking-wide">{topic.emoji} {topic.label} · {level}</span>
            </div>

            <div className="text-center mb-5">
              <button onClick={handlePlay} disabled={speaking}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-terracotta to-coral flex items-center justify-center mx-auto hover:scale-105 transition-transform disabled:opacity-60 shadow-lg">
                {speaking ? <Volume2 size={32} className="text-white animate-pulse" /> : <Play size={32} className="text-white ml-1" />}
              </button>
              <p className="text-xs text-navy-600 mt-2">{speaking ? 'Playing...' : 'Press to listen'}</p>
            </div>

            <div className="bg-navy-800/50 rounded-xl p-4 mb-4">
              <p className="text-cream leading-relaxed text-sm">{passage.passage}</p>
              <p className="text-navy-600 text-xs mt-2 italic">{passage.translation}</p>
            </div>

            <button onClick={() => setPhase('questions')} className="btn-primary w-full flex items-center justify-center gap-2">
              Answer Questions ({questions.length}) <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Questions Phase ── */}
      {phase === 'questions' && questions[questionIndex] && (
        <motion.div key={questionIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card mb-4">
            <p className="text-xs text-navy-600 mb-3 font-medium uppercase tracking-wide">
              Question {questionIndex + 1} of {questions.length}
            </p>
            <p className="text-cream font-medium mb-4">{questions[questionIndex].question}</p>

            <div className="space-y-2 mb-4">
              {questions[questionIndex].options.map((opt, idx) => {
                const isCorrect = idx === questions[questionIndex].correctIndex
                const isSelected = idx === selectedAnswer
                let cls = 'border border-navy-700/50 bg-navy-800/50 text-cream hover:border-terracotta/50 hover:bg-terracotta/5 cursor-pointer'
                if (answered) {
                  if (isCorrect) cls = 'border border-olive bg-olive/10 text-olive'
                  else if (isSelected && !isCorrect) cls = 'border border-red-500 bg-red-500/10 text-red-400'
                  else cls = 'border border-navy-700/30 bg-navy-800/30 text-navy-600'
                }
                return (
                  <button key={idx} onClick={() => handleAnswer(idx)} disabled={answered}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors flex items-center gap-3 ${cls}`}>
                    <span className="shrink-0 w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                    {answered && isCorrect && <CheckCircle size={16} className="ml-auto text-olive" />}
                    {answered && isSelected && !isCorrect && <XCircle size={16} className="ml-auto text-red-400" />}
                  </button>
                )
              })}
            </div>

            {answered && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-xs text-navy-600 bg-navy-800/50 rounded-xl p-3 mb-4">
                  {questions[questionIndex].explanation}
                </p>
                <button onClick={handleNextQuestion} className="btn-primary w-full flex items-center justify-center gap-2">
                  {questionIndex + 1 < questions.length ? `Next Question` : `See New Words`} <ChevronRight size={16} />
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Words Phase (review before quiz) ── */}
      {phase === 'words' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-cream">New Words</h2>
              <span className="text-xs bg-olive/10 text-olive px-2 py-0.5 rounded-full">Auto-saved to library</span>
            </div>

            <div className="space-y-4">
              {vocabWords.map((w, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-navy-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => speak(w.word, 0.85)} className="text-lg font-bold text-cream hover:text-terracotta transition-colors flex items-center gap-1.5">
                      {w.word} <Volume2 size={14} className="text-navy-600" />
                    </button>
                    <span className="text-xs text-navy-600 bg-navy-700 px-2 py-0.5 rounded-full">{w.grammar}</span>
                  </div>
                  <p className="text-terracotta font-medium text-sm mb-1">{w.translation}</p>
                  <p className="text-navy-600 text-xs mb-2">{w.definition}</p>
                  <div className="bg-navy-900/50 rounded-lg px-3 py-2">
                    <p className="text-cream text-xs italic">"{w.exampleSentence}"</p>
                    <p className="text-navy-600 text-xs mt-0.5">{w.exampleTranslation}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <p className="text-xs text-navy-600 text-center mt-4 mb-3">Study these words, then test yourself!</p>
            <button onClick={() => setPhase('quiz')} className="btn-primary w-full flex items-center justify-center gap-2">
              <Brain size={16} /> Start Word Quiz
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Quiz Phase ── */}
      {phase === 'quiz' && currentQuiz && (
        <motion.div key={quizIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card mb-4">
            <p className="text-xs text-navy-600 mb-1 font-medium uppercase tracking-wide">
              Word Quiz · {quizIndex + 1} of {quizWords.length}
            </p>
            <p className="text-cream text-sm mb-4">What does this word mean?</p>

            <div className="text-center mb-5">
              <button onClick={() => speak(currentQuiz.word, 0.85)}
                className="text-2xl font-bold text-cream hover:text-terracotta transition-colors inline-flex items-center gap-2">
                {currentQuiz.word} <Volume2 size={18} className="text-navy-600" />
              </button>
              <p className="text-xs text-navy-600 mt-1">{currentQuiz.grammar}</p>
            </div>

            <div className="space-y-2 mb-4">
              {currentQuiz.options.map((opt, idx) => {
                const isCorrect = idx === currentQuiz.correctIdx
                const isSelected = idx === quizAnswer
                let cls = 'border border-navy-700/50 bg-navy-800/50 text-cream hover:border-terracotta/50 hover:bg-terracotta/5 cursor-pointer'
                if (quizAnswered) {
                  if (isCorrect) cls = 'border border-olive bg-olive/10 text-olive'
                  else if (isSelected && !isCorrect) cls = 'border border-red-500 bg-red-500/10 text-red-400'
                  else cls = 'border border-navy-700/30 bg-navy-800/30 text-navy-600'
                }
                return (
                  <button key={idx} onClick={() => handleQuizAnswer(idx)} disabled={quizAnswered}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors flex items-center gap-3 ${cls}`}>
                    {opt}
                    {quizAnswered && isCorrect && <CheckCircle size={16} className="ml-auto text-olive" />}
                    {quizAnswered && isSelected && !isCorrect && <XCircle size={16} className="ml-auto text-red-400" />}
                  </button>
                )
              })}
            </div>

            {quizAnswered && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {quizAnswer !== currentQuiz.correctIdx && (
                  <p className="text-xs text-navy-600 bg-navy-800/50 rounded-xl p-3 mb-3">
                    <span className="text-cream font-medium">{currentQuiz.word}</span> = {currentQuiz.translation}
                    <br />{currentQuiz.definition}
                  </p>
                )}
                <button onClick={handleNextQuiz} className="btn-primary w-full flex items-center justify-center gap-2">
                  {quizIndex + 1 < quizWords.length ? 'Next Word' : 'Finish'} <ChevronRight size={16} />
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ─── Word Library ─────────────────────────────────────────────────────────────

function WordLibrary() {
  const { state, markWordMastered } = useGame()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const { speak } = useSpeechSynthesis()

  const words = state.wordLibrary || []

  const filtered = useMemo(() => {
    return words
      .filter(w => {
        const matchSearch = !search || w.word?.toLowerCase().includes(search.toLowerCase()) || w.translation?.toLowerCase().includes(search.toLowerCase())
        const mastery = getMastery(w)
        const matchFilter = filter === 'all' || mastery === filter
        return matchSearch && matchFilter
      })
      .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
  }, [words, search, filter])

  const stats = useMemo(() => ({
    total: words.length,
    mastered: words.filter(w => getMastery(w) === 'mastered').length,
    familiar: words.filter(w => getMastery(w) === 'familiar').length,
    learning: words.filter(w => getMastery(w) === 'learning').length,
    new: words.filter(w => getMastery(w) === 'new').length,
  }), [words])

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Library size={40} className="text-navy-700 mb-4" />
        <h3 className="text-lg font-bold text-cream mb-2">Your library is empty</h3>
        <p className="text-navy-600 text-sm max-w-xs">Complete a Listen & Learn session to start building your word library. Words are auto-saved and tracked through quizzes.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total', value: stats.total, color: 'text-cream' },
          { label: 'Learning', value: stats.learning + stats.new, color: 'text-yellow-400' },
          { label: 'Familiar', value: stats.familiar, color: 'text-blue-400' },
          { label: 'Mastered', value: stats.mastered, color: 'text-olive' },
        ].map(s => (
          <div key={s.label} className="card text-center py-3">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-navy-600">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-600" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search words..."
            className="w-full bg-navy-800 border border-navy-700/50 rounded-xl pl-9 pr-4 py-2.5 text-cream placeholder:text-navy-600 text-sm focus:outline-none focus:border-terracotta/50" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm text-cream focus:outline-none focus:border-terracotta/50">
          <option value="all">All</option>
          <option value="new">New</option>
          <option value="learning">Learning</option>
          <option value="familiar">Familiar</option>
          <option value="mastered">Mastered</option>
        </select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-navy-600 text-sm text-center py-8">No words match your filter.</p>
        )}
        {filtered.map((w, i) => {
          const mastery = getMastery(w)
          const quizzes = w.correctQuizzes || 0
          return (
            <motion.div key={w.word + i} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="card flex items-start gap-3 py-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <button onClick={() => speak(w.word, 0.85)} className="font-bold text-cream hover:text-terracotta transition-colors flex items-center gap-1">
                    {w.word} <Volume2 size={12} className="text-navy-600" />
                  </button>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${MASTERY_COLORS[mastery]}`}>
                    {mastery}
                  </span>
                  {w.grammar && <span className="text-xs text-navy-600">{w.grammar}</span>}
                </div>
                <p className="text-sm text-terracotta">{w.translation}</p>
                <p className="text-xs text-navy-600 mt-0.5">{w.definition}</p>
                {w.exampleSentence && (
                  <p className="text-xs text-navy-600 italic mt-1">"{w.exampleSentence}"</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-navy-600">{w.encounters || 1} seen · {quizzes}/5 quiz</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className={`w-2 h-2 rounded-full ${j < quizzes ? 'bg-olive' : 'bg-navy-800'}`} />
                    ))}
                  </div>
                </div>
              </div>
              {mastery !== 'mastered' && (
                <button onClick={() => markWordMastered(w.word)} title="Mark as mastered"
                  className="shrink-0 text-navy-600 hover:text-olive transition-colors">
                  <Star size={16} />
                </button>
              )}
              {mastery === 'mastered' && (
                <CheckCircle size={16} className="shrink-0 text-olive" />
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
