import React from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

export function AuthLayout() {
  const location = useLocation()
  const outlet   = useOutlet()

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}
    >
      {/* Video — persistent across login/register, never restarts on navigation */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/login-bg.mp4" type="video/mp4" />
      </video>

      {/* Subtle overlay so the card pops */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Cards animate in/out here, video stays */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <AnimatePresence mode="wait" initial={false}>
          {outlet && React.cloneElement(outlet, { key: location.pathname })}
        </AnimatePresence>
      </div>
    </div>
  )
}
