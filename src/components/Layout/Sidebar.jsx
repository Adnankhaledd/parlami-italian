import { NavLink } from 'react-router-dom'
import { Home, BookOpen, MessageCircle, Headphones, Map, Video, PenTool, RefreshCw, Activity, Crosshair, GraduationCap, BarChart3, Flame, HelpCircle, Library, Mic } from 'lucide-react'
import { useGame } from '../../contexts/GameContext'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/daily-practice', icon: Mic, label: 'Daily Practice' },
  { to: '/daily', icon: BookOpen, label: 'Daily Lesson', showDaily: true },
  { to: '/practice', icon: MessageCircle, label: 'Practice' },
  { to: '/qa', icon: HelpCircle, label: 'Q&A' },
  { to: '/listening', icon: Headphones, label: 'Listening' },
  { to: '/words', icon: Library, label: 'Word Library' },
  { to: '/scenarios', icon: Map, label: 'Scenarios' },
  { to: '/videos', icon: Video, label: 'Videos' },
  { to: '/grammar', icon: PenTool, label: 'Grammar' },
  { to: '/review', icon: RefreshCw, label: 'Review', showBadge: true },
  { to: '/skills', icon: Activity, label: 'Skills' },
  { to: '/insights', icon: Crosshair, label: 'Insights' },
  { to: '/assessment', icon: GraduationCap, label: 'Assessment' },
  { to: '/progress', icon: BarChart3, label: 'Progress' },
]

export default function Sidebar() {
  const { state, reviewDueCount } = useGame()

  const today = new Date().toISOString().split('T')[0]
  const dailyDone = state.dailyLessonProgress?.date === today && state.dailyLessonProgress?.completed

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 lg:w-64 bg-navy-800 border-r border-navy-700/50 flex flex-col z-50">
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-navy-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terracotta to-coral flex items-center justify-center text-white font-bold text-lg shrink-0">
            P
          </div>
          <div className="hidden lg:block">
            <h1 className="font-bold text-lg text-cream">Parlami</h1>
            <p className="text-xs text-navy-600">Speak Italian</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 lg:p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, showBadge, showDaily }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-terracotta/10 text-terracotta'
                  : 'text-navy-600 hover:text-cream hover:bg-navy-700/50'
              }`
            }
          >
            <div className="relative shrink-0 mx-auto lg:mx-0">
              <Icon size={18} />
              {showBadge && reviewDueCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-coral text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {reviewDueCount > 9 ? '9+' : reviewDueCount}
                </span>
              )}
              {showDaily && !dailyDone && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-terracotta rounded-full" />
              )}
              {showDaily && dailyDone && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-olive rounded-full" />
              )}
            </div>
            <span className="hidden lg:block font-medium text-xs">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Streak Badge */}
      <div className="p-2 lg:p-3 border-t border-navy-700/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="relative shrink-0 mx-auto lg:mx-0">
            <Flame
              size={22}
              className={state.streak > 0 ? 'text-coral fill-coral' : 'text-navy-600'}
            />
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-semibold text-cream">{state.streak} day streak</p>
            <p className="text-xs text-navy-600">
              {state.streak > 0 ? 'Keep it going!' : 'Start today!'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
