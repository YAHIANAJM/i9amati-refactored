import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Menu } from 'lucide-react'

const TEAL = '#2B8C80'
const ta = (a: number) => `rgba(43,140,128,${a})`

const NAV_LINKS = ['Home', 'Syndic', 'Finance', 'Meetings']

const SLIDES = [
  {
    num: '01',
    heading: 'Collectez les charges.',
    sub: 'Suivez chaque paiement, relancez automatiquement, exportez les états mensuels.',
  },
  {
    num: '02',
    heading: 'Gérez votre résidence.',
    sub: 'La plateforme de copropriété conçue pour le marché marocain. Tout centralisé.',
  },
  {
    num: '03',
    heading: 'Organisez vos réunions.',
    sub: 'Convocations, votes, PV — en pleine conformité avec la loi 18-00.',
  },
]

const AVATARS = [
  { seed: 'syndic-pro',   label: 'Syndic',       lg: false },
  { seed: 'owner-female', label: 'Propriétaire',  lg: true  },
  { seed: 'staff-guard',  label: 'Sécurité',      lg: false },
  { seed: 'tenant-man',   label: 'Locataire',     lg: false },
]

// ── Animated SVG teal curves ──────────────────────────────────────────────
function TealLines() {
  const paths = [
    { d: 'M -80 580 C 220 430 460 540 680 470 S 1020 340 1320 420 S 1560 380 1680 340', w: 1.4, o: 0.45, delay: 0.2 },
    { d: 'M -80 640 C 200 500 480 600 720 520 S 1060 395 1350 475 S 1590 430 1720 390', w: 0.9, o: 0.30, delay: 0.5 },
    { d: 'M 0 700 C 260 565 500 645 760 565 S 1100 445 1380 510 S 1620 470 1760 428',   w: 0.65, o: 0.22, delay: 0.8 },
    { d: 'M 80 820 C 180 660 360 600 500 710',  w: 1.2, o: 0.38, delay: 0.4 },
    { d: 'M 50 855 C 170 700 370 640 530 750',  w: 0.8, o: 0.28, delay: 0.65 },
  ]
  return (
    <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%"
         viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      {paths.map((p, i) => (
        <motion.path key={i} d={p.d} stroke={TEAL} strokeWidth={p.w} fill="none" opacity={p.o}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.4, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
      <motion.ellipse cx="1280" cy="450" rx="95" ry="70"
        stroke={TEAL} strokeWidth="1" fill="none" opacity="0.28"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 2, delay: 1, ease: 'easeInOut' }} />
      <motion.ellipse cx="1280" cy="450" rx="140" ry="105"
        stroke={TEAL} strokeWidth="0.7" fill="none" opacity="0.18"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 2.4, delay: 1.2, ease: 'easeInOut' }} />
    </svg>
  )
}

// ── Radar sonar rings ─────────────────────────────────────────────────────
function RadarRings({ size }: { size: number }) {
  return (
    <>
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: size + 16, height: size + 16,
            border: `1.5px solid ${TEAL}`,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{ scale: [1, 2.2], opacity: [0.55, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.87, ease: 'easeOut' }}
        />
      ))}
    </>
  )
}

// ── Home ──────────────────────────────────────────────────────────────────
export function Home() {
  const [activeIdx, setActiveIdx] = useState(1)

  // Mouse parallax
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const parallaxX = useTransform(mouseX, [-1, 1], ['-1.8%', '1.8%'])
  const parallaxY = useTransform(mouseY, [-1, 1], ['-1.8%', '1.8%'])

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e
    const { width, height } = currentTarget.getBoundingClientRect()
    mouseX.set((clientX / width - 0.5) * 2)
    mouseY.set((clientY / height - 0.5) * 2)
  }

  // Auto-cycle slides
  useEffect(() => {
    const id = setInterval(() => setActiveIdx(p => (p + 1) % SLIDES.length), 5000)
    return () => clearInterval(id)
  }, [])

  const slide = SLIDES[activeIdx]

  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: '#c8cdd5' }}
      onMouseMove={handleMouse}
    >
      {/* ── Background: Ken Burns + mouse parallax ── */}
      <motion.div
        className="absolute inset-0"
        style={{ x: parallaxX, y: parallaxY, scale: 1.1 }}
      >
        <motion.img
          src="/home-bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.92) saturate(0.65) contrast(0.95)' }}
          animate={{ scale: [1, 1.05, 1], x: [0, -10, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* Left vignette for text legibility */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(105deg, rgba(10,20,32,0.44) 0%, rgba(10,20,32,0.18) 40%, transparent 65%)',
      }} />

      {/* Animated teal SVG curves */}
      <TealLines />

      {/* ── TOP NAV ── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 pt-7 z-20"
      >
        <button className="text-white/70 hover:text-white transition-colors">
          <Menu size={22} strokeWidth={1.5} />
        </button>
        <nav className="flex items-center gap-8">
          {NAV_LINKS.map((link, i) => (
            <div key={link} className="flex flex-col items-center">
              <span className="text-sm font-medium cursor-pointer transition-colors"
                    style={{ color: i === 0 ? 'white' : 'rgba(255,255,255,0.45)' }}>
                {link}
              </span>
              {i === 0 && (
                <motion.div
                  className="h-px w-full mt-0.5"
                  style={{ background: TEAL }}
                  animate={{ scaleX: [1, 0.6, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </div>
          ))}
        </nav>
      </motion.div>

      {/* ── SLIDE NUMBERS — clickable, left ── */}
      <div className="absolute left-8 flex flex-col gap-2 z-20"
           style={{ top: '50%', transform: 'translateY(-50%)' }}>
        {SLIDES.map((s, i) => (
          <motion.div
            key={s.num}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setActiveIdx(i)}
            whileHover={{ x: 4 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <motion.span
              animate={{
                fontSize: i === activeIdx ? 26 : 12,
                color: i === activeIdx ? '#ffffff' : 'rgba(255,255,255,0.28)',
                fontWeight: i === activeIdx ? 700 : 400,
              }}
              transition={{ duration: 0.3 }}
              style={{ fontFamily: 'monospace', lineHeight: 1 }}
            >
              {s.num}
            </motion.span>
            <AnimatePresence>
              {i === activeIdx && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 20, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="h-px flex-shrink-0"
                  style={{ background: TEAL }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* ── MAIN HEADLINE ── */}
      <div className="absolute z-20" style={{ left: '9%', top: '14%' }}>
        <motion.p
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="font-semibold tracking-[0.35em] uppercase mb-2 text-xs"
          style={{ color: TEAL }}
        >
          PLATEFORME
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.18 }}
          className="text-white font-black leading-none"
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 'clamp(60px, 9.5vw, 136px)',
            letterSpacing: '-0.035em',
            textShadow: '0 2px 32px rgba(0,0,0,0.22)',
          }}
        >
          IQAMATI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="font-bold leading-none mt-1"
          style={{
            fontFamily: 'Amiri, Georgia, serif',
            fontSize: 'clamp(24px, 3.8vw, 52px)',
            color: 'rgba(255,255,255,0.32)',
            direction: 'rtl',
          }}
        >
          إقامتي
        </motion.p>
      </div>

      {/* ── CONTENT BLOCK — transitions with each slide ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
          className="absolute z-20"
          style={{
            left: '36%', top: '50%', transform: 'translateY(-50%)',
            maxWidth: 265,
            borderLeft: '2px solid rgba(255,255,255,0.28)',
            paddingLeft: 18,
          }}
        >
          <h2 className="text-white font-bold leading-snug mb-2" style={{ fontSize: 20 }}>
            {slide.heading}
          </h2>
          <p className="text-xs leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {slide.sub}
          </p>
          <div className="flex gap-2">
            <Link to="/auth/register"
              className="px-4 py-2 rounded-full text-white text-[11px] font-semibold hover:opacity-90 transition-opacity"
              style={{ background: TEAL }}>
              Commencer →
            </Link>
            <Link to="/auth/login"
              className="px-4 py-2 rounded-full text-[11px] font-medium transition-colors"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.22)',
                color: 'rgba(255,255,255,0.75)',
              }}>
              Se connecter
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── AVATAR COLUMN — right ── */}
      <motion.div
        initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, delay: 0.38 }}
        className="absolute right-12 flex flex-col items-center z-20"
        style={{ top: '50%', transform: 'translateY(-50%)', gap: 20 }}
      >
        {AVATARS.map(av => {
          const size = av.lg ? 88 : 46
          return (
            <div key={av.seed} className="relative flex flex-col items-center">

              {/* Sonar ping rings on featured avatar */}
              {av.lg && <RadarRings size={size} />}

              {/* Static position rings */}
              {av.lg && [120, 100].map((r, ri) => (
                <div key={ri} className="absolute rounded-full"
                     style={{
                       width: r, height: r,
                       border: `1px solid ${ta(0.28 - ri * 0.08)}`,
                       top: '50%', left: '50%',
                       transform: 'translate(-50%,-50%)',
                     }} />
              ))}

              {/* Animated connector line to content block */}
              {av.lg && (
                <motion.div
                  initial={{ width: 0 }} animate={{ width: 52 }}
                  transition={{ duration: 0.8, delay: 0.9 }}
                  className="absolute"
                  style={{
                    right: size / 2 + 12, top: '50%',
                    height: 1,
                    background: `linear-gradient(to left, ${TEAL}, transparent)`,
                    transform: 'translateY(-50%)',
                  }}
                />
              )}

              {/* Avatar — featured bobs up/down */}
              <motion.img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${av.seed}&backgroundColor=${av.lg ? '1a5c54' : '1a3040'}`}
                alt={av.label}
                className="relative z-10 rounded-full object-cover"
                style={{
                  width: size, height: size,
                  border: av.lg ? `2px solid ${TEAL}` : '1.5px solid rgba(255,255,255,0.22)',
                  background: av.lg ? '#1a5c54' : 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(6px)',
                }}
                animate={av.lg ? { y: [0, -10, 0] } : {}}
                transition={av.lg ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : {}}
              />

              {av.lg && (
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-white text-[11px] font-medium mt-1.5"
                >
                  {av.label}
                </motion.p>
              )}
            </div>
          )
        })}
      </motion.div>

      {/* ── BOTTOM: progress bar + social ── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
        className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-3 z-20"
      >
        {/* Slide progress bar */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full cursor-pointer"
              onClick={() => setActiveIdx(i)}
              animate={{
                width: i === activeIdx ? 24 : 6,
                background: i === activeIdx ? TEAL : 'rgba(255,255,255,0.25)',
              }}
              transition={{ duration: 0.35 }}
              style={{ height: 6 }}
            />
          ))}
        </div>
        {/* Social */}
        <div className="flex items-center gap-7">
          {['IG', 'FB', 'TW'].map(s => (
            <a key={s} href="#"
               className="text-white/28 hover:text-white/65 transition-colors text-[10px] font-semibold tracking-widest uppercase">
              {s}
            </a>
          ))}
        </div>
      </motion.div>

    </div>
  )
}
