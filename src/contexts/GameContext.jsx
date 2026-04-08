import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState, useMemo } from 'react'
import { getLevelForXP } from '../data/levels'
import { checkAchievements } from '../data/achievements'
import { initReviewItem, calculateNextReview, getItemsDueForReview } from '../utils/spacedRepetition'
import { computeLevel } from '../utils/levelEngine'

const GameContext = createContext(null)

const STORAGE_KEY = 'parlami_game_state'

const initialState = {
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastPracticeDate: null,
  totalMessages: 0,
  perfectMessages: 0,
  completedScenarios: [],
  unlockedAchievements: [],
  vocabularyCount: 0,
  vocabulary: [],
  practiceHistory: [], // [{date, minutes, messages, xpEarned}]
  scenarioHistory: {}, // {scenarioId: {completed, bestScore, attempts}}
  todayXP: 0,
  todayDate: null,
  // Mistake tracking
  mistakes: [], // [{original, corrected, explanation, category, date, count}]
  mistakeCounts: {}, // {category: count} for quick lookup
  assessmentResult: null, // {level, breakdown, date, details}
  assessmentHistory: [], // [{level, speaking, listening, date, ...}] — all past assessments
  reviewItems: [], // spaced repetition items
  dictationCount: 0,
  completedSentenceIds: [], // track which sentences have been done
  generatedSentences: [], // AI-generated sentences stored for reuse
  wordLibrary: [], // [{word, translation, definition, exampleSentence, grammar, level, topic, encounters, mastered, addedDate}]
  // Onboarding
  onboardingComplete: false,
  learningGoals: [],
  timeBudget: 15,
  placementLevel: null,
  // Daily lessons
  dailyLessonProgress: null, // {date, completed, topicId}
  sessionHistory: [], // [{date, type, duration, xpEarned, accuracy}]
  // Preferences
  colloquialMode: false,
  transcriptLevel: 2,
  grammarLessonsCompleted: 0,
  videosWatched: 0,
  dailyLessonsCompleted: 0,
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'ADD_XP': {
      const today = new Date().toISOString().split('T')[0]
      const newXP = state.xp + action.payload
      const oldLevel = getLevelForXP(state.xp)
      const newLevel = getLevelForXP(newXP)
      return {
        ...state,
        xp: newXP,
        todayXP: state.todayDate === today ? state.todayXP + action.payload : action.payload,
        todayDate: today,
        _levelUp: newLevel.level > oldLevel.level ? newLevel : null,
      }
    }
    case 'ADD_MESSAGE': {
      return {
        ...state,
        totalMessages: state.totalMessages + 1,
        perfectMessages: action.payload.perfect
          ? state.perfectMessages + 1
          : state.perfectMessages,
      }
    }
    case 'UPDATE_STREAK': {
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

      if (state.lastPracticeDate === today) return state

      let newStreak = 1
      if (state.lastPracticeDate === yesterday) {
        newStreak = state.streak + 1
      }

      return {
        ...state,
        streak: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        lastPracticeDate: today,
      }
    }
    case 'COMPLETE_SCENARIO': {
      const scenarioId = action.payload.scenarioId
      const completed = state.completedScenarios.includes(scenarioId)
        ? state.completedScenarios
        : [...state.completedScenarios, scenarioId]
      return {
        ...state,
        completedScenarios: completed,
        scenarioHistory: {
          ...state.scenarioHistory,
          [scenarioId]: {
            completed: true,
            attempts: (state.scenarioHistory[scenarioId]?.attempts || 0) + 1,
          },
        },
      }
    }
    case 'ADD_VOCABULARY': {
      const newWords = action.payload.filter((w) => !state.vocabulary.includes(w))
      if (newWords.length === 0) return state
      return {
        ...state,
        vocabulary: [...state.vocabulary, ...newWords],
        vocabularyCount: state.vocabulary.length + newWords.length,
      }
    }
    case 'UNLOCK_ACHIEVEMENT': {
      if (state.unlockedAchievements.includes(action.payload)) return state
      return {
        ...state,
        unlockedAchievements: [...state.unlockedAchievements, action.payload],
      }
    }
    case 'ADD_MISTAKES': {
      const newMistakes = [...state.mistakes]
      const newCounts = { ...state.mistakeCounts }

      for (const mistake of action.payload) {
        const category = mistake.category || 'other'

        // Check if this exact mistake pattern already exists
        const existingIdx = newMistakes.findIndex(
          (m) => m.original?.toLowerCase() === mistake.original?.toLowerCase()
        )

        if (existingIdx >= 0) {
          // Increment count for repeated mistake
          newMistakes[existingIdx] = {
            ...newMistakes[existingIdx],
            count: (newMistakes[existingIdx].count || 1) + 1,
            lastSeen: new Date().toISOString(),
          }
        } else {
          newMistakes.push({
            ...mistake,
            category,
            date: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            count: 1,
          })
        }

        newCounts[category] = (newCounts[category] || 0) + 1
      }

      // Also add new mistakes as review items
      const existingReviewIds = new Set(state.reviewItems.map((r) => r.original?.toLowerCase()))
      const newReviewItems = action.payload
        .filter((m) => !existingReviewIds.has(m.original?.toLowerCase()))
        .map((m) => initReviewItem({ ...m, category: m.category || 'other' }))

      // Keep last 500 unique mistakes
      return {
        ...state,
        mistakes: newMistakes.slice(-500),
        mistakeCounts: newCounts,
        reviewItems: [...state.reviewItems, ...newReviewItems],
      }
    }
    case 'SET_ASSESSMENT': {
      const dated = { ...action.payload, date: new Date().toISOString() }
      return {
        ...state,
        assessmentResult: dated,
        assessmentHistory: [...(state.assessmentHistory || []), dated].slice(-20),
      }
    }
    case 'ADD_PRACTICE_HISTORY': {
      return {
        ...state,
        practiceHistory: [...state.practiceHistory.slice(-83), action.payload],
      }
    }
    case 'INIT_REVIEW_ITEMS': {
      // Migrate existing mistakes into review items (one-time)
      const existingIds = new Set(state.reviewItems.map((r) => r.original?.toLowerCase()))
      const newReviewItems = state.mistakes
        .filter((m) => !existingIds.has(m.original?.toLowerCase()))
        .map((m) => initReviewItem(m))
      return {
        ...state,
        reviewItems: [...state.reviewItems, ...newReviewItems],
      }
    }
    case 'ADD_REVIEW_ITEM': {
      const exists = state.reviewItems.some(
        (r) => r.original?.toLowerCase() === action.payload.original?.toLowerCase()
      )
      if (exists) return state
      return {
        ...state,
        reviewItems: [...state.reviewItems, initReviewItem(action.payload)],
      }
    }
    case 'REVIEW_ITEM': {
      const { itemIndex, quality } = action.payload
      const updated = [...state.reviewItems]
      if (updated[itemIndex]) {
        updated[itemIndex] = calculateNextReview(updated[itemIndex], quality)
      }
      return { ...state, reviewItems: updated }
    }
    case 'INCREMENT_DICTATION': {
      return { ...state, dictationCount: state.dictationCount + 1 }
    }
    case 'COMPLETE_SENTENCE': {
      const id = action.payload
      if (state.completedSentenceIds.includes(id)) return state
      return {
        ...state,
        completedSentenceIds: [...state.completedSentenceIds, id],
      }
    }
    case 'ADD_GENERATED_SENTENCES': {
      return {
        ...state,
        generatedSentences: [...state.generatedSentences, ...action.payload].slice(-500),
      }
    }
    case 'ADD_WORD_TO_LIBRARY': {
      const word = action.payload.word?.toLowerCase()
      const existing = state.wordLibrary.findIndex(w => w.word?.toLowerCase() === word)
      if (existing >= 0) {
        // Word already exists, don't add duplicate
        return state
      }
      return {
        ...state,
        wordLibrary: [...state.wordLibrary, {
          ...action.payload,
          encounters: 1,
          correctQuizzes: 0,
          mastered: false,
          addedDate: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
        }],
      }
    }
    case 'ENCOUNTER_WORD': {
      // Increment encounter count for an existing word
      const word = action.payload?.toLowerCase()
      const idx = state.wordLibrary.findIndex(w => w.word?.toLowerCase() === word)
      if (idx < 0) return state
      const updated = [...state.wordLibrary]
      const newEncounters = (updated[idx].encounters || 1) + 1
      updated[idx] = {
        ...updated[idx],
        encounters: newEncounters,
        lastSeen: new Date().toISOString(),
      }
      return { ...state, wordLibrary: updated }
    }
    case 'QUIZ_WORD_CORRECT': {
      const word = action.payload?.toLowerCase()
      const idx = state.wordLibrary.findIndex(w => w.word?.toLowerCase() === word)
      if (idx < 0) return state
      const updated = [...state.wordLibrary]
      const newCorrect = (updated[idx].correctQuizzes || 0) + 1
      const newEncounters = (updated[idx].encounters || 1) + 1
      updated[idx] = {
        ...updated[idx],
        encounters: newEncounters,
        correctQuizzes: newCorrect,
        mastered: newCorrect >= 5,
        lastSeen: new Date().toISOString(),
      }
      return { ...state, wordLibrary: updated }
    }
    case 'QUIZ_WORD_WRONG': {
      const word = action.payload?.toLowerCase()
      const idx = state.wordLibrary.findIndex(w => w.word?.toLowerCase() === word)
      if (idx < 0) return state
      const updated = [...state.wordLibrary]
      updated[idx] = {
        ...updated[idx],
        encounters: (updated[idx].encounters || 1) + 1,
        lastSeen: new Date().toISOString(),
      }
      return { ...state, wordLibrary: updated }
    }
    case 'MARK_WORD_MASTERED': {
      const idx = state.wordLibrary.findIndex(w => w.word?.toLowerCase() === action.payload?.toLowerCase())
      if (idx < 0) return state
      const updated = [...state.wordLibrary]
      updated[idx] = { ...updated[idx], mastered: true, correctQuizzes: 5 }
      return { ...state, wordLibrary: updated }
    }
    case 'SET_ONBOARDING': {
      return {
        ...state,
        onboardingComplete: true,
        learningGoals: action.payload.goals || [],
        timeBudget: action.payload.timeBudget || 15,
        placementLevel: action.payload.placementLevel || null,
      }
    }
    case 'SET_DAILY_PROGRESS': {
      return { ...state, dailyLessonProgress: action.payload }
    }
    case 'ADD_SESSION_HISTORY': {
      return {
        ...state,
        sessionHistory: [...state.sessionHistory.slice(-99), action.payload],
      }
    }
    case 'SET_COLLOQUIAL_MODE': {
      return { ...state, colloquialMode: action.payload }
    }
    case 'SET_TRANSCRIPT_LEVEL': {
      return { ...state, transcriptLevel: action.payload }
    }
    case 'INCREMENT_GRAMMAR': {
      return { ...state, grammarLessonsCompleted: (state.grammarLessonsCompleted || 0) + 1 }
    }
    case 'INCREMENT_VIDEOS': {
      return { ...state, videosWatched: (state.videosWatched || 0) + 1 }
    }
    case 'INCREMENT_DAILY_LESSONS': {
      return { ...state, dailyLessonsCompleted: (state.dailyLessonsCompleted || 0) + 1 }
    }
    case 'CLEAR_LEVEL_UP': {
      return { ...state, _levelUp: null }
    }
    case 'LOAD_STATE': {
      return { ...action.payload, _levelUp: null }
    }
    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState, () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return { ...initialState, ...parsed, _levelUp: null }
      }
    } catch {}
    return initialState
  })

  const [pendingAchievements, setPendingAchievements] = useState([])
  const prevStateRef = useRef(state)

  // Save to localStorage
  useEffect(() => {
    const { _levelUp, ...stateToSave } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
  }, [state])

  // Check achievements on state change
  useEffect(() => {
    const newAchievements = checkAchievements(state)
    if (newAchievements.length > 0) {
      newAchievements.forEach((id) => {
        dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: id })
      })
      setPendingAchievements((prev) => [...prev, ...newAchievements])
    }
    prevStateRef.current = state
  }, [state.xp, state.totalMessages, state.streak, state.completedScenarios.length, state.vocabularyCount, state.perfectMessages, state.dictationCount, state.reviewItems, state.dailyLessonsCompleted, state.videosWatched, state.grammarLessonsCompleted])

  const dismissAchievement = useCallback(() => {
    setPendingAchievements((prev) => prev.slice(1))
  }, [])

  const addXP = useCallback((amount) => {
    dispatch({ type: 'ADD_XP', payload: amount })
    dispatch({ type: 'UPDATE_STREAK' })
  }, [])

  const addMessage = useCallback((perfect = false) => {
    dispatch({ type: 'ADD_MESSAGE', payload: { perfect } })
  }, [])

  const completeScenario = useCallback((scenarioId) => {
    dispatch({ type: 'COMPLETE_SCENARIO', payload: { scenarioId } })
  }, [])

  const addVocabulary = useCallback((words) => {
    dispatch({ type: 'ADD_VOCABULARY', payload: words })
  }, [])

  const clearLevelUp = useCallback(() => {
    dispatch({ type: 'CLEAR_LEVEL_UP' })
  }, [])

  const addMistakes = useCallback((mistakes) => {
    if (mistakes && mistakes.length > 0) {
      dispatch({ type: 'ADD_MISTAKES', payload: mistakes })
    }
  }, [])

  const setAssessment = useCallback((result) => {
    dispatch({ type: 'SET_ASSESSMENT', payload: result })
  }, [])

  const reviewItem = useCallback((itemIndex, quality) => {
    dispatch({ type: 'REVIEW_ITEM', payload: { itemIndex, quality } })
  }, [])

  const incrementDictation = useCallback(() => {
    dispatch({ type: 'INCREMENT_DICTATION' })
  }, [])

  const completeSentence = useCallback((id) => {
    dispatch({ type: 'COMPLETE_SENTENCE', payload: id })
  }, [])

  const addGeneratedSentences = useCallback((sentences) => {
    dispatch({ type: 'ADD_GENERATED_SENTENCES', payload: sentences })
  }, [])

  const addWordToLibrary = useCallback((word) => {
    dispatch({ type: 'ADD_WORD_TO_LIBRARY', payload: word })
  }, [])

  const encounterWord = useCallback((word) => {
    dispatch({ type: 'ENCOUNTER_WORD', payload: word })
  }, [])

  const quizWordCorrect = useCallback((word) => {
    dispatch({ type: 'QUIZ_WORD_CORRECT', payload: word })
  }, [])

  const quizWordWrong = useCallback((word) => {
    dispatch({ type: 'QUIZ_WORD_WRONG', payload: word })
  }, [])

  const markWordMastered = useCallback((word) => {
    dispatch({ type: 'MARK_WORD_MASTERED', payload: word })
  }, [])

  const setOnboarding = useCallback((data) => {
    dispatch({ type: 'SET_ONBOARDING', payload: data })
  }, [])

  const setDailyProgress = useCallback((data) => {
    dispatch({ type: 'SET_DAILY_PROGRESS', payload: data })
  }, [])

  const addSessionHistory = useCallback((data) => {
    dispatch({ type: 'ADD_SESSION_HISTORY', payload: data })
  }, [])

  const setColloquialMode = useCallback((val) => {
    dispatch({ type: 'SET_COLLOQUIAL_MODE', payload: val })
  }, [])

  const setTranscriptLevel = useCallback((val) => {
    dispatch({ type: 'SET_TRANSCRIPT_LEVEL', payload: val })
  }, [])

  const incrementGrammar = useCallback(() => {
    dispatch({ type: 'INCREMENT_GRAMMAR' })
  }, [])

  const incrementVideos = useCallback(() => {
    dispatch({ type: 'INCREMENT_VIDEOS' })
  }, [])

  const incrementDailyLessons = useCallback(() => {
    dispatch({ type: 'INCREMENT_DAILY_LESSONS' })
  }, [])

  // One-time migration: init review items from existing mistakes
  useEffect(() => {
    if (state.mistakes.length > 0 && state.reviewItems.length === 0) {
      dispatch({ type: 'INIT_REVIEW_ITEMS' })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const reviewDueCount = useMemo(() => {
    return getItemsDueForReview(state.reviewItems).length
  }, [state.reviewItems])

  // Active CEFR level computed from all performance signals
  const activeLevel = useMemo(() => computeLevel(state), [
    state.assessmentResult, state.placementLevel, state.mistakeCounts,
    state.wordLibrary, state.totalMessages, state.perfectMessages,
  ])

  const value = {
    state,
    activeLevel,
    addXP,
    addMessage,
    completeScenario,
    addVocabulary,
    clearLevelUp,
    addMistakes,
    setAssessment,
    pendingAchievements,
    dismissAchievement,
    reviewItem,
    reviewDueCount,
    incrementDictation,
    completeSentence,
    addGeneratedSentences,
    addWordToLibrary,
    encounterWord,
    quizWordCorrect,
    quizWordWrong,
    markWordMastered,
    setOnboarding,
    setDailyProgress,
    addSessionHistory,
    setColloquialMode,
    setTranscriptLevel,
    incrementGrammar,
    incrementVideos,
    incrementDailyLessons,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame must be used within GameProvider')
  return context
}
