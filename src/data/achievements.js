import {
  MessageCircle, Flame, Star, Trophy, Coffee, Briefcase,
  Globe, BookOpen, Zap, Heart, Sun, Moon, Target, Award, Crown,
  RefreshCw, Headphones, Activity, Video, PenTool,
} from 'lucide-react'

export const achievements = [
  {
    id: 'first_chat',
    name: 'Prima Parola',
    nameEn: 'First Word',
    description: 'Complete your first conversation',
    icon: MessageCircle,
    condition: (state) => state.totalMessages >= 1,
    category: 'milestones',
  },
  {
    id: 'ten_chats',
    name: 'Chiacchierone',
    nameEn: 'Chatterbox',
    description: 'Send 50 messages',
    icon: MessageCircle,
    condition: (state) => state.totalMessages >= 50,
    category: 'milestones',
  },
  {
    id: 'hundred_chats',
    name: 'Instancabile',
    nameEn: 'Unstoppable',
    description: 'Send 200 messages',
    icon: Zap,
    condition: (state) => state.totalMessages >= 200,
    category: 'milestones',
  },
  {
    id: 'streak_3',
    name: 'Costante',
    nameEn: 'Consistent',
    description: 'Maintain a 3-day streak',
    icon: Flame,
    condition: (state) => state.bestStreak >= 3,
    category: 'streaks',
  },
  {
    id: 'streak_7',
    name: 'Dedicato',
    nameEn: 'Dedicated',
    description: 'Maintain a 7-day streak',
    icon: Flame,
    condition: (state) => state.bestStreak >= 7,
    category: 'streaks',
  },
  {
    id: 'streak_30',
    name: 'Leggendario',
    nameEn: 'Legendary',
    description: 'Maintain a 30-day streak',
    icon: Crown,
    condition: (state) => state.bestStreak >= 30,
    category: 'streaks',
  },
  {
    id: 'perfect_5',
    name: 'Perfezionista',
    nameEn: 'Perfectionist',
    description: 'Get 5 messages with no corrections needed',
    icon: Star,
    condition: (state) => state.perfectMessages >= 5,
    category: 'accuracy',
  },
  {
    id: 'perfect_25',
    name: 'Senza Errori',
    nameEn: 'Flawless',
    description: 'Get 25 messages with no corrections needed',
    icon: Target,
    condition: (state) => state.perfectMessages >= 25,
    category: 'accuracy',
  },
  {
    id: 'scenario_first',
    name: 'Attore',
    nameEn: 'Actor',
    description: 'Complete your first scenario',
    icon: Trophy,
    condition: (state) => state.completedScenarios.length >= 1,
    category: 'scenarios',
  },
  {
    id: 'scenario_5',
    name: 'Protagonista',
    nameEn: 'Protagonist',
    description: 'Complete 5 scenarios',
    icon: Award,
    condition: (state) => state.completedScenarios.length >= 5,
    category: 'scenarios',
  },
  {
    id: 'daily_life_master',
    name: 'Cittadino',
    nameEn: 'Citizen',
    description: 'Complete all Daily Life scenarios',
    icon: Coffee,
    condition: (state) => {
      const dailyIds = ['coffee_bar', 'pharmacy', 'grocery', 'directions']
      return dailyIds.every((id) => state.completedScenarios.includes(id))
    },
    category: 'scenarios',
  },
  {
    id: 'professional_master',
    name: 'Professionista',
    nameEn: 'Professional',
    description: 'Complete all Professional scenarios',
    icon: Briefcase,
    condition: (state) => {
      const proIds = ['job_interview', 'business_call', 'presenting', 'office_meeting']
      return proIds.every((id) => state.completedScenarios.includes(id))
    },
    category: 'scenarios',
  },
  {
    id: 'travel_master',
    name: 'Globetrotter',
    nameEn: 'Globetrotter',
    description: 'Complete all Travel scenarios',
    icon: Globe,
    condition: (state) => {
      const travelIds = ['hotel_checkin', 'train_station', 'museum', 'emergency']
      return travelIds.every((id) => state.completedScenarios.includes(id))
    },
    category: 'scenarios',
  },
  {
    id: 'vocab_50',
    name: 'Lessicografo',
    nameEn: 'Lexicographer',
    description: 'Learn 50 new vocabulary words',
    icon: BookOpen,
    condition: (state) => state.vocabularyCount >= 50,
    category: 'vocabulary',
  },
  {
    id: 'review_first',
    name: 'Prima Revisione',
    nameEn: 'First Review',
    description: 'Complete your first review session',
    icon: RefreshCw,
    condition: (state) => state.reviewItems?.some((i) => i.reviewCount > 0),
    category: 'milestones',
  },
  {
    id: 'listener',
    name: 'Buon Ascoltatore',
    nameEn: 'Good Listener',
    description: 'Complete 10 dictation exercises',
    icon: Headphones,
    condition: (state) => (state.dictationCount || 0) >= 10,
    category: 'milestones',
  },
  {
    id: 'daily_7',
    name: 'Studente Modello',
    nameEn: 'Model Student',
    description: 'Complete 7 daily lessons',
    icon: BookOpen,
    condition: (state) => (state.dailyLessonsCompleted || 0) >= 7,
    category: 'milestones',
  },
  {
    id: 'cinephile',
    name: 'Cinefilo',
    nameEn: 'Film Buff',
    description: 'Watch 5 Italian videos',
    icon: Video,
    condition: (state) => (state.videosWatched || 0) >= 5,
    category: 'milestones',
  },
  {
    id: 'grammarian',
    name: 'Grammatico',
    nameEn: 'Grammarian',
    description: 'Complete 3 grammar lessons',
    icon: PenTool,
    condition: (state) => (state.grammarLessonsCompleted || 0) >= 3,
    category: 'milestones',
  },
  {
    id: 'level_10',
    name: 'Diplomatico',
    nameEn: 'Diplomat',
    description: 'Reach level 10',
    icon: Sun,
    condition: (state) => {
      const { getLevelForXP } = require('./levels')
      return getLevelForXP(state.xp).level >= 10
    },
    category: 'milestones',
  },
]

export function checkAchievements(state) {
  const newAchievements = []
  for (const achievement of achievements) {
    if (!state.unlockedAchievements.includes(achievement.id)) {
      try {
        if (achievement.condition(state)) {
          newAchievements.push(achievement.id)
        }
      } catch {
        // skip achievements with import dependencies during initial load
      }
    }
  }
  return newAchievements
}
