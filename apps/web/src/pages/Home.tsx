import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import {
  Menu, X, CreditCard, Calendar, Users,
  FileText, Bell, Building2, CheckCircle2,
} from 'lucide-react'
import { ChatBot } from '@/components/chatbot/ChatBot'
import { useTranslation } from 'react-i18next'
import { LangSwitcher } from '@/components/ui/LangSwitcher'

const TEAL = '#2B8C80'
const ta = (a: number) => `rgba(43,140,128,${a})`

type Section = 'home' | 'about' | 'services'

// ── Data ──────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    num: '01', Icon: CreditCard, feature: 'Charges & Paiements',
    heading: 'Collectez les charges.',
    sub: 'Suivez chaque paiement, relancez automatiquement, exportez les états mensuels en un clic.',
  },
  {
    num: '02', Icon: Users, feature: 'Gestion complète',
    heading: 'Gérez votre résidence.',
    sub: 'La plateforme de copropriété conçue pour le marché marocain. Tout centralisé, rien de manqué.',
  },
  {
    num: '03', Icon: Calendar, feature: 'Réunions & Votes',
    heading: 'Organisez vos réunions.',
    sub: 'Convocations, votes, PV — en pleine conformité avec la loi 18-00. 100% digital.',
  },
]

const ABOUT_ITEMS = [
  'Fondé en 2024 · Casablanca, Maroc',
  'Support bilingue Français / العربية',
  'Conforme à la loi 18-00 sur la copropriété',
  'Données hébergées au Maroc · 100% sécurisées',
]

const SERVICES_DATA = [
  { Icon: CreditCard, title: 'Charges',         sub: 'Collecte, suivi et relance automatique des paiements mensuels' },
  { Icon: Calendar,   title: 'Réunions AG',      sub: 'Planification, votes et génération de PV numérique' },
  { Icon: FileText,   title: 'Documents',        sub: 'Archivage numérique et signature électronique' },
  { Icon: Bell,       title: 'Alertes',          sub: 'Notifications automatiques aux copropriétaires' },
  { Icon: Users,      title: 'Conseil syndical', sub: 'Gestion des membres, mandats et élections' },
  { Icon: Building2,  title: 'Résidences',       sub: 'Multi-résidences, bâtiments et appartements' },
]

const STATS = [
  { value: '500+', label: 'Syndics actifs' },
  { value: '12K',  label: 'Appartements' },
  { value: '3',    label: 'Grandes villes' },
]

const AVATARS = [
  { seed: 'syndic-pro',   lg: false },
  { seed: 'owner-female', lg: true  },
  { seed: 'staff-guard',  lg: false },
  { seed: 'tenant-man',   lg: false },
]

// ── Shared decorations ────────────────────────────────────────────────────
function TealLines() {
  const paths = [
    { d: 'M -80 580 C 220 430 460 540 680 470 S 1020 340 1320 420 S 1560 380 1680 340', w: 1.4, o: 0.38, delay: 0.2 },
    { d: 'M -80 640 C 200 500 480 600 720 520 S 1060 395 1350 475 S 1590 430 1720 390', w: 0.9, o: 0.26, delay: 0.5 },
    { d: 'M 0 700 C 260 565 500 645 760 565 S 1100 445 1380 510 S 1620 470 1760 428',   w: 0.6, o: 0.18, delay: 0.8 },
    { d: 'M 80 820 C 180 660 360 600 500 710', w: 1.2, o: 0.30, delay: 0.4 },
    { d: 'M 50 855 C 170 700 370 640 530 750', w: 0.8, o: 0.20, delay: 0.65 },
  ]
  return (
    <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%"
         viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      {paths.map((p, i) => (
        <motion.path key={i} d={p.d} stroke={TEAL} strokeWidth={p.w} fill="none" opacity={p.o}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 2.4, delay: p.delay, ease: 'easeInOut' }} />
      ))}
      <motion.ellipse cx="1280" cy="450" rx="95" ry="70"
        stroke={TEAL} strokeWidth="1" fill="none" opacity="0.2"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 2, delay: 1 }} />
      <motion.ellipse cx="1280" cy="450" rx="140" ry="105"
        stroke={TEAL} strokeWidth="0.7" fill="none" opacity="0.12"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 2.4, delay: 1.2 }} />
    </svg>
  )
}

function RadarRings({ size }: { size: number }) {
  return (
    <>
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
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

// ── Section panels ────────────────────────────────────────────────────────
function SlidePanel({ activeIdx, setActiveIdx }: { activeIdx: number; setActiveIdx: (i: number) => void }) {
  const { t } = useTranslation()
  const slide = SLIDES[activeIdx]
  const SlideIcon = slide.Icon
  return (
    <AnimatePresence mode="wait">
      <motion.div key={activeIdx}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
               style={{ background: ta(0.2), border: `1px solid ${ta(0.38)}` }}>
            <SlideIcon size={17} style={{ color: TEAL }} strokeWidth={2} />
          </div>
          <span className="text-white font-bold" style={{ fontSize: 15 }}>{slide.num}</span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>/ 03</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>

        <h2 className="text-white font-extrabold leading-tight mb-3"
            style={{ fontSize: 32, letterSpacing: '-0.02em', textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
          {slide.heading}
        </h2>
        <p className="leading-relaxed mb-8"
           style={{ fontSize: 15, color: 'rgba(255,255,255,0.88)', textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>
          {slide.sub}
        </p>

        <div className="flex gap-3 mb-7">
          <Link to="/auth/register"
            className="flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold hover:opacity-85 transition-opacity"
            style={{ background: TEAL, fontSize: 15 }}>
            {t('home.getStarted')} →
          </Link>
          <Link to="/auth/login"
            className="flex items-center gap-2 px-7 py-3.5 rounded-full font-medium hover:bg-white/15 transition-all"
            style={{
              fontSize: 15,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: 'rgba(255,255,255,0.92)',
            }}>
            {t('login.submit')}
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          {SLIDES.map((_, i) => (
            <motion.div key={i} className="rounded-full cursor-pointer"
              onClick={() => setActiveIdx(i)}
              animate={{
                width: i === activeIdx ? 26 : 7,
                background: i === activeIdx ? TEAL : 'rgba(255,255,255,0.22)',
              }}
              transition={{ duration: 0.3 }}
              style={{ height: 7 }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function AboutPanel() {
  const { t } = useTranslation()
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
    >
      <p className="font-semibold tracking-[0.3em] uppercase mb-3"
         style={{ fontSize: 11, color: TEAL }}>
        À PROPOS
      </p>
      <h2 className="text-white font-extrabold leading-tight mb-4"
          style={{ fontSize: 32, letterSpacing: '-0.02em', textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
        Notre mission
      </h2>
      <p className="leading-relaxed mb-8"
         style={{ fontSize: 15, color: 'rgba(255,255,255,0.88)', textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>
        Transformer la gestion des copropriétés marocaines grâce à une plateforme
        numérique moderne, accessible, et conforme au cadre légal en vigueur.
      </p>

      <div className="flex flex-col gap-4 mb-8">
        {ABOUT_ITEMS.map((item, i) => (
          <motion.div key={item}
            initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.32, delay: 0.08 + i * 0.07 }}
            className="flex items-start gap-3"
          >
            <CheckCircle2 size={16} style={{ color: TEAL, flexShrink: 0, marginTop: 2 }} strokeWidth={2} />
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.90)' }}>{item}</span>
          </motion.div>
        ))}
      </div>

      <Link to="/auth/register"
        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold hover:opacity-85 transition-opacity"
        style={{ background: TEAL, fontSize: 15 }}>
        {t('home.getStarted')} →
      </Link>
    </motion.div>
  )
}

function ServicesPanel() {
  const { t } = useTranslation()
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
    >
      <p className="font-semibold tracking-[0.3em] uppercase mb-3"
         style={{ fontSize: 11, color: TEAL }}>
        NOS SERVICES
      </p>
      <h2 className="text-white font-extrabold leading-tight mb-6"
          style={{ fontSize: 30, letterSpacing: '-0.02em', textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
        Tout ce dont vous avez besoin.
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-7">
        {SERVICES_DATA.map((svc, i) => {
          const SvcIcon = svc.Icon
          return (
            <motion.div key={svc.title}
              initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.28, delay: 0.07 + i * 0.05 }}
              className="flex flex-col gap-2 cursor-pointer"
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.10)',
                backdropFilter: 'blur(8px)',
              }}
              whileHover={{
                background: ta(0.15),
                borderColor: ta(0.4),
                transition: { duration: 0.15 },
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
                     style={{ background: ta(0.2) }}>
                  <SvcIcon size={14} style={{ color: TEAL }} strokeWidth={2} />
                </div>
                <span className="text-white font-semibold" style={{ fontSize: 13 }}>{svc.title}</span>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>
                {svc.sub}
              </p>
            </motion.div>
          )
        })}
      </div>

      <Link to="/auth/register"
        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold hover:opacity-85 transition-opacity"
        style={{ background: TEAL, fontSize: 15 }}>
        {t('home.getStarted')} →
      </Link>
    </motion.div>
  )
}

// ── Home ──────────────────────────────────────────────────────────────────
export function Home() {
  const { t } = useTranslation()
  const [section, setSection]     = useState<Section>('home')
  const [activeIdx, setActiveIdx] = useState(1)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [searchParams]            = useSearchParams()

  useEffect(() => {
    const s = searchParams.get('s')
    if (s === 'about' || s === 'services') setSection(s)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const mouseX    = useMotionValue(0)
  const mouseY    = useMotionValue(0)
  const parallaxX = useTransform(mouseX, [-1, 1], ['-1.8%', '1.8%'])
  const parallaxY = useTransform(mouseY, [-1, 1], ['-1.8%', '1.8%'])

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e
    const { width, height } = currentTarget.getBoundingClientRect()
    mouseX.set((clientX / width - 0.5) * 2)
    mouseY.set((clientY / height - 0.5) * 2)
  }

  useEffect(() => {
    if (section !== 'home') return
    const id = setInterval(() => setActiveIdx(p => (p + 1) % SLIDES.length), 5000)
    return () => clearInterval(id)
  }, [section])

  const navItems: { label: string; sec: Section }[] = [
    { label: t('nav.home'),     sec: 'home'     },
    { label: t('nav.about'),    sec: 'about'    },
    { label: t('nav.services'), sec: 'services' },
  ]

  return (
    <div className="relative w-screen h-screen overflow-hidden"
         style={{ background: '#0e1822' }}
         onMouseMove={handleMouse}>

      {/* ── Background ── */}
      <motion.div className="absolute inset-0" style={{ x: parallaxX, y: parallaxY, scale: 1.1 }}>
        <motion.img src="/home-bg.png" alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.58) saturate(0.48) contrast(0.88)' }}
          animate={{ scale: [1, 1.05, 1], x: [0, -10, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
      {/* Left-to-center overlay — covers title + content column */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(108deg, rgba(6,14,24,0.95) 0%, rgba(6,14,24,0.80) 28%, rgba(6,14,24,0.55) 52%, rgba(6,14,24,0.18) 72%, transparent 85%)',
      }} />
      {/* Bottom vignette */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to top, rgba(6,14,24,0.65) 0%, transparent 28%)',
      }} />

      <TealLines />

      {/* ── NAV ── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 pt-7 z-30"
      >
        <button
          onClick={() => setMenuOpen(true)}
          className="text-white/55 hover:text-white transition-colors"
        >
          <Menu size={22} strokeWidth={1.5} />
        </button>
        <nav className="flex items-center gap-8">
          {navItems.map(({ label, sec }) => {
            const active = section === sec
            return (
              <div key={label} className="flex flex-col items-center cursor-pointer"
                   onClick={() => setSection(sec)}>
                <span className="text-sm font-medium transition-colors select-none"
                      style={{ color: active ? 'white' : 'rgba(255,255,255,0.42)' }}>
                  {label}
                </span>
                <motion.div
                  className="h-px mt-0.5"
                  animate={{ scaleX: active ? 1 : 0, opacity: active ? 1 : 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ background: TEAL, width: '100%', transformOrigin: 'left' }}
                />
              </div>
            )
          })}
          <LangSwitcher variant="light" />
          <Link to="/auth/register"
            className="px-5 py-2.5 rounded-full text-white text-sm font-semibold hover:opacity-85 transition-opacity"
            style={{ background: TEAL }}>
            {t('home.getStarted')}
          </Link>
        </nav>
      </motion.div>

      {/* ── SLIDE NUMBERS (home only) — absolute far-left ── */}
      <AnimatePresence>
        {section === 'home' && (
          <motion.div
            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.28 }}
            className="absolute left-6 z-30 flex flex-col"
            style={{ top: '50%', transform: 'translateY(-50%)', gap: 16 }}
          >
            {SLIDES.map((s, i) => {
              const active = i === activeIdx
              return (
                <motion.div key={s.num}
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setActiveIdx(i)}
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <motion.span
                    animate={{ fontSize: active ? 22 : 11, color: active ? '#fff' : 'rgba(255,255,255,0.25)', fontWeight: active ? 700 : 400 }}
                    transition={{ duration: 0.28 }}
                    style={{ fontFamily: 'monospace', lineHeight: 1, minWidth: 26 }}
                  >
                    {s.num}
                  </motion.span>
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                        className="flex items-center gap-1.5 overflow-hidden"
                      >
                        <div className="w-4 h-px flex-shrink-0" style={{ background: TEAL }} />
                        <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: ta(0.85) }}>
                          {s.feature}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── THREE-COLUMN BODY ── */}
      <div className="absolute z-20 flex items-center"
           style={{ inset: 0, top: 76, bottom: 64, paddingLeft: 56, paddingRight: 0 }}>

        {/* COL A — Title + stats (fixed width) */}
        <div className="flex-shrink-0 flex flex-col justify-center"
             style={{ width: '30%', paddingLeft: '5%' }}>
          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-semibold tracking-[0.35em] uppercase mb-2"
            style={{ fontSize: 10, color: TEAL }}
          >
            PLATEFORME
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.17 }}
            className="text-white font-black leading-none"
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 'clamp(52px, 7.5vw, 115px)',
              letterSpacing: '-0.038em',
              textShadow: '0 2px 40px rgba(0,0,0,0.55)',
            }}
          >
            IQAMATI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="font-bold leading-none mt-1"
            style={{
              fontFamily: 'Amiri, Georgia, serif',
              fontSize: 'clamp(20px, 3vw, 44px)',
              color: 'rgba(255,255,255,0.45)',
              direction: 'rtl',
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}
          >
            إقامتي
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-5 mt-7"
          >
            {STATS.map((s, i) => (
              <React.Fragment key={s.label}>
                <div>
                  <p className="text-white font-bold leading-none"
                     style={{ fontSize: 17, textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
                    {s.value}
                  </p>
                  <p className="mt-0.5" style={{ fontSize: 10, color: 'rgba(255,255,255,0.62)' }}>
                    {s.label}
                  </p>
                </div>
                {i < STATS.length - 1 && (
                  <div className="w-px h-7" style={{ background: 'rgba(255,255,255,0.1)' }} />
                )}
              </React.Fragment>
            ))}
          </motion.div>
        </div>

        {/* COL B — Main content panel (fills remaining space) */}
        <div className="flex-1 flex items-center justify-center px-10">
          <motion.div
            layout
            className="w-full"
            style={{ maxWidth: section === 'services' ? 520 : 440 }}
          >
            <AnimatePresence mode="wait">
              {section === 'home' && (
                <SlidePanel key="home" activeIdx={activeIdx} setActiveIdx={setActiveIdx} />
              )}
              {section === 'about'    && <AboutPanel    key="about"    />}
              {section === 'services' && <ServicesPanel key="services" />}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* COL C — Avatar column (fixed width) */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center pr-10"
             style={{ width: 140, gap: 20 }}>
          {AVATARS.map(av => {
            const size = av.lg ? 88 : 46
            return (
              <div key={av.seed} className="relative flex flex-col items-center">
                {av.lg && <RadarRings size={size} />}
                {av.lg && [120, 100].map((r, ri) => (
                  <div key={ri} className="absolute rounded-full"
                       style={{
                         width: r, height: r,
                         border: `1px solid ${ta(0.22 - ri * 0.06)}`,
                         top: '50%', left: '50%',
                         transform: 'translate(-50%,-50%)',
                       }} />
                ))}
                {av.lg && (
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: 48 }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                    className="absolute"
                    style={{
                      right: size / 2 + 10, top: '50%',
                      height: 1,
                      background: `linear-gradient(to left, ${TEAL}, transparent)`,
                      transform: 'translateY(-50%)',
                    }}
                  />
                )}
                <motion.img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${av.seed}&backgroundColor=${av.lg ? '1a5c54' : '1a3040'}`}
                  alt=""
                  className="relative z-10 rounded-full object-cover"
                  style={{
                    width: size, height: size,
                    border: av.lg ? `2px solid ${TEAL}` : '1.5px solid rgba(255,255,255,0.18)',
                    background: av.lg ? '#1a5c54' : 'rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(6px)',
                  }}
                  animate={av.lg ? { y: [0, -10, 0] } : {}}
                  transition={av.lg ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : {}}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* ── FULLSCREEN MENU OVERLAY ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: 'rgba(6,14,24,0.62)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            {/* Subtle teal line decoration — top right */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1440 900">
              <motion.path
                d="M 900 0 C 1000 200 1100 300 1440 350"
                stroke={TEAL} strokeWidth="1" fill="none" opacity="0.18"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
              <motion.path
                d="M 1050 0 C 1150 150 1250 250 1440 280"
                stroke={TEAL} strokeWidth="0.6" fill="none" opacity="0.12"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, delay: 0.1, ease: 'easeInOut' }}
              />
            </svg>

            {/* Top bar */}
            <div className="flex items-center justify-between px-10 pt-8 shrink-0">
              <motion.div
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                     style={{ background: TEAL }}>
                  <Building2 size={14} className="text-white" strokeWidth={2.5} />
                </div>
                <span className="text-white font-bold text-sm tracking-tight">i9amati</span>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                onClick={() => setMenuOpen(false)}
                className="text-white/45 hover:text-white transition-colors"
                whileHover={{ rotate: 90 }}
              >
                <X size={22} strokeWidth={1.5} />
              </motion.button>
            </div>

            {/* Main nav links — editorial large type */}
            <div className="flex-1 flex flex-col justify-center px-10 gap-0">
              {navItems.map(({ label, sec }, i) => {
                const active = section === sec
                const num = String(i + 1).padStart(2, '0')
                return (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -48 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.12 + i * 0.08, ease: [0.4, 0, 0.2, 1] }}
                    className="group flex items-baseline gap-5 cursor-pointer py-2 border-b"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                    onClick={() => { setSection(sec); setMenuOpen(false) }}
                  >
                    <span className="font-mono flex-shrink-0" style={{ fontSize: 12, color: active ? TEAL : 'rgba(255,255,255,0.28)', minWidth: 28 }}>
                      {num}
                    </span>
                    <span
                      className="font-black leading-none transition-colors duration-200"
                      style={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: 'clamp(44px, 7vw, 92px)',
                        letterSpacing: '-0.035em',
                        color: active ? TEAL : 'rgba(255,255,255,0.88)',
                      }}
                    >
                      {label}
                    </span>
                    {active && (
                      <motion.div
                        layoutId="menu-active-dot"
                        className="w-2 h-2 rounded-full mb-2 self-end"
                        style={{ background: TEAL }}
                      />
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Module chips + CTAs — bottom area */}
            <div className="px-10 pb-10 flex items-end justify-between shrink-0">
              {/* Module chips */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.38 }}
                className="flex flex-wrap gap-2 max-w-sm"
              >
                {[
                  { Icon: CreditCard, label: 'Charges' },
                  { Icon: Calendar,   label: 'Réunions' },
                  { Icon: FileText,   label: 'Documents' },
                  { Icon: Bell,       label: 'Alertes' },
                  { Icon: Users,      label: 'Conseil' },
                  { Icon: Building2,  label: 'Résidences' },
                ].map(({ Icon, label }) => (
                  <div key={label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <Icon size={11} style={{ color: ta(0.75) }} strokeWidth={2} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{label}</span>
                  </div>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.44 }}
                className="flex flex-col items-end gap-2"
              >
                <Link to="/auth/register"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold hover:opacity-85 transition-opacity"
                  style={{ background: TEAL, fontSize: 15 }}>
                  {t('home.getStarted')} →
                </Link>
                <Link to="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium transition-colors hover:text-white"
                  style={{ color: 'rgba(255,255,255,0.40)' }}>
                  {t('login.submit')}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CHATBOT — transparent floating button ── */}
      <ChatBot />

      {/* ── BOTTOM social ── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="absolute bottom-4 left-0 right-0 flex justify-center gap-7 z-30"
      >
        {[
          <svg key="ig" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>,
          <svg key="fb" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
          </svg>,
          <svg key="x" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.261 5.64 5.902-5.64Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
          </svg>,
        ].map((icon, i) => (
          <a key={i} href="#" className="transition-opacity hover:opacity-65"
             style={{ color: 'rgba(255,255,255,0.50)' }}>
            {icon}
          </a>
        ))}
      </motion.div>
    </div>
  )
}
