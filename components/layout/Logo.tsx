'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface LogoProps {
  collapsed: boolean
}

export default function Logo({ collapsed }: LogoProps) {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        animate={{ width: collapsed ? 40 : 176 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="h-10 rounded-lg overflow-hidden"
        style={{ background: '#064E3B', flexShrink: 0 }}
      >
        <div className="relative w-full h-full flex items-center px-2">
          <AnimatePresence mode="wait">
            {collapsed ? (
              <motion.div
                key="compact"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 gap-x-[3px] gap-y-0 font-semibold leading-none w-full"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
              >
                <span style={{ fontSize: 11, color: '#D1FAE5', lineHeight: 1.15 }}>N</span>
                <span style={{ fontSize: 11, color: 'rgba(209,250,229,0.35)', lineHeight: 1.15 }}>S</span>
                <span style={{ fontSize: 11, color: 'rgba(209,250,229,0.35)', lineHeight: 1.15 }}>M</span>
                <span style={{ fontSize: 11, color: '#D1FAE5', lineHeight: 1.15 }}>S</span>
              </motion.div>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-3 w-full"
              >
                {/* Icon grid */}
                <div
                  className="grid grid-cols-2 gap-x-[3px] gap-y-0 font-semibold leading-none flex-shrink-0"
                  style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                  <span style={{ fontSize: 11, color: '#D1FAE5', lineHeight: 1.15 }}>N</span>
                  <span style={{ fontSize: 11, color: 'rgba(209,250,229,0.35)', lineHeight: 1.15 }}>S</span>
                  <span style={{ fontSize: 11, color: 'rgba(209,250,229,0.35)', lineHeight: 1.15 }}>M</span>
                  <span style={{ fontSize: 11, color: '#D1FAE5', lineHeight: 1.15 }}>S</span>
                </div>

                {/* Text */}
                <div className="overflow-hidden">
                  <motion.div
                    initial={{ y: 6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.08, duration: 0.35 }}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#D1FAE5',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-dm-sans)',
                    }}
                  >
                    National Sales
                  </motion.div>
                  <motion.div
                    initial={{ y: 6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.14, duration: 0.35 }}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'rgba(209,250,229,0.35)',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-dm-sans)',
                    }}
                  >
                    Management System
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
