import type React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SyndicLayout }   from '@/components/layout/SyndicLayout'
import { authClient }     from '@/lib/auth-client'

import { Home }           from '@/pages/Home'
import { Privacy }        from '@/pages/Privacy'
import { DataDeletion }   from '@/pages/DataDeletion'
import { AuthLayout }     from '@/pages/auth/AuthLayout'
import { Login }          from '@/pages/auth/Login'
import { Register }       from '@/pages/auth/Register'
import { Setup }          from '@/pages/auth/Setup'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#d8dce3]">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!session) return <Navigate to="/auth/login" replace />

  // New user — has account but no org yet (social login or fresh email signup)
  if (!session.session.activeOrganizationId) return <Navigate to="/auth/setup" replace />

  return <>{children}</>
}

// ── Dashboard analytics pages ──
import { Dashboard }      from '@/pages/syndic/Dashboard'
import { ApartmentsDash } from '@/pages/syndic/dashboards/ApartmentsDash'
import { PaymentsDash }   from '@/pages/syndic/dashboards/PaymentsDash'
import { MeetingsDash }   from '@/pages/syndic/dashboards/MeetingsDash'
import { AccountingDash } from '@/pages/syndic/dashboards/AccountingDash'
import { FeedDash }       from '@/pages/syndic/dashboards/FeedDash'
import { ServicesDash }   from '@/pages/syndic/dashboards/ServicesDash'
import { UnionDash }      from '@/pages/syndic/dashboards/UnionDash'
import { ChatbotDash }    from '@/pages/syndic/dashboards/ChatbotDash'

// ── Functional pages ──
import { Association }    from '@/pages/syndic/Association'
import { Payments }       from '@/pages/syndic/Payments'
import { Documents }      from '@/pages/syndic/Documents'
import { Meetings }       from '@/pages/syndic/Meetings'
import { Accounting }     from '@/pages/syndic/Accounting'
import { Feed }           from '@/pages/syndic/Feed'
import { Services }       from '@/pages/syndic/Services'
import { Alerts }         from '@/pages/syndic/Alerts'
import { UnionMembers }   from '@/pages/syndic/UnionMembers'
import { Profile }        from '@/pages/syndic/Profile'
import { Residences }     from '@/pages/syndic/Residences'
import { Chat }           from '@/pages/syndic/Chat'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/privacy"       element={<Privacy />} />
      <Route path="/data-deletion" element={<DataDeletion />} />
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login"    element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="setup"    element={<Setup />} />
      </Route>
      <Route path="/syndic" element={<ProtectedRoute><SyndicLayout /></ProtectedRoute>}>

        {/* ── DASHBOARDS section ── */}
        <Route index                      element={<Dashboard />} />
        <Route path="dash/apartments"     element={<ApartmentsDash />} />
        <Route path="dash/payments"       element={<PaymentsDash />} />
        <Route path="dash/meetings"       element={<MeetingsDash />} />
        <Route path="dash/accounting"     element={<AccountingDash />} />
        <Route path="dash/feed"           element={<FeedDash />} />
        <Route path="dash/services"       element={<ServicesDash />} />
        <Route path="dash/union"          element={<UnionDash />} />
        <Route path="dash/chatbot"        element={<ChatbotDash />} />

        {/* ── GENERAL ── */}
        <Route path="profile"             element={<Profile />} />

        {/* ── MANAGEMENT ── */}
        <Route path="association"           element={<Association />} />
        <Route path="payments"            element={<Payments />} />
        <Route path="documents"           element={<Documents />} />
        <Route path="meetings"            element={<Meetings />} />
        <Route path="accounting"          element={<Accounting />} />

        {/* ── COMMUNITY ── */}
        <Route path="feed"                element={<Feed />} />
        <Route path="services"            element={<Services />} />
        <Route path="alerts"              element={<Alerts />} />

        {/* ── UNION ── */}
        <Route path="union-members"       element={<UnionMembers />} />

        {/* ── Settings ── */}
        <Route path="settings"            element={<Profile />} />
        <Route path="residences"          element={<Residences />} />
        <Route path="chat"                element={<Chat />} />
      </Route>
    </Routes>
  )
}
