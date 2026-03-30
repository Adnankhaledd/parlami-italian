import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Play, RotateCcw, CheckCircle2, Mic, Headphones, Clock, Target, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import ChatWindow from '../components/Chat/ChatWindow'
import { useGame } from '../contexts/GameContext'

const ASSESSMENT_PROMPT = `You are an Italian language assessor. Evaluate the learner's level through a focused 5-minute conversation (~8 turns).

IMPORTANT: Respond with valid JSON only.

ASSESSMENT STRUCTURE:
1. (Turns 1-2) SPEAKING WARM-UP: Simple factual questions — name, city, job. Assess basic speaking. (A1-A2)
2. (Turns 3-4) SPEAKING DEPTH: Ask about past events, opinions, plans. Listen for past tense, connectors, subjunctive hints. (A2-B1)
3. (Turns 5-6) LISTENING TEST: Send a short Italian passage (3-4 sentences about a scenario) and ask 2 comprehension questions about it. Assess whether they understood details. (B1)
4. (Turns 7-8) SPEAKING COMPLEXITY: Ask hypothetical/conditional questions. Listen for congiuntivo, condizionale, complex structures. (B1-B2+)

After turn 8 (messages array has 16+ items), ALWAYS include the assessment.

JSON format:
{
  "response": "Your Italian message",
  "corrections": [{"original":"...","corrected":"...","explanation":"...","category":"..."}],
  "vocabulary": [],
  "encouragement": "Brief English comment",
  "assessment": null
}

After turn 8, set assessment to:
{
  "level": "A1|A2|B1|B2|C1|C2",
  "sublevel": "low|mid|high",
  "speaking": {"level": "A1-C2", "notes": "Assessment of their speaking ability — grammar accuracy, vocabulary range, sentence complexity, confidence"},
  "listening": {"level": "A1-C2", "notes": "Assessment based on how well they understood your passages and questions"},
  "breakdown": {
    "grammar": {"level": "...", "notes": "..."},
    "vocabulary": {"level": "...", "notes": "..."},
    "fluency": {"level": "...", "notes": "..."},
    "pronunciation": {"level": "...", "notes": "Based on spelling patterns that suggest pronunciation habits"}
  },
  "strengths": ["2-3 specific strengths"],
  "weaknesses": ["2-3 specific areas to improve"],
  "recommendation": "Personalized 2-3 sentence recommendation",
  "timeEstimate": {
    "currentLevel": "B1",
    "targetLevel": "B2",
    "estimatedHours": 200,
    "tips": "Specific advice for reaching the next level"
  }
}

Time estimate guidelines (based on FSI/CEFR research):
- A0→A1: ~60 hours
- A1→A2: ~100 hours
- A2→B1: ~200 hours
- B1→B2: ~200 hours (the hardest jump for most learners)
- B2→C1: ~300 hours
- C1→C2: ~400+ hours
Set targetLevel to one level above currentLevel (or B2 if already B2+, since B2 = conversational fluency).

Rules:
- Be conversational, not exam-like
- For the listening test (turns 5-6), write a mini-scenario in Italian (a voicemail, a news snippet, a story) then ask specific questions about it
- Give assessment after 8 turns — don't wait longer
- Be honest but encouraging`

const cefrColors = {
  A1: 'from-gray-400 to-gray-500',
  A2: 'from-blue-400 to-blue-500',
  B1: 'from-olive to-olive-dark',
  B2: 'from-terracotta to-terracotta-dark',
  C1: 'from-coral to-coral-dark',
  C2: 'from-purple-400 to-purple-600',
}

const cefrDescriptions = {
  A1: 'Beginner — Can understand basic phrases',
  A2: 'Elementary — Can communicate in simple tasks',
  B1: 'Intermediate — Can handle most travel situations',
  B2: 'Upper Intermediate — Can converse fluently with natives',
  C1: 'Advanced — Can express ideas spontaneously',
  C2: 'Mastery — Near-native understanding',
}

// CEFR levels in order for the progress path
const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export default function Assessment() {
  const { state, setAssessment } = useGame()
  const [started, setStarted] = useState(false)
  const [assessmentResult, setAssessmentResult] = useState(state.assessmentResult)
  const [showResult, setShowResult] = useState(!!state.assessmentResult)

  const handleAssessment = useCallback((result) => {
    setAssessmentResult(result)
    setAssessment(result)
    setTimeout(() => setShowResult(true), 1500)
  }, [setAssessment])

  const timeBudget = state.timeBudget || 15

  // Calculate months from time estimate
  const getMonthsEstimate = (hours) => {
    const minutesPerDay = timeBudget
    const hoursPerMonth = (minutesPerDay * 30) / 60
    return Math.ceil(hours / hoursPerMonth)
  }

  // Results view
  if (showResult && assessmentResult) {
    const te = assessmentResult.timeEstimate
    const currentIdx = CEFR_ORDER.indexOf(assessmentResult.level)

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="max-w-2xl mx-auto">
          {/* Level badge */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className={`w-24 h-24 mx-auto mb-4 rounded-3xl bg-gradient-to-br ${cefrColors[assessmentResult.level] || cefrColors.B1} flex items-center justify-center`}
            >
              <span className="text-white font-bold text-3xl">{assessmentResult.level}</span>
            </motion.div>
            <p className="text-coral font-bold text-sm uppercase tracking-wider mb-1">Your Overall Level</p>
            <h1 className="text-3xl font-bold text-cream mb-1">
              {assessmentResult.level} {assessmentResult.sublevel && `(${assessmentResult.sublevel})`}
            </h1>
            <p className="text-navy-600">{cefrDescriptions[assessmentResult.level]}</p>
          </div>

          {/* Speaking vs Listening */}
          {(assessmentResult.speaking || assessmentResult.listening) && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="grid grid-cols-2 gap-4 mb-6">
              {assessmentResult.speaking && (
                <div className="card border-terracotta/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Mic size={18} className="text-terracotta" />
                    <h3 className="text-sm font-bold text-cream">Speaking</h3>
                  </div>
                  <div className={`text-2xl font-bold bg-gradient-to-r ${cefrColors[assessmentResult.speaking.level] || cefrColors.B1} bg-clip-text text-transparent mb-2`}>
                    {assessmentResult.speaking.level}
                  </div>
                  <p className="text-xs text-navy-600">{assessmentResult.speaking.notes}</p>
                </div>
              )}
              {assessmentResult.listening && (
                <div className="card border-blue-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Headphones size={18} className="text-blue-400" />
                    <h3 className="text-sm font-bold text-cream">Listening</h3>
                  </div>
                  <div className={`text-2xl font-bold bg-gradient-to-r ${cefrColors[assessmentResult.listening.level] || cefrColors.B1} bg-clip-text text-transparent mb-2`}>
                    {assessmentResult.listening.level}
                  </div>
                  <p className="text-xs text-navy-600">{assessmentResult.listening.notes}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Skill Breakdown */}
          {assessmentResult.breakdown && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="card mb-6">
              <h3 className="text-sm font-semibold text-cream mb-4">Skill Breakdown</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(assessmentResult.breakdown).map(([skill, data]) => (
                  <div key={skill} className="bg-navy-700/30 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-cream capitalize font-medium">{skill}</span>
                      <span className={`text-sm font-bold bg-gradient-to-r ${cefrColors[data.level] || cefrColors.B1} bg-clip-text text-transparent`}>
                        {data.level}
                      </span>
                    </div>
                    <p className="text-xs text-navy-600">{data.notes}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Time to Fluency */}
          {te && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="card mb-6 border-terracotta/20">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={18} className="text-terracotta" />
                <h3 className="text-sm font-bold text-cream">Time to Conversational Fluency</h3>
              </div>

              {/* Progress path */}
              <div className="flex items-center justify-between mb-6 px-2">
                {CEFR_ORDER.map((level, i) => {
                  const isCurrent = level === (te.currentLevel || assessmentResult.level)
                  const isTarget = level === te.targetLevel
                  const isPast = i < currentIdx
                  const isFuture = i > currentIdx

                  return (
                    <div key={level} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent ? 'bg-terracotta text-white ring-2 ring-terracotta/30 scale-110' :
                        isTarget ? 'bg-olive/20 text-olive border-2 border-olive' :
                        isPast ? 'bg-navy-600 text-cream' :
                        'bg-navy-800 text-navy-600'
                      }`}>
                        {level}
                      </div>
                      {i < CEFR_ORDER.length - 1 && (
                        <div className={`w-4 sm:w-8 h-0.5 ${isPast ? 'bg-navy-600' : 'bg-navy-800'}`} />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-navy-900/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-cream">{te.estimatedHours || '~200'}</p>
                  <p className="text-xs text-navy-600">hours needed</p>
                </div>
                <div className="bg-navy-900/50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-terracotta">{getMonthsEstimate(te.estimatedHours || 200)}</p>
                  <p className="text-xs text-navy-600">months at {timeBudget}min/day</p>
                </div>
                <div className="bg-navy-900/50 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-lg font-bold text-cream">{te.currentLevel || assessmentResult.level}</span>
                    <ArrowRight size={14} className="text-navy-600" />
                    <span className="text-lg font-bold text-olive">{te.targetLevel || 'B2'}</span>
                  </div>
                  <p className="text-xs text-navy-600">your path</p>
                </div>
              </div>

              {te.tips && (
                <p className="text-xs text-cream/70 bg-navy-900/30 rounded-lg p-3">{te.tips}</p>
              )}
            </motion.div>
          )}

          {/* Strengths & Weaknesses */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="grid md:grid-cols-2 gap-4 mb-6">
            {assessmentResult.strengths && (
              <div className="card border-olive/20">
                <h3 className="text-sm font-semibold text-olive mb-3 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Strengths
                </h3>
                <ul className="space-y-2">
                  {assessmentResult.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-cream/80 flex items-start gap-2">
                      <span className="text-olive mt-1">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {assessmentResult.weaknesses && (
              <div className="card border-coral/20">
                <h3 className="text-sm font-semibold text-coral mb-3 flex items-center gap-2">
                  <Target size={16} /> Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {assessmentResult.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-cream/80 flex items-start gap-2">
                      <span className="text-coral mt-1">•</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>

          {/* Recommendation */}
          {assessmentResult.recommendation && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }} className="card mb-6">
              <h3 className="text-sm font-semibold text-cream mb-2">Recommendation</h3>
              <p className="text-sm text-cream/80 leading-relaxed">{assessmentResult.recommendation}</p>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }} className="flex gap-3 justify-center">
            <button onClick={() => { setStarted(true); setShowResult(false); setAssessmentResult(null) }} className="btn-secondary flex items-center gap-2">
              <RotateCcw size={16} /> Retake Assessment
            </button>
            <Link to="/daily" className="btn-primary flex items-center gap-2">
              Start Learning <ArrowRight size={16} />
            </Link>
          </motion.div>

          {assessmentResult.date && (
            <p className="text-center text-xs text-navy-600 mt-4">
              Assessed on {new Date(assessmentResult.date).toLocaleDateString()}
            </p>
          )}
        </div>
      </motion.div>
    )
  }

  // Pre-start view
  if (!started) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-terracotta to-coral flex items-center justify-center">
            <GraduationCap size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-cream mb-3">Level Assessment</h1>
          <p className="text-navy-600 mb-8 leading-relaxed">
            A 5-minute conversation to evaluate your Italian. I'll test both your speaking and listening, then tell you your level and how long it'll take to reach fluency.
          </p>

          <div className="card text-left mb-6">
            <h3 className="text-sm font-semibold text-cream mb-3">What we'll evaluate:</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Mic, label: 'Speaking', desc: 'Grammar, vocabulary, fluency' },
                { icon: Headphones, label: 'Listening', desc: 'Comprehension of Italian' },
                { icon: Target, label: 'Accuracy', desc: 'Grammar & pronunciation' },
                { icon: Clock, label: 'Time to fluency', desc: 'Personalized estimate' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-2">
                  <Icon size={14} className="text-olive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-cream font-medium">{label}</p>
                    <p className="text-xs text-navy-600">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => setStarted(true)} className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
            <Play size={20} /> Start Assessment
          </button>
        </div>
      </motion.div>
    )
  }

  // Chat view with timer
  return <AssessmentChat onAssessment={handleAssessment} />
}

function AssessmentChat({ onAssessment }) {
  const [elapsed, setElapsed] = useState(0)
  const [userMsgCount, setUserMsgCount] = useState(0)
  const [forceMessage, setForceMessage] = useState(null)
  const [cutoffTriggered, setCutoffTriggered] = useState(false)
  const startTime = useRef(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // After 8 user messages, force the assessment
  useEffect(() => {
    if (cutoffTriggered) return
    if (userMsgCount >= 8) {
      setCutoffTriggered(true)
      setForceMessage('Please give me my assessment results now. Evaluate everything we discussed and provide the full assessment with speaking level, listening level, breakdown, strengths, weaknesses, time estimate, and recommendation.')
    }
  }, [userMsgCount, cutoffTriggered])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const msgsLeft = Math.max(0, 8 - userMsgCount)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap size={20} className="text-terracotta" />
            <h1 className="text-2xl font-bold text-cream">Level Assessment</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-navy-600">
              {cutoffTriggered ? 'Evaluating...' : `${msgsLeft} question${msgsLeft !== 1 ? 's' : ''} left`}
            </span>
            <div className="flex items-center gap-1.5 text-sm">
              <Clock size={14} className="text-navy-600" />
              <span className={`font-mono font-medium text-cream`}>
                {minutes}:{seconds.toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
        {/* Progress bar based on questions answered */}
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-navy-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-terracotta to-coral rounded-full transition-all duration-500"
              style={{ width: `${(userMsgCount / 8) * 100}%` }}
            />
          </div>
          <span className="text-xs text-navy-600 shrink-0">{userMsgCount}/8</span>
        </div>
      </div>
      <div className="flex-1 bg-navy-800/50 rounded-2xl border border-terracotta/20 overflow-hidden">
        <ChatWindow
          systemPrompt={ASSESSMENT_PROMPT}
          onAssessment={onAssessment}
          onMessageCount={setUserMsgCount}
          forceMessage={forceMessage}
          placeholder="Answer in Italian..."
        />
      </div>
    </motion.div>
  )
}
