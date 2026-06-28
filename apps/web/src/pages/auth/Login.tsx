import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { authClient } from '@/lib/auth-client'
import { Eye, EyeOff, UserCircle2, ChevronDown, X, Check } from 'lucide-react'
import { Building3D } from '@/components/auth/Building3D'
import { toastError, toastSuccess } from '@/components/toast'
import { useTranslation } from 'react-i18next'
import { LangSwitcher } from '@/components/ui/LangSwitcher'

async function socialSignIn(provider: 'google' | 'facebook') {
  await authClient.signIn.social({ provider, callbackURL: `${window.location.origin}/syndic` })
}

const TEAL = '#2B8C80'
const STORAGE_KEY = 'iqamati_saved_accounts'

type SavedAccount = { email: string; password: string; name?: string; savedAt: number }

function getSavedAccounts(): SavedAccount[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function saveAccount(email: string, password: string, name?: string) {
  const accounts = getSavedAccounts().filter(a => a.email !== email)
  accounts.unshift({ email, password, name, savedAt: Date.now() })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts.slice(0, 5)))
}
function removeAccount(email: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getSavedAccounts().filter(a => a.email !== email)))
}

export function Login() {
  const { t } = useTranslation()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [savedAccounts, setSavedAccounts]   = useState<SavedAccount[]>([])
  const [showSavePrompt, setShowSavePrompt] = useState<{ email: string; password: string; name?: string } | null>(null)
  const [showAccountPicker, setShowAccountPicker] = useState(false)

  useEffect(() => { setSavedAccounts(getSavedAccounts()) }, [])

  const pickAccount = (acc: SavedAccount) => {
    setEmail(acc.email)
    setPassword(acc.password)
    setShowAccountPicker(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error, data } = await authClient.signIn.email({ email, password, callbackURL: '/syndic' }) as any
      if (error) {
        toastError(error.message || t('login.loginFailed'), t('login.checkCredentials'))
      } else {
        const userName = data?.user?.name
        const alreadySaved = getSavedAccounts().some(a => a.email === email && a.password === password)
        if (alreadySaved) {
          toastSuccess(t('login.welcome'), t('login.loginSuccess'))
          window.location.href = '/syndic'
        } else {
          setShowSavePrompt({ email, password, name: userName })
        }
      }
    } catch (err: any) {
      toastError('خطأ غير متوقع', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="w-full flex overflow-hidden"
      style={{
        maxWidth: 1060,
        minHeight: 560,
        borderRadius: 28,
        boxShadow: '0 24px 80px rgba(0,0,0,0.40)',
        border: '3px solid rgb(255,255,255)',
      }}
      initial={{ opacity: 0, x: -60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >

      {/* ── LEFT — white form panel ── */}
      <div
        className="relative flex flex-col justify-center gap-5 bg-white px-12 py-9"
        style={{ width: '50%', minWidth: 380 }}
      >
        <div className="absolute top-4 right-4">
          <LangSwitcher variant="dark" />
        </div>
        <div>
          <p style={{ fontFamily: 'Amiri, Georgia, serif', fontSize: 52, lineHeight: 1, color: TEAL, direction: 'rtl', marginBottom: 1 }}>
            إقامتي
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: '#B84A2A', letterSpacing: '0.06em', fontStyle: 'italic', marginBottom: 2 }}>
            IQAMATI
          </p>
          <p style={{ fontSize: 11, color: '#9CA3AF' }}>
            {t('login.subtitle')}
          </p>
        </div>

        {/* Saved accounts picker */}
        {savedAccounts.length > 0 && (
          <div className="relative">
            <button type="button" onClick={() => setShowAccountPicker(v => !v)}
              className="w-full flex items-center gap-3 h-11 px-4 rounded-xl border border-gray-200 text-sm text-gray-700 hover:border-gray-300 transition-colors bg-gray-50/60">
              <UserCircle2 size={16} className="text-gray-400 shrink-0" />
              <span className="flex-1 text-left text-gray-500 text-xs">
                {savedAccounts.length === 1
                  ? t('login.continueAs', { name: savedAccounts[0].name ?? savedAccounts[0].email })
                  : t('login.savedCount', { count: savedAccounts.length })}
              </span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${showAccountPicker ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showAccountPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 pt-3 pb-1">{t('login.savedAccounts')}</p>
                  {savedAccounts.map(acc => (
                    <div key={acc.email} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 group cursor-pointer" onClick={() => pickAccount(acc)}>
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: TEAL }}>
                        {(acc.name ?? acc.email).slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        {acc.name && <p className="text-xs font-semibold text-gray-800 truncate">{acc.name}</p>}
                        <p className="text-[11px] text-gray-500 truncate">{acc.email}</p>
                      </div>
                      <button type="button" onClick={ev => { ev.stopPropagation(); removeAccount(acc.email); setSavedAccounts(getSavedAccounts()) }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email" required autoComplete="email" placeholder={t('login.email')}
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition"
              onFocus={e => (e.currentTarget.style.borderColor = TEAL)}
              onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
            />

            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} required autoComplete="current-password" placeholder={t('login.password')}
                value={password} onChange={e => setPassword(e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-200 px-4 pr-20 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition"
                onFocus={e => (e.currentTarget.style.borderColor = TEAL)}
                onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Link to="/auth/forgot" tabIndex={-1} className="text-xs font-semibold" style={{ color: TEAL }}>{t('login.forgot')}</Link>
                <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-full text-white font-semibold text-sm tracking-wide transition-opacity disabled:opacity-70"
              style={{ background: TEAL }}
            >
              {loading ? t('login.loading') : t('login.submit')}
            </button>
        </form>

        {/* Google-style save account prompt */}
        <AnimatePresence>
          {showSavePrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-start gap-3 p-4">
                <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-base"
                  style={{ background: TEAL }}>
                  {(showSavePrompt.name ?? showSavePrompt.email).slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{t('login.savePrompt')}</p>
                  {showSavePrompt.name && <p className="text-xs text-gray-700 font-medium">{showSavePrompt.name}</p>}
                  <p className="text-xs text-gray-500 truncate">{showSavePrompt.email}</p>
                </div>
                <button onClick={() => { setShowSavePrompt(null); window.location.href = '/syndic' }}
                  className="p-1 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0">
                  <X size={14} />
                </button>
              </div>
              <div className="flex border-t border-gray-100">
                <button onClick={() => { setShowSavePrompt(null); window.location.href = '/syndic' }}
                  className="flex-1 py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
                  {t('login.notNow')}
                </button>
                <div className="w-px bg-gray-100" />
                <button onClick={() => {
                  saveAccount(showSavePrompt.email, showSavePrompt.password, showSavePrompt.name)
                  setSavedAccounts(getSavedAccounts())
                  setShowSavePrompt(null)
                  toastSuccess(t('login.savedConfirm'), t('login.savedDetail', { email: showSavePrompt.email }))
                  window.location.href = '/syndic'
                }}
                  className="flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
                  style={{ color: TEAL }}>
                  <Check size={13} />{t('login.save')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 whitespace-nowrap">{t('login.orWith')}</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="flex justify-center gap-3 mt-4">
            <SocialBtn onClick={() => socialSignIn('google')}><GoogleIcon /></SocialBtn>
            <SocialBtn onClick={() => socialSignIn('facebook')}><FacebookIcon /></SocialBtn>
          </div>
          <p className="mt-4 text-center text-xs text-gray-400">
            {t('login.noAccount')}{' '}
            <Link to="/auth/register" style={{ color: TEAL }} className="font-semibold hover:underline">{t('login.createAccount')}</Link>
          </p>
        </div>
      </div>

      {/* ── RIGHT — transparent panel with 3D building ── */}
      <div className="relative flex-1">
        <div className="absolute inset-0 bg-black/20" />
        <Building3D />
      </div>

    </motion.div>
  )
}

function SocialBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
      {children}
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

