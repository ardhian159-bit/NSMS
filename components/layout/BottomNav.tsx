'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Eye,
  Plus,
  GitBranch,
  Settings,
  UserCog,
  MapPin,
} from 'lucide-react'
import type { Profile } from '@/lib/types'

interface BottomNavProps {
  profile: Profile
}

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard, roles: ['superadmin', 'admin', 'sales', 'am', 'guest', 'mp', 'sp', 'dirut'] },
  { href: '/monitoring', label: 'Monitoring',  icon: Eye,             roles: ['superadmin', 'admin', 'sales', 'am', 'mp', 'sp', 'dirut'] },
  { href: '/map',        label: 'Peta',         icon: MapPin,          roles: ['superadmin', 'admin', 'mp', 'sp', 'dirut', 'am'] },
  // FAB placeholder — handled separately
  { href: '/pipeline',   label: 'Pipeline',    icon: GitBranch,       roles: ['superadmin', 'admin', 'sales', 'am'] },
  { href: '/control',    label: 'Kontrol',     icon: Settings,        roles: ['superadmin'] },
  { href: '/settings',   label: 'Pengaturan',  icon: UserCog,         roles: ['superadmin', 'admin', 'sales', 'am', 'guest', 'mp', 'sp', 'dirut'] },
]

export default function BottomNav({ profile }: BottomNavProps) {
  const pathname = usePathname()

  const leftItems = NAV_ITEMS.filter(
    (item) => item.roles.includes(profile.role) && (item.href === '/dashboard' || item.href === '/monitoring' || item.href === '/map')
  )
  const rightItems = NAV_ITEMS.filter(
    (item) => item.roles.includes(profile.role) && (item.href === '/pipeline' || item.href === '/control' || item.href === '/settings')
  )

  const showFab = ['superadmin', 'admin', 'sales', 'am'].includes(profile.role)

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#EBEBE7] safe-area-bottom">
      <nav className="flex items-center justify-around h-16 px-2 relative">
        {/* Left side items */}
        {leftItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 ${
                isActive ? 'text-[#1A1A18]' : 'text-[#A0A09A]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}

        {/* Center FAB */}
        {showFab && (
          <div className="flex-1 flex items-center justify-center">
            <Link
              href="/pipeline/new"
              className="w-12 h-12 bg-[#1A1A18] rounded-xl flex items-center justify-center -mt-4 shadow-lg"
            >
              <Plus className="w-6 h-6 text-white" />
            </Link>
          </div>
        )}

        {/* Right side items */}
        {rightItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 ${
                isActive ? 'text-[#1A1A18]' : 'text-[#A0A09A]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
