import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, HelpCircle } from 'lucide-react'
import { useUserStore } from '../../stores/userStore'
import { cn } from '../../utils/cn'
import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { authApi } from '../../services/api'

interface SidebarProps {
  onCoachClick?: () => void;
}

export const Sidebar = ({ onCoachClick }: SidebarProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useUserStore()
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const isMobile = window.innerWidth < 1024;

  // Using custom SVGs from public folder
  const menuItems = [
    { icon: '/home-pixel.svg', label: t('nav.learn'), path: '/learn' },
    { icon: '/leaderboard.svg', label: t('nav.leaderboard'), path: '/leaderboard' },
    { icon: '/quest.svg', label: t('nav.quests'), path: '/quests' },
    { icon: '/shop.svg', label: t('nav.shop'), path: '/shop' },
    { icon: '/profile.svg', label: t('nav.profile'), path: '/profile' },
    { icon: '/setting.svg', label: 'Settings', path: '/settings' },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-8 pb-4">
        <Link to="/learn" className="flex items-center gap-3">
          <div className="bg-[#58CC02] p-2 rounded-xl">
            <span className="text-white font-bold text-xl">$</span>
          </div>
          <h1 className="text-2xl font-bold text-[#58CC02] tracking-tight">FinLit</h1>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-0 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = !item.isButton && (
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path)) ||
            (item.path === '/learn' && location.pathname.startsWith('/section'))
          )

          if (item.isButton && item.label === t('nav.coach')) {
            return (
              <button
                key={item.path}
                onClick={onCoachClick}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-2 rounded-xl transition-all duration-200 group uppercase tracking-widest text-sm font-bold border-2",
                  "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900 border-transparent"
                )}
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  className="w-8 h-8 object-contain"
                />
                <span>{item.label}</span>
              </button>
            )
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-4 py-2 rounded-xl transition-all duration-200 group uppercase tracking-widest text-sm font-bold border-2",
                isActive
                  ? "bg-sky-100 text-sky-500 border-sky-300"
                  : "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900 border-transparent"
              )}
            >
              <img
                src={item.icon}
                alt={item.label}
                className="w-8 h-8 object-contain"
              />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <Link to="/help" className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-gray-900 font-bold text-sm uppercase tracking-widest transition-colors rounded-xl hover:bg-gray-100">
          <HelpCircle className="w-5 h-5" strokeWidth={2.5} />
          <span>Help</span>
        </Link>
        <button
          onClick={async () => {
            try {
              // Clear backend session
              await authApi.logout();
            } catch (error: any) {
              console.error('Logout API error:', error);
              // Continue with logout even if API call fails
              // The error might be "URL not found" if backend is down, but we still want to clear local state
            }
            // Clear local state (always do this, even if API call failed)
            logout();
            // Navigate to auth page (HashRouter will add # automatically)
            navigate('/auth');
          }}
          className="w-full flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-red-500 font-bold text-sm uppercase tracking-widest transition-colors rounded-xl hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" strokeWidth={2.5} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-50 bg-white">
        <SidebarContent />
      </aside>
    </>
  )
}
