import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { authClient } from '@/lib/auth-client'
import { Building3D } from '@/components/auth/Building3D'
import { toastError, toastSuccess } from '@/components/toast'

const TEAL = '#2B8C80'

export function ResetPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toastError(t('auth.reset.mismatchTitle'), t('auth.reset.mismatchDesc'))
      return
    }

    setLoading(true)
    try {
      const token = new URLSearchParams(window.location.search).get('token');
      if (!token) {
        toastError(t('auth.reset.errorTitle'), t('auth.reset.errorDesc'))
        return
      }
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token
      })

      if (error) {
        toastError(error.message || t('auth.reset.errorTitle'), t('auth.reset.errorDesc'))
      } else {
        toastSuccess(t('auth.reset.successTitle'), t('auth.reset.successDesc'))
        navigate('/auth/login')
      }
    } catch (err: any) {
      toastError(t('auth.reset.errorTitle'), err.message)
    } finally {
      setLoading(false)
    }
  }

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
      initial={{ opacity: 0, x: -60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* ── LEFT — white form panel ── */}
      <div
        className="flex flex-col justify-between bg-white px-10 py-9"
        style={{ width: '44%', minWidth: 340 }}
      >
        <div>
          <p style={{ fontFamily: 'Amiri, Georgia, serif', fontSize: 72, lineHeight: 1, color: TEAL, direction: 'rtl', marginBottom: 2 }}>
            إقامتي
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#B84A2A', letterSpacing: '0.06em', fontStyle: 'italic', marginBottom: 4 }}>
            IQAMATI
          </p>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 28 }}>
            {t('auth.reset.title')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password" required placeholder={t('auth.reset.passwordPlaceholder')}
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition"
              onFocus={e => (e.currentTarget.style.borderColor = TEAL)}
              onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
            />

            <input
              type="password" required placeholder={t('auth.reset.confirmPlaceholder')}
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition"
              onFocus={e => (e.currentTarget.style.borderColor = TEAL)}
              onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
            />

            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-full text-white font-semibold text-sm tracking-wide transition-opacity disabled:opacity-70 mt-2"
              style={{ background: TEAL }}
            >
              {loading ? t('auth.reset.processing') : t('auth.reset.resetBtn')}
            </button>
          </form>
        </div>

        <div>
          <p className="mt-5 text-center text-xs text-gray-400">
            {t('auth.forgot.remembered')}{' '}
            <Link to="/auth/login" style={{ color: TEAL }} className="font-semibold hover:underline">{t('auth.forgot.loginLink')}</Link>
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
