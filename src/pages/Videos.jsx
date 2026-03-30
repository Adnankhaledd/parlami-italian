import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, ArrowLeft, Clock, ExternalLink } from 'lucide-react'
import { useGame } from '../contexts/GameContext'
import { youtubeVideos, videoCategories, videoLevels } from '../data/youtubeVideos'
import ComprehensionQuiz from '../components/Comprehension/ComprehensionQuiz'

const LEVEL_COLORS = {
  A1: 'bg-olive/10 text-olive',
  A2: 'bg-olive/10 text-olive',
  B1: 'bg-blue-500/10 text-blue-400',
  B2: 'bg-blue-500/10 text-blue-400',
  C1: 'bg-coral/10 text-coral',
  C2: 'bg-red-500/10 text-red-400',
}

export default function Videos() {
  const [selectedLevel, setSelectedLevel] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeVideo, setActiveVideo] = useState(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const { addXP, incrementVideos } = useGame()

  const filteredVideos = useMemo(() => {
    return youtubeVideos.filter((v) => {
      if (selectedLevel !== 'all' && v.level !== selectedLevel) return false
      if (selectedCategory !== 'all' && v.category !== selectedCategory) return false
      return true
    })
  }, [selectedLevel, selectedCategory])

  const handleWatchComplete = () => {
    addXP(15)
    incrementVideos()
    setShowQuiz(true)
  }

  const handleQuizComplete = ({ correct, total }) => {
    addXP(correct * 10)
  }

  if (activeVideo) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => { setActiveVideo(null); setShowQuiz(false) }}
            className="flex items-center gap-2 text-navy-600 hover:text-cream transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Back to Videos
          </button>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[activeVideo.level]}`}>
            {activeVideo.level}
          </span>
        </div>

        <h1 className="text-xl font-bold text-cream mb-2">{activeVideo.title}</h1>
        <p className="text-sm text-navy-600 mb-4">{activeVideo.description}</p>

        {/* YouTube embed */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-navy-800 mb-6">
          <iframe
            src={`https://www.youtube.com/embed/${activeVideo.id}`}
            title={activeVideo.title}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {!showQuiz ? (
          <div className="text-center">
            <button onClick={handleWatchComplete} className="btn-primary inline-flex items-center gap-2">
              Test Your Comprehension
            </button>
            <p className="text-xs text-navy-600 mt-2">Answer questions about what you watched</p>
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            <h2 className="text-sm font-bold text-cream mb-3">Comprehension Check</h2>
            <ComprehensionQuiz
              passage={`A video titled "${activeVideo.title}" about: ${activeVideo.description}`}
              level={activeVideo.level}
              questionCount={3}
              onComplete={handleQuizComplete}
            />
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cream">Italian Videos</h1>
        <p className="text-navy-600">Watch real Italian content and test your comprehension</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs text-navy-600 self-center">Level:</span>
        <button
          onClick={() => setSelectedLevel('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${selectedLevel === 'all' ? 'bg-terracotta/15 text-terracotta' : 'bg-navy-800 text-navy-600 hover:text-cream'}`}
        >
          All
        </button>
        {videoLevels.map((l) => (
          <button
            key={l}
            onClick={() => setSelectedLevel(l)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${selectedLevel === l ? 'bg-terracotta/15 text-terracotta' : 'bg-navy-800 text-navy-600 hover:text-cream'}`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {videoCategories.map(({ id, name, emoji }) => (
          <button
            key={id}
            onClick={() => setSelectedCategory(id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${selectedCategory === id ? 'bg-terracotta/15 text-terracotta' : 'bg-navy-800 text-navy-600 hover:text-cream'}`}
          >
            {emoji} {name}
          </button>
        ))}
      </div>

      {/* Video grid */}
      {filteredVideos.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-navy-600">No videos match your filters</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVideos.map((video) => (
            <motion.button
              key={video.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setActiveVideo(video)}
              className="card-hover text-left group cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-navy-800 mb-3">
                <img
                  src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={32} className="text-white" />
                </div>
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  {video.duration}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-cream mb-1 line-clamp-2">{video.title}</h3>
              <p className="text-xs text-navy-600 mb-2">{video.channel}</p>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[video.level]}`}>
                  {video.level}
                </span>
                <span className="text-xs text-navy-600 capitalize">{video.category}</span>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
