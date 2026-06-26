import { lazy, Suspense } from 'react'
import type React from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SyndicLayout } from '@/components/layout/SyndicLayout'
import { authClient }   from '@/lib/auth-client'
import { Toaster }      from '@/components/toast'

// ── Eagerly loaded (needed on first paint) ────────────────────────────────────
import { Home }        from '@/pages/Home'
import { Privacy }     from '@/pages/Privacy'
import { DataDeletion} from '@/pages/DataDeletion'
import { AuthLayout }  from '@/pages/auth/AuthLayout'
import { Login }       from '@/pages/auth/Login'
import { Register }    from '@/pages/auth/Register'
import { Setup }       from '@/pages/auth/Setup'
import { Forgot }        from '@/pages/auth/Forgot'
import { ResetPassword } from '@/pages/auth/ResetPassword'

// ── Lazily loaded syndic pages ────────────────────────────────────────────────
const Dashboard     = lazy(() => import('@/pages/syndic/Dashboard').then(m => ({ default: m.Dashboard })))
const ApartmentsDash= lazy(() => import('@/pages/syndic/dashboards/ApartmentsDash').then(m => ({ default: m.ApartmentsDash })))
const PaymentsDash  = lazy(() => import('@/pages/syndic/dashboards/PaymentsDash').then(m => ({ default: m.PaymentsDash })))
const MeetingsDash  = lazy(() => import('@/pages/syndic/dashboards/MeetingsDash').then(m => ({ default: m.MeetingsDash })))
const AccountingDash= lazy(() => import('@/pages/syndic/dashboards/AccountingDash').then(m => ({ default: m.AccountingDash })))
const FeedDash      = lazy(() => import('@/pages/syndic/dashboards/FeedDash').then(m => ({ default: m.FeedDash })))
const ServicesDash  = lazy(() => import('@/pages/syndic/dashboards/ServicesDash').then(m => ({ default: m.ServicesDash })))
const UnionDash     = lazy(() => import('@/pages/syndic/dashboards/UnionDash').then(m => ({ default: m.UnionDash })))
const ChatbotDash   = lazy(() => import('@/pages/syndic/dashboards/ChatbotDash').then(m => ({ default: m.ChatbotDash })))

const Association   = lazy(() => import('@/pages/syndic/Association').then(m => ({ default: m.Association })))
const Payments      = lazy(() => import('@/pages/syndic/Payments').then(m => ({ default: m.Payments })))
const Documents     = lazy(() => import('@/pages/syndic/Documents').then(m => ({ default: m.Documents })))
const Meetings      = lazy(() => import('@/pages/syndic/Meetings').then(m => ({ default: m.Meetings })))
const Accounting    = lazy(() => import('@/pages/syndic/Accounting').then(m => ({ default: m.Accounting })))
const Feed          = lazy(() => import('@/pages/syndic/Feed').then(m => ({ default: m.Feed })))
const Services      = lazy(() => import('@/pages/syndic/Services').then(m => ({ default: m.Services })))
const Alerts        = lazy(() => import('@/pages/syndic/Alerts').then(m => ({ default: m.Alerts })))
const UnionMembers  = lazy(() => import('@/pages/syndic/UnionMembers').then(m => ({ default: m.UnionMembers })))
const Profile       = lazy(() => import('@/pages/syndic/Profile').then(m => ({ default: m.Profile })))
const Residences    = lazy(() => import('@/pages/syndic/Residences').then(m => ({ default: m.Residences })))
const Chat          = lazy(() => import('@/pages/syndic/Chat').then(m => ({ default: m.Chat })))

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-7 h-7 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  )
}

function SuspenseLayout() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  )
}

const Spinner = () => (
  <div className="flex h-screen items-center justify-center bg-[#d8dce3]">
    <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
  </div>
)

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: sessionPending } = authClient.useSession()

  // Only fetch /api/me once we know a session exists
  const { data: me, isPending: mePending } = useQuery({
    queryKey: ['me'],
    queryFn:  () => fetch('/api/me').then(r => r.json()),
    enabled:  !!session,
    retry:    false,
    staleTime: 60_000,
  })

  if (sessionPending || (session && mePending)) return <Spinner />

  if (!session) return <Navigate to="/auth/login" replace />

  const activeOrgId = (session.session as any).activeOrganizationId
  if (!activeOrgId) return <Navigate to="/auth/setup" replace />

  // Role gate — only SYNDIC and STAFF can access the syndic dashboard
  if (me && me.profileRole !== 'SYNDIC' && me.profileRole !== 'STAFF') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#d8dce3]">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-slate-700">Accès refusé</p>
          <p className="text-sm text-slate-500">Votre compte n'a pas les droits d'accès au tableau de bord syndic.</p>
          <p className="text-xs text-slate-400">Rôle actuel : <span className="font-mono font-bold">{me.profileRole}</span></p>
          <button onClick={() => { authClient.signOut(); window.location.href = '/auth/login' }}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">
            Se déconnecter
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacy"       element={<Privacy />} />
        <Route path="/data-deletion" element={<DataDeletion />} />
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login"    element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="setup"    element={<Setup />} />
          <Route path="forgot"   element={<Forgot />} />
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
        <Route path="/syndic" element={<ProtectedRoute><SyndicLayout /></ProtectedRoute>}>
          <Route element={<SuspenseLayout />}>

            {/* ── DASHBOARDS ── */}
            <Route index                  element={<Dashboard />} />
            <Route path="dash/apartments" element={<ApartmentsDash />} />
            <Route path="dash/payments"   element={<PaymentsDash />} />
            <Route path="dash/meetings"   element={<MeetingsDash />} />
            <Route path="dash/accounting" element={<AccountingDash />} />
            <Route path="dash/feed"       element={<FeedDash />} />
            <Route path="dash/services"   element={<ServicesDash />} />
            <Route path="dash/union"      element={<UnionDash />} />
            <Route path="dash/chatbot"    element={<ChatbotDash />} />

            {/* ── GENERAL ── */}
            <Route path="profile"         element={<Profile />} />
            <Route path="settings"        element={<Profile />} />

            {/* ── MANAGEMENT ── */}
            <Route path="association"     element={<Association />} />
            <Route path="payments"        element={<Payments />} />
            <Route path="documents"       element={<Documents />} />
            <Route path="meetings"        element={<Meetings />} />
            <Route path="accounting"      element={<Accounting />} />

            {/* ── COMMUNITY ── */}
            <Route path="feed"            element={<Feed />} />
            <Route path="services"        element={<Services />} />
            <Route path="alerts"          element={<Alerts />} />

            {/* ── UNION ── */}
            <Route path="union-members"   element={<UnionMembers />} />

            {/* ── SETTINGS ── */}
            <Route path="residences"      element={<Residences />} />
            <Route path="chat"            element={<Chat />} />

          </Route>
        </Route>
      </Routes>
    </>
  )
}
