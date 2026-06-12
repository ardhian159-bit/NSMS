'use client'

import { useState, useEffect } from 'react'
import Link, { useLinkStatus } from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  GitBranch,
  Eye,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  UserCog,
  MapPin,
  BarChart2,
  Loader2,
} from 'lucide-react'
import type { Profile } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import Logo from '@/components/layout/Logo'
import ThemeToggle from '@/components/theme/ThemeToggle'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SidebarProps {
  profile: Profile
}

const STORAGE_KEY = 'nsms_sidebar_collapsed'

// Spinner per-link — useLinkStatus() lapor pending saat navigasi sedang jalan.
// Harus dirender sebagai descendant <Link> agar dapat status link tsb.
function NavPending({ collapsed }: { collapsed: boolean }) {
  const { pending } = useLinkStatus()
  if (!pending) return null
  return (
    <Loader2
      className={`w-3.5 h-3.5 animate-spin flex-shrink-0 ${collapsed ? 'absolute right-1 top-1' : 'ml-auto'}`}
    />
  )
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'sales', 'am', 'guest', 'mp', 'sp', 'dirut'] },
  { href: '/performance', label: 'Performance', icon: BarChart2, roles: ['superadmin', 'admin'] },
  { href: '/pipeline', label: 'Pipeline', icon: GitBranch, roles: ['superadmin', 'admin', 'sales', 'am', 'mp', 'sp', 'dirut'] },
  { href: '/admin', label: 'Admin Panel', icon: ShieldCheck, roles: ['superadmin', 'admin'] },
  { href: '/monitoring', label: 'Monitoring', icon: Eye, roles: ['superadmin', 'admin', 'sales', 'am', 'mp', 'sp', 'dirut'] },
  { href: '/map', label: 'Peta Sebaran', icon: MapPin, roles: ['superadmin', 'admin', 'mp', 'sp', 'dirut', 'am'] },
  { href: '/control', label: 'Control Panel', icon: Settings, roles: ['superadmin'] },
  { href: '/settings', label: 'Pengaturan', icon: UserCog, roles: ['superadmin', 'admin', 'sales', 'am', 'guest', 'mp', 'sp', 'dirut'] },
]

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Load from localStorage on mount + sync CSS variable
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const isCollapsed = stored === 'true'
    setCollapsed(isCollapsed)
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '64px' : '220px')
  }, [])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(STORAGE_KEY, String(next))
    document.documentElement.style.setProperty('--sidebar-width', next ? '64px' : '220px')
  }

  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(profile.role)
  )

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={`
          hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0
          bg-surface border-r border-line z-30
          transition-all duration-200 ease-in-out
          ${collapsed ? 'md:w-16' : 'md:w-[220px]'}
        `}
      >
        {/* Header: Logo + Toggle */}
        <div className="h-16 flex items-center border-b border-line px-3">
          <div className={`flex items-center w-full ${collapsed ? 'justify-center' : 'justify-between px-2'}`}>
            <button onClick={toggle} className="flex-shrink-0">
              <Logo collapsed={collapsed} />
            </button>
            {!collapsed && (
              <button
                onClick={toggle}
                className="p-1.5 rounded-md text-ink-hint hover:text-ink hover:bg-page transition-colors"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-4 space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href)

            const linkContent = (
              <Link
                href={item.href}
                className={`
                  relative flex items-center gap-3 rounded-lg text-sm font-medium transition-colors
                  ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}
                  ${isActive
                    ? 'bg-accent-solid text-accent-on'
                    : 'text-ink-muted hover:bg-page hover:text-ink'
                  }
                `}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!collapsed && item.label}
                <NavPending collapsed={collapsed} />
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.href}>{linkContent}</div>
          })}

          {/* Expand button when collapsed */}
          {collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggle}
                  className="flex items-center justify-center w-full py-2.5 rounded-lg text-ink-hint hover:text-ink hover:bg-page transition-colors mt-2"
                >
                  <PanelLeftOpen className="w-[18px] h-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Expand
              </TooltipContent>
            </Tooltip>
          )}
        </nav>

        {/* Footer: User Info */}
        <div className="border-t border-line p-3">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-page flex items-center justify-center">
                    <span className="text-xs font-semibold text-ink">
                      {(profile.picName || profile.username || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <p className="font-medium">{profile.picName || profile.username}</p>
                <p className="text-xs capitalize opacity-70">{profile.role}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              <div className="mb-3">
                <ThemeToggle variant="compact" />
              </div>
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className="w-8 h-8 rounded-full bg-page flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-ink">
                    {(profile.picName || profile.username || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">
                    {profile.picName || profile.username}
                  </p>
                  <p className="text-[11px] text-ink-hint capitalize">{profile.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs text-ink-hint hover:text-ink transition-colors w-full px-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
