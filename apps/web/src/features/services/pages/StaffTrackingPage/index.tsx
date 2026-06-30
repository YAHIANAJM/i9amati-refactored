import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { defineServiceAbility } from '@i9amati/shared'
import {
    servicesApi,
    type ApiStaffProfile, type ServicesResponse,
} from '@/lib/services.api'
import StaffTable from './sections/staff'
import SessionTable from './sections/session'
import { Topbar } from './components/TopBar'
import StaffProfile from './components/StaffProfile'
import { NewWorkerStaff } from './components/NewWorkerStaff'




export function StaffTrackingPage() {
    const { serviceId } = useParams<{ serviceId: string }>()


    // ── View state ─────────────────────────────────────────────────────────────
    const [selectedStaff, setSelectedStaff] = useState<ApiStaffProfile | null>(null)



    // ── Service + role ─────────────────────────────────────────────────────────
    const { data: servicesData } = useQuery<ServicesResponse>({
        queryKey: ['services'],
        queryFn: servicesApi.list,
        staleTime: 60_000,
    })
    const service = servicesData?.services.find(s => s.id === serviceId)
    const profileRole = servicesData?.profileRole ?? ''
    const userServiceTrackingAbility = defineServiceAbility(profileRole)
    const canManage = userServiceTrackingAbility.can('manage', 'all')

    const view = selectedStaff ? 'sessions' : 'staff'

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col h-full">

            <Topbar service={service} />

            {/* Two-panel body — fills remaining height */}
            <div className="flex-1 flex gap-5 p-6 min-h-0">

                {/* ── Main panel ──────────────────────────────────────────────────── */}
                <div className="flex-1 min-w-0 flex flex-col gap-4 min-h-0">

                    {view === 'staff' ? (
                        <StaffTable userServiceTrackingAbility={userServiceTrackingAbility} setSelectedStaff={setSelectedStaff} serviceId={serviceId!} />
                    ) : (
                        <SessionTable serviceId={serviceId!} selectedStaff={selectedStaff} setSelectedStaff={setSelectedStaff} />
                    )}
                </div>

                {/* ── Right panel ─────────────────────────────────────────────────── */}
                {(selectedStaff || canManage) && <div className="w-72 shrink-0">
                    {selectedStaff ? (
                        <StaffProfile serviceId={serviceId!} setSelectedStaff={setSelectedStaff} selectedStaff={selectedStaff} staffProfileServiceAbility={userServiceTrackingAbility} />
                    ) : canManage ? (
                        <NewWorkerStaff serviceId={serviceId!} />
                    ) : null}
                </div>}


            </div>
        </div>
    )
}

