import { ApiStaffProfile } from "@/lib/services.api"
import { CreateStaffSchema } from "@i9amati/shared"
import { useTranslation } from "react-i18next"
import { z } from 'zod'

export function calcDuration(checkIn: string, checkOut: string): string {
    const mins = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60_000)
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
}
export const staffName = (s: ApiStaffProfile, t: ReturnType<typeof useTranslation>["t"]) => [s.firstName, s.lastName].filter(Boolean).join(' ') || t('services.noName')

export type CreateForm = z.infer<typeof CreateStaffSchema>
