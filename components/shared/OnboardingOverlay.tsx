'use client'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'nsms_onboarding_seen'

export default function OnboardingOverlay() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen) setShow(true)

    const handler = () => { setShow(true) }
    window.addEventListener('nsms-show-onboarding', handler)
    return () => window.removeEventListener('nsms-show-onboarding', handler)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShow(false)
  }

  useEffect(() => {
    const handler = () => dismiss()
    window.addEventListener('onboarding-complete', handler)
    return () => window.removeEventListener('onboarding-complete', handler)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-[#6B6B65] hover:text-[#1A1A18] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <iframe
          src="/onboarding/nsms-onboarding.html"
          className="w-full h-full border-0"
          title="Panduan NSMS"
        />
      </div>
    </div>
  )
}
