import React from 'react'
import { useLocation, useOutlet, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

const TEAL = '#2B8C80'
const NAV_LINKS = [
  { label: 'Home',     to: '/'            },
  { label: 'About',    to: '/?s=about'    },
  { label: 'Services', to: '/?s=services' },
]

export function AuthLayout() {
  const location = useLocation()
  const outlet   = useOutlet()

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: 'hsl(222, 47%, 11%)' }}
    >
      {/* Video — persistent across login/register, never restarts on navigation */}
      <video autoPlay muted loop playsInline
        className="absolute inset-0 h-full w-full object-cover">
        <source src="/login-bg.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/40" />

      {/* ── Top nav bar — outside the card ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-10 pt-7"
      >
        {/* Logo */}
        <Link to="/" className="flex items-baseline gap-2 select-none">
          <span style={{ fontFamily: 'Amiri, Georgia, serif', fontSize: 28, color: TEAL, lineHeight: 1 }}>
            إقامتي
          </span>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color: '#B84A2A', letterSpacing: '0.07em', fontStyle: 'italic' }}>
            IQAMATI
          </span>
        </Link>

        {/* Nav links + CTA */}
        <div className="flex items-center gap-8">
          {NAV_LINKS.map(({ label, to }) => (
            <Link key={label} to={to}
              className="text-sm font-medium transition-colors"
              style={{ color: 'rgba(255,255,255,0.60)', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,1)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.60)')}>
              {label}
            </Link>
          ))}
          <div className="w-px h-4 bg-white/20" />
          <Link to="/auth/login"
            className="text-sm font-medium transition-colors"
            style={{ color: 'rgba(255,255,255,0.60)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.60)')}>
            Se connecter
          </Link>
          <Link to="/auth/register"
            className="px-5 py-2 rounded-full text-white text-sm font-semibold transition-opacity hover:opacity-85"
            style={{ background: TEAL }}>
            Commencer
          </Link>
        </div>
      </motion.div>

      {/* Cards animate in/out here, video stays */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 pt-24">
        <AnimatePresence mode="wait" initial={false}>
          {outlet && React.cloneElement(outlet, { key: location.pathname })}
        </AnimatePresence>
      </div>
    </div>
  )
}
