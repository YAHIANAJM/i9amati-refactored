import { useState, useRef, useEffect } from 'react'
import { Globe, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'fr',  label: 'Français',   dir: 'ltr' },
  { code: 'en',  label: 'English',    dir: 'ltr' },
  { code: 'ar',  label: 'العربية',    dir: 'rtl' },
  { code: 'tzm', label: 'ⵜⴰⵎⴰⵣⵉⵖⵜ', dir: 'ltr' },
] as const

interface LangSwitcherProps {
  /** 'dark' for light backgrounds (syndic header), 'light' for dark backgrounds (home page) */
  variant?: 'dark' | 'light'
}

export function LangSwitcher({ variant = 'dark' }: LangSwitcherProps) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const switchLang = (code: string) => {
    i18n.changeLanguage(code)
    document.documentElement.dir = LANGUAGES.find(l => l.code === code)?.dir ?? 'ltr'
    setOpen(false)
  }

  const current = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0]

  const isDark = variant === 'dark'
  const btn = isDark
    ? 'flex items-center gap-1.5 h-8 px-2.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-800 border border-gray-200'
    : 'flex items-center gap-1.5 h-8 px-2.5 rounded-lg hover:bg-white/15 transition-colors text-white/70 hover:text-white border border-white/20'

  const dropdown = isDark
    ? 'absolute right-0 top-full mt-1.5 z-50 w-44 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden'
    : 'absolute right-0 top-full mt-1.5 z-50 w-44 bg-[#0e1822]/95 border border-white/10 rounded-xl shadow-xl overflow-hidden backdrop-blur-sm'

  const header = isDark
    ? 'text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 pt-2.5 pb-1'
    : 'text-[10px] font-bold uppercase tracking-widest text-white/30 px-3 pt-2.5 pb-1'

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)} className={btn}>
        <Globe size={13} />
        <span className="text-xs font-medium">{current.label}</span>
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={dropdown}>
          <p className={header}>Language</p>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => switchLang(lang.code)}
              dir={lang.dir}
              className={[
                'w-full flex items-center justify-between px-3 py-2 text-sm transition-colors',
                isDark
                  ? i18n.language === lang.code
                    ? 'text-teal-700 font-semibold bg-teal-50'
                    : 'text-gray-700 hover:bg-gray-50'
                  : i18n.language === lang.code
                    ? 'text-teal-400 font-semibold bg-white/5'
                    : 'text-white/80 hover:bg-white/5',
              ].join(' ')}
            >
              <span>{lang.label}</span>
              {i18n.language === lang.code && (
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isDark ? 'bg-teal-600' : 'bg-teal-400'}`} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
