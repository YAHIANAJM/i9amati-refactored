import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authClient } from '@/lib/auth-client'
import { Eye, EyeOff } from 'lucide-react'
import { Building3D } from '@/components/auth/Building3D'

async function socialSignIn(provider: 'google' | 'facebook') {
  await authClient.signIn.social({ provider, callbackURL: '/syndic' })
}

const TEAL = '#2B8C80'

export function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
  const [showPw, setShowPw]           = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true)
    setError(null)
    try {
      const { error } = await authClient.signUp.email({
        email: form.email,
        password: form.password,
        name: `${form.firstName} ${form.lastName}`,
      })
      if (error) setError(error.message || "Échec de l'inscription")
      else navigate('/auth/setup', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Une erreur inattendue est survenue')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition'
  const focusTeal  = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = TEAL)
  const blurGray   = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = '#E5E7EB')

  return (
    <motion.div
      className="w-full flex overflow-hidden"
      style={{
        maxWidth: 920,
        minHeight: 540,
        borderRadius: 28,
        boxShadow: '0 24px 80px rgba(0,0,0,0.40)',
        border: '3px solid rgb(255,255,255)',
      }}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >

      {/* ── LEFT — transparent panel with 3D building ── */}
      <div className="relative flex-1">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-6 left-6 z-10 flex items-center gap-6">
          {[
            { label: 'Home',     to: '/'            },
            { label: 'About',    to: '/?s=about'    },
            { label: 'Services', to: '/?s=services' },
          ].map(({ label, to }) => (
            <Link key={label} to={to}
              className="text-white text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
              {label}
            </Link>
          ))}
        </div>
        <Building3D />
      </div>

      {/* ── RIGHT — white form panel ── */}
      <div className="flex flex-col justify-between bg-white px-10 py-9" style={{ width: '44%', minWidth: 340 }}>
        <div>
          <p style={{ fontFamily: 'Amiri, Georgia, serif', fontSize: 72, lineHeight: 1, color: TEAL, direction: 'rtl', marginBottom: 2 }}>
            إقامتي
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#B84A2A', letterSpacing: '0.06em', fontStyle: 'italic', marginBottom: 4 }}>
            IQAMATI
          </p>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 22 }}>
            Créez votre espace syndic
          </p>

          <form onSubmit={handleRegister} className="space-y-3">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">{error}</div>
            )}

            <div className="flex gap-2">
              <input type="text" required placeholder="Prénom" value={form.firstName} onChange={set('firstName')} className={inputClass} onFocus={focusTeal} onBlur={blurGray} />
              <input type="text" required placeholder="Nom" value={form.lastName} onChange={set('lastName')} className={inputClass} onFocus={focusTeal} onBlur={blurGray} />
            </div>

            <input type="email" required autoComplete="email" placeholder="Email or Phone ID" value={form.email} onChange={set('email')} className={inputClass} onFocus={focusTeal} onBlur={blurGray} />

            <div className="relative">
              <input type={showPw ? 'text' : 'password'} required autoComplete="new-password" placeholder="Password" value={form.password} onChange={set('password')} className={`${inputClass} pr-10`} onFocus={focusTeal} onBlur={blurGray} />
              <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} required autoComplete="new-password" placeholder="Confirmer le mot de passe" value={form.confirmPassword} onChange={set('confirmPassword')} className={`${inputClass} pr-10`} onFocus={focusTeal} onBlur={blurGray} />
              <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-full text-white font-semibold text-sm tracking-wide transition-opacity disabled:opacity-70"
              style={{ background: TEAL }}
            >
              {loading ? 'Création...' : 'Créer un compte / إنشاء حساب'}
            </button>
          </form>
        </div>

        <div>
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 whitespace-nowrap">or continue with</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          <div className="flex justify-center gap-3">
            <SocialBtn onClick={() => socialSignIn('google')}><GoogleIcon /></SocialBtn>
            <SocialBtn onClick={() => socialSignIn('facebook')}><FacebookIcon /></SocialBtn>
            <SocialBtn><AppleIcon /></SocialBtn>
          </div>
          <p className="mt-5 text-center text-xs text-gray-400">
            Déjà un compte ?{' '}
            <Link to="/auth/login" style={{ color: TEAL }} className="font-semibold hover:underline">Se connecter</Link>
          </p>
        </div>
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

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="#000">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
    </svg>
  )
}
