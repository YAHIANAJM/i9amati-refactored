import { useState, createContext, useContext } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ChatBot } from '../chatbot/ChatBot'

interface SidebarCtxType { open: boolean; setOpen: (v: boolean) => void }

export const SidebarCtx = createContext<SidebarCtxType>({ open: false, setOpen: () => {} })
export const useSidebar = () => useContext(SidebarCtx)

export function SyndicLayout() {
  const [open, setOpen] = useState(false)

  return (
    <SidebarCtx.Provider value={{ open, setOpen }}>
      <div className="flex flex-col h-screen overflow-hidden bg-[#d8dce3] p-4 gap-3">

        {/* Full-width header */}
        <Header />

        {/* Sidebar + content row */}
        <div className="flex flex-1 min-h-0 gap-3">
          <Sidebar open={open} onToggle={() => setOpen(o => !o)} />
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-white rounded-xl shadow-sm border border-border/40">
            <Outlet />
          </main>
        </div>

        {/* Floating Chatbot Widget */}
        <ChatBot />
      </div>
    </SidebarCtx.Provider>
  )
}
