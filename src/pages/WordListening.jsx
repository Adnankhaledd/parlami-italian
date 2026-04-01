import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Volume2, BookOpen, CheckCircle, XCircle, ChevronRight,
  Plus, Library, Loader2, RefreshCw, Star, Trophy, Search,
  Filter, ArrowLeft, Sparkles, Brain
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

function getMastery(encounters) {
  if (encounters >= 7) return 'mastered'
  if (encounters >= 4) return 'familiar'
  if (encounters >= 2) return 'learning'
  return 'new'
}

export default function WordListening() {
  const [tab, setTab] = useState('listen') // 'listen' | 'library'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full">
      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setTab('listen')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
            tab === 'listen' ? 'bg-terracotta text-white' : 'text-navy-600 hover:text-cream'
          }`}
        >
          <Volume2 size={16} /> Listen & Learn
        </button>
        <button
          onClick={() => setTab('library')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
            tab === 'library' ? 'bg-terracotta text-white' : 'text-navy-600 hover:text-cream'
          }`}
        >
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
  return (
    <span className="bg-navy-700 text-navy-600 text-xs rounded-full px-2 py-0.5">{count}</span>
  )
}

// ─── Listen & Learn ──────────────────────────────────────────────────────────

function ListenAndLearn() {
  const { state, addXP } = useGame()
  const [level, setLevel] = useState(state.assessmentResult?.speakingLevel || 'B1')
  const [topic, setTopic] = useState(TOPICS[0])
  const [phase, setPhase] = useState('setup') // setup | loading | listen | question | words | done
  const [passage, setPassage] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [savedWords, setSavedWords] = useState([])
  const { speak, speaking } = useSpeechSynthesis()

  // Words the user needs more exposure to (for spaced repetition in passages)
  const reviewWords = useMemo(() => {
    return (state.wordLibrary || [])
      .filter(w => !w.mastered && w.encounters < 5)
      .map(w => w.word)
      .slice(0, 5)
  }, [state.wordLibrary])

  const handleGenerate = useCallback(async () => {
    setPhase('loading')
    setPassage(null)
    setSelectedAnswer(null)
    setAnswered(false)
    setSavedWords([])
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

  const handleAnswer = (idx) => {
    if (answered) return
    setSelectedAnswer(idx)
    setAnswered(true)
    const correct = idx === passage.comprehensionQuestion.correctIndex
    if (correct) addXP(5)
  }

  const handleDone = () => {
    addXP(10 + savedWords.length * 3)
    setPhase('done')
  }

  if (phase === 'setup') {
    return (
      <div className="max-w-2xl">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-cream">Listen & Learn</h1>
          <p className="text-navy-600 text-sm mt-1">AI generates a passage, you listen, answer a question, and learn new words that go straight to your library.</p>
        </div>

        <div className="card mt-6">
          {/* Level */}
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

          {/* Topic */}
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
                The passage will also include words you're still learning:
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
        <h2 className="text-xl font-bold text-cream mb-2">Well done!</h2>
        <p className="text-navy-600 mb-1">You learned <span className="text-terracotta font-semibold">{savedWords.length} new word{savedWords.length !== 1 ? 's' : ''}</span></p>
        <p className="text-navy-600 text-sm mb-6">They've been added to your Word Library</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => setPhase('setup')} className="btn-primary flex items-center gap-2">
            <RefreshCw size={16} /> Another Passage
          </button>
        </div>
      </motion.div>
    )
  }

  if (!passage) return null

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <button onClick={() => setPhase('setup')} className="flex items-center gap-1.5 text-navy-600 hover:text-cream text-sm mb-4 transition-colors">
        <ArrowLeft size={14} /> Change topic
      </button>

      {/* Phase: listen */}
      {phase === 'listen' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-navy-600 font-medium uppercase tracking-wide">{topic.emoji} {topic.label} · {level}</span>
              <span className="text-xs text-navy-600">{passage.vocabularyWords?.length} new words</span>
            </div>

            {/* Play button */}
            <div className="text-center mb-5">
              <button
                onClick={handlePlay}
                disabled={speaking}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-terracotta to-coral flex items-center justify-center mx-auto hover:scale-105 transition-transform disabled:opacity-60 shadow-lg"
              >
                {speaking
                  ? <Volume2 size={32} className="text-white animate-pulse" />
                  : <Play size={32} className="text-white ml-1" />}
              </button>
              <p className="text-xs text-navy-600 mt-2">{speaking ? 'Playing...' : 'Press to listen'}</p>
            </div>

            {/* Transcript (shown after play) */}
            <div className="bg-navy-800/50 rounded-xl p-4 mb-4">
              <p className="text-cream leading-relaxed text-sm">{passage.passage}</p>
              <p className="text-navy-600 text-xs mt-2 italic">{passage.translation}</p>
            </div>

            <button onClick={() => setPhase('question')} className="btn-primary w-full flex items-center justify-center gap-2">
              Answer the Question <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Phase: comprehension question */}
      {phase === 'question' && passage.comprehensionQuestion && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card mb-4">
            <p className="text-xs text-navy-600 mb-3 font-medium uppercase tracking-wide">Comprehension Check</p>
            <p className="text-cream font-medium mb-4">{passage.comprehensionQuestion.question}</p>

            <div className="space-y-2 mb-4">
              {passage.comprehensionQuestion.options.map((opt, idx) => {
                const isCorrect = idx === passage.comprehensionQuestion.correctIndex
                const isSelected = idx === selectedAnswer
                let cls = 'border border-navy-700/50 bg-navy-800/50 text-cream'
                if (answered) {
                  if (isCorrect) cls = 'border border-olive bg-olive/10 text-olive'
                  else if (isSelected && !isCorrect) cls = 'border border-red-500 bg-red-500/10 text-red-400'
                  else cls = 'border border-navy-700/30 bg-navy-800/30 text-navy-600'
                } else {
                  cls = 'border border-navy-700/50 bg-navy-800/50 text-cream hover:border-terracotta/50 hover:bg-terracotta/5 cursor-pointer'
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
                  {passage.comprehensionQuestion.explanation}
                </p>
                <button onClick={() => setPhase('words')} className="btn-primary w-full flex items-center justify-center gap-2">
                  See New Words <ChevronRight size={16} />
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Phase: vocabulary words */}
      {phase === 'words' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-cream">New Words</h2>
            <p className="text-xs text-navy-600">Save them to your library</p>
          </div>

          <div className="space-y-3 mb-4">
            {(passage.vocabularyWords || []).map((w, i) => (
              <VocabCard key={i} word={w} onSave={(word) => setSavedWords(prev => [...prev, word])} savedWords={savedWords} />
            ))}
          </div>

          <button onClick={handleDone} className="btn-primary w-full flex items-center justify-center gap-2">
            <CheckCircle size={16} /> Finish Session (+{10 + savedWords.length * 3} XP)
          </button>
        </motion.div>
      )}
    </div>
  )
}

function VocabCard({ word, onSave, savedWords }) {
  const { addWordToLibrary, state } = useGame()
  const { speak } = useSpeechSynthesis()
  const isSaved = savedWords.includes(word.word) || (state.wordLibrary || []).some(w => w.word?.toLowerCase() === word.word?.toLowerCase())
  const existing = (state.wordLibrary || []).find(w => w.word?.toLowerCase() === word.word?.toLowerCase())

  const handleSave = () => {
    addWordToLibrary({ word: word.word, translation: word.translation, definition: word.definition, grammar: word.grammar, exampleSentence: word.exampleSentence, exampleTranslation: word.exampleTranslation, level: word.level, topic: word.topic })
    onSave(word.word)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => speak(word.word, 0.85)} className="text-lg font-bold text-cream hover:text-terracotta transition-colors flex items-center gap-1.5">
              {word.word}
              <Volume2 size={14} className="text-navy-600" />
            </button>
            <span className="text-xs text-navy-600 bg-navy-800 px-2 py-0.5 rounded-full">{word.grammar}</span>
          </div>
          <p className="text-terracotta font-medium text-sm mb-1">{word.translation}</p>
          <p className="text-navy-600 text-xs mb-3">{word.definition}</p>
          <div className="bg-navy-800/50 rounded-lg px-3 py-2">
            <p className="text-cream text-xs italic">"{word.exampleSentence}"</p>
            <p className="text-navy-600 text-xs mt-0.5">{word.exampleTranslation}</p>
          </div>
          {existing && (
            <p className="text-xs text-navy-600 mt-2">
              Seen {existing.encounters} time{existing.encounters !== 1 ? 's' : ''} ·{' '}
              <span className={getMastery(existing.encounters) === 'mastered' ? 'text-olive' : 'text-yellow-400'}>
                {getMastery(existing.encounters)}
              </span>
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isSaved}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isSaved ? 'bg-olive/10 text-olive cursor-default' : 'bg-terracotta/10 text-terracotta hover:bg-terracotta/20'}`}
        >
          {isSaved ? <><CheckCircle size={13} /> Saved</> : <><Plus size={13} /> Save</>}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Word Library ─────────────────────────────────────────────────────────────

function WordLibrary() {
  const { state, markWordMastered } = useGame()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | new | learning | familiar | mastered
  const { speak } = useSpeechSynthesis()

  const words = state.wordLibrary || []

  const filtered = useMemo(() => {
    return words
      .filter(w => {
        const matchSearch = !search || w.word?.toLowerCase().includes(search.toLowerCase()) || w.translation?.toLowerCase().includes(search.toLowerCase())
        const mastery = getMastery(w.encounters)
        const matchFilter = filter === 'all' || mastery === filter
        return matchSearch && matchFilter
      })
      .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
  }, [words, search, filter])

  const stats = useMemo(() => ({
    total: words.length,
    mastered: words.filter(w => getMastery(w.encounters) === 'mastered').length,
    familiar: words.filter(w => getMastery(w.encounters) === 'familiar').length,
    learning: words.filter(w => getMastery(w.encounters) === 'learning').length,
    new: words.filter(w => getMastery(w.encounters) === 'new').length,
  }), [words])

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Library size={40} className="text-navy-700 mb-4" />
        <h3 className="text-lg font-bold text-cream mb-2">Your library is empty</h3>
        <p className="text-navy-600 text-sm max-w-xs">Complete a Listen & Learn session and save words to build your library. Words you encounter multiple times level up automatically.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Stats */}
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

      {/* Search + filter */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search words..."
            className="w-full bg-navy-800 border border-navy-700/50 rounded-xl pl-9 pr-4 py-2.5 text-cream placeholder:text-navy-600 text-sm focus:outline-none focus:border-terracotta/50"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="bg-navy-800 border border-navy-700/50 rounded-xl px-3 py-2.5 text-sm text-cream focus:outline-none focus:border-terracotta/50"
        >
          <option value="all">All</option>
          <option value="new">New</option>
          <option value="learning">Learning</option>
          <option value="familiar">Familiar</option>
          <option value="mastered">Mastered</option>
        </select>
      </div>

      {/* Word list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-navy-600 text-sm text-center py-8">No words match your filter.</p>
        )}
        {filtered.map((w, i) => {
          const mastery = getMastery(w.encounters)
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
                  <span className="text-xs text-navy-600">{w.encounters} encounter{w.encounters !== 1 ? 's' : ''}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <div key={j} className={`w-2 h-2 rounded-full ${j < w.encounters ? 'bg-terracotta' : 'bg-navy-800'}`} />
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
