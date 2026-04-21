'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  GitBranch,
  Eye,
  Settings,
  LogOut,
  ShieldCheck,
  UserCog,
  MapPin,
  BarChart2,
} from 'lucide-react'
import type { Profile } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import MobileHeader from './MobileHeader'

interface MobileSidebarDrawerProps {
  profile: Profile
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'sales', 'am', 'guest', 'mp', 'sp', 'dirut'] },
  { href: '/pipeline', label: 'Pipeline', icon: GitBranch, roles: ['superadmin', 'admin', 'sales', 'am'] },
  { href: '/admin', label: 'Admin Panel', icon: ShieldCheck, roles: ['superadmin', 'admin'] },
  { href: '/monitoring', label: 'Monitoring', icon: Eye, roles: ['superadmin', 'admin', 'sales', 'am', 'mp', 'sp', 'dirut'] },
  { href: '/performance', label: 'Performance', icon: BarChart2, roles: ['superadmin', 'admin'] },
  { href: '/map', label: 'Peta Sebaran', icon: MapPin, roles: ['superadmin', 'admin', 'mp', 'sp', 'dirut', 'am'] },
  { href: '/control', label: 'Control Panel', icon: Settings, roles: ['superadmin'] },
  { href: '/settings', label: 'Pengaturan', icon: UserCog, roles: ['superadmin', 'admin', 'sales', 'am', 'guest', 'mp', 'sp', 'dirut'] },
]

export default function MobileSidebarDrawer({ profile }: MobileSidebarDrawerProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const toggleDrawer = () => setMobileOpen(!mobileOpen)
  const closeDrawer = () => setMobileOpen(false)

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(profile.role)
  )

  return (
    <div className="md:hidden">
      <MobileHeader mobileOpen={mobileOpen} onToggle={toggleDrawer} />

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[220px] bg-white flex flex-col transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeDrawer}
                  className={`
                    flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-[#1A1A18] text-white'
                      : 'text-[#6B6B65] hover:bg-[#F5F5F2] hover:text-[#1A1A18]'
                    }
                  `}
                >
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                  {item.label}
                </Link>
              </div>
            )
          })}
        </div>

        {/* Footer: User Info */}
        <div className="border-t border-[#EBEBE7] p-3">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-[#F5F5F2] flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-[#1A1A18]">
                {(profile.picName || profile.username || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1A18] truncate">
                {profile.picName || profile.username}
              </p>
              <p className="text-[11px] text-[#A0A09A] capitalize">{profile.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-[#A0A09A] hover:text-[#1A1A18] transition-colors w-full px-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
