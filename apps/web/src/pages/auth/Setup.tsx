import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building3D } from '@/components/auth/Building3D'
import { authClient } from '@/lib/auth-client'

const TEAL = '#2B8C80'

export function Setup() {
  const navigate = useNavigate()
  const [syndicName, setSyndicName] = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!syndicName.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/setup', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ syndicName: syndicName.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Échec de la configuration')
      }
      // Force session refresh so activeOrganizationId is picked up
      await authClient.getSession()
      navigate('/syndic', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Une erreur inattendue est survenue')
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* LEFT — white form panel */}
      <div className="flex flex-col justify-between bg-white px-10 py-9" style={{ width: '44%', minWidth: 340 }}>
        <div>
          <p style={{ fontFamily: 'Amiri, Georgia, serif', fontSize: 72, lineHeight: 1, color: TEAL, direction: 'rtl', marginBottom: 2 }}>
            إقامتي
          </p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: '#B84A2A', letterSpacing: '0.06em', fontStyle: 'italic', marginBottom: 4 }}>
            IQAMATI
          </p>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 28 }}>
            Dernière étape — nommez votre syndic
          </p>

          <form onSubmit={handleSetup} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-600">{error}</div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Nom du syndic / اسم الاتحاد
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Ex: Résidence Al Amal, Syndic Maarif…"
                value={syndicName}
                onChange={e => setSyndicName(e.target.value)}
                className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition"
                onFocus={e => (e.currentTarget.style.borderColor = TEAL)}
                onBlur={e => (e.currentTarget.style.borderColor = '#E5E7EB')}
              />
              <p className="mt-1.5 text-[11px] text-gray-400">
                Ce nom identifiera votre espace syndic. Vous pourrez le modifier plus tard.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !syndicName.trim()}
              className="w-full h-12 rounded-full text-white font-semibold text-sm tracking-wide transition-opacity disabled:opacity-50"
              style={{ background: TEAL }}
            >
              {loading ? 'Création de votre espace…' : 'Créer mon syndic →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400">
          Votre espace est privé et sécurisé.
        </p>
      </div>

      {/* RIGHT — 3D building */}
      <div className="relative flex-1">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-8 text-center">
          <p className="text-white text-2xl font-bold drop-shadow-lg mb-2">Bienvenue !</p>
          <p className="text-white/80 text-sm drop-shadow">
            Votre compte est prêt. Configurez votre premier syndic pour commencer à gérer vos résidences.
          </p>
        </div>
        <Building3D />
      </div>
    </motion.div>
  )
}
