import { useState, createContext, useContext } from 'react'
import { Outlet } from 'react-router-dom'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ChatBot } from '../chatbot/ChatBot'

interface SidebarCtxType { open: boolean; setOpen: (v: boolean) => void }

export const SidebarCtx = createContext<SidebarCtxType>({ open: false, setOpen: () => {} })
export const useSidebar = () => useContext(SidebarCtx)

export function SyndicLayout() {
  const [open, setOpen] = useState(false)

  const mouseX    = useMotionValue(0)
  const mouseY    = useMotionValue(0)
  const parallaxX = useTransform(mouseX, [-1, 1], ['-2%', '2%'])
  const parallaxY = useTransform(mouseY, [-1, 1], ['-2%', '2%'])

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e
    const { width, height } = currentTarget.getBoundingClientRect()
    mouseX.set((clientX / width  - 0.5) * 2)
    mouseY.set((clientY / height - 0.5) * 2)
  }

  return (
    <SidebarCtx.Provider value={{ open, setOpen }}>
      <div
        className="relative flex flex-col h-screen overflow-hidden pt-0 px-4 pb-4 gap-3"
        onMouseMove={handleMouse}
      >
        {/* ── Parallax background image ── */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ x: parallaxX, y: parallaxY, scale: 1.1 }}
        >
          <img
            src="/home-bg.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.52) saturate(0.5) contrast(0.88)' }}
          />
        </motion.div>

        {/* ── Dark overlay ── */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(135deg, rgba(6,14,24,0.55) 0%, rgba(6,14,24,0.38) 50%, rgba(6,14,24,0.28) 100%)',
          }}
        />

        {/* ── Layout content — floats above background ── */}
        <div className="relative z-10 flex flex-col h-full gap-6 min-h-0">

          {/* Full-width header */}
          <Header />

          {/* Sidebar + content row */}
          <div className="flex flex-1 min-h-0 gap-3">
            <Sidebar open={open} onToggle={() => setOpen(o => !o)} />
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto rounded-xl border-[3px] border-white bg-transparent">
              <Outlet />
            </main>
          </div>
        </div>

        {/* Floating Chatbot Widget */}
        <ChatBot />
      </div>
    </SidebarCtx.Provider>
  )
}
