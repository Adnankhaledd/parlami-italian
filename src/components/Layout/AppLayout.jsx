import Sidebar from './Sidebar'
import XPBar from '../Gamification/XPBar'

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-navy-900">
      <Sidebar />
      <div className="pl-20 lg:pl-64">
        <header className="sticky top-0 z-40 bg-navy-900/80 backdrop-blur-xl border-b border-navy-700/30">
          <div className="px-6 py-3">
            <XPBar />
          </div>
        </header>
        <main className="p-6 lg:p-8 max-w-6xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
