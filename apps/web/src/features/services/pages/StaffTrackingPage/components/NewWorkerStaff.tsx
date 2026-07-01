import { toastApiError, toastCreated } from "@/components/toast"
import { servicesApi } from "@/lib/services.api"
import { CreateStaffSchema } from "@i9amati/shared"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { CreateForm } from "../utils"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function NewWorkerStaff({
    serviceId
}: {
    serviceId: string
}) {
    const qc = useQueryClient()
    const [form, setForm] = useState<CreateForm>({ firstName: '', lastName: '', email: '' })
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof CreateForm, string>>>({})
    // ── Handlers ───────────────────────────────────────────────────────────────
    const createStaff = useMutation({
        mutationFn: async (data: CreateForm) => {
            const res = await servicesApi.createStaff(data)
            await servicesApi.assignStaff(serviceId!, res.id)
            return res
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['services', 'staff', serviceId] })
            toastCreated(t('services.staffCreatedSuccessfully'))
            setForm({ firstName: '', lastName: '', email: '' })
            setFormErrors({})
        },
        onError: (err) => toastApiError(err),
    })
    const handleCreateSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault()
        const result = CreateStaffSchema.safeParse(form)
        if (!result.success) {
            const errs: Record<string, string> = {}
            for (const err of result.error.errors) {
                if (err.path[0]) errs[String(err.path[0])] = err.message
            }
            setFormErrors(errs)
            return
        }
        setFormErrors({})
        createStaff.mutate(result.data)
    }, [form, createStaff])
    const { t } = useTranslation()
    return (
        <div className="bg-card rounded-xl border p-5 space-y-4 sticky top-24">
            <div>
                <p className="text-sm font-semibold">{t('services.createStaff')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('services.createStaffHint')}</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium">{t('services.firstName')}</label>
                    <input
                        value={form.firstName}
                        onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="John"
                    />
                    {formErrors.firstName && (
                        <p className="text-xs text-destructive">{t(formErrors.firstName as any)}</p>
                    )}
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium">{t('services.lastName')}</label>
                    <input
                        value={form.lastName}
                        onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Doe"
                    />
                    {formErrors.lastName && (
                        <p className="text-xs text-destructive">{t(formErrors.lastName as any)}</p>
                    )}
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium">{t('services.email')}</label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="john@example.com"
                    />
                    {formErrors.email && (
                        <p className="text-xs text-destructive">{t(formErrors.email as any)}</p>
                    )}
                </div>
                <Button type="submit" size="sm" className="w-full gap-1.5" disabled={createStaff.isPending}>
                    <Plus size={13} />
                    {t('services.createStaffButton')}
                </Button>
            </form>
        </div>
    )
}