'use client'

import { Menu } from 'lucide-react'

interface MobileHeaderProps {
  mobileOpen: boolean
  onToggle: () => void
}

export default function MobileHeader({ mobileOpen, onToggle }: MobileHeaderProps) {
  return (
    <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-[#EBEBE7] z-30 flex items-center px-4">
      <button
        onClick={onToggle}
        className="p-1.5 -ml-1.5 rounded-md text-[#1A1A18] hover:bg-[#F5F5F2] transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex-1 flex justify-center pr-5">
        <span className="text-xl font-bold font-[family-name:var(--font-dm-mono)] tracking-tight text-[#064E3B]">
          NSMS
        </span>
      </div>
    </div>
  )
}
