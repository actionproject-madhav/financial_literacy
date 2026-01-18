import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, HelpCircle } from 'lucide-react'
import { useUserStore } from '../../stores/userStore'
import { cn } from '../../utils/cn'
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

  // Using custom SVGs from public folder
  const menuItems = [
    { icon: '/home-pixel.svg', label: t('nav.learn'), path: '/learn' },
    { icon: '/leaderboard.svg', label: t('nav.leaderboard'), path: '/leaderboard' },
    { icon: '/quest.svg', label: t('nav.quests'), path: '/quests' },
    { icon: '/shop.svg', label: t('nav.shop'), path: '/shop' },
    { icon: '/profile.svg', label: t('nav.profile'), path: '/profile' },
    { icon: '/setting.svg', label: 'Settings', path: '/settings' },
  ]

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error: any) {
      console.error('Logout API error:', error);
    }
    logout();
    navigate('/auth');
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-50 bg-white">
      <div className="flex flex-col h-full bg-white border-r border-gray-200">
        <div className="p-8 pb-4">
          <Link to="/learn" className="flex items-center gap-3">
            <div className="bg-[#58CC02] p-2 rounded-xl">
              <span className="text-white font-bold text-xl">$</span>
            </div>
            <h1 className="text-2xl font-bold text-[#58CC02] tracking-tight">FinLit</h1>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = (
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path)) ||
              (item.path === '/learn' && location.pathname.startsWith('/section'))
            )

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl uppercase tracking-widest text-sm font-bold",
                  "transition-colors duration-100",
                  isActive
                    ? "bg-sky-100 text-sky-600"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 active:bg-gray-200"
                )}
              >
                <img
                  src={item.icon}
                  alt=""
                  className="w-8 h-8 object-contain"
                  draggable={false}
                />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Link
            to="/help"
            className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-gray-700 font-bold text-sm uppercase tracking-widest transition-colors duration-100 rounded-xl hover:bg-gray-100 active:bg-gray-200"
          >
            <HelpCircle className="w-5 h-5" strokeWidth={2.5} />
            <span>Help</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-red-500 font-bold text-sm uppercase tracking-widest transition-colors duration-100 rounded-xl hover:bg-red-50 active:bg-red-100"
          >
            <LogOut className="w-5 h-5" strokeWidth={2.5} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
