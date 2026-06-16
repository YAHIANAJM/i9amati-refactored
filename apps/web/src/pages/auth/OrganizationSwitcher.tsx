import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Building2, Check, ChevronDown, Plus, X } from 'lucide-react'

export function OrganizationSwitcher() {
  const { data: organization } = authClient.useActiveOrganization()
  const { data: organizations } = authClient.useListOrganizations()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSwitch = async (orgId: string) => {
    await authClient.organization.setActive({ organizationId: orgId })
    setOpen(false)
    window.location.reload()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await authClient.organization.create({ name, slug })
    setLoading(false)
    if (res.error) {
      setError(res.error.message ?? 'Failed to create organization')
    } else {
      setName('')
      setSlug('')
      setCreating(false)
      handleSwitch(res.data.id)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="gap-2 max-w-[200px]"
        onClick={() => { setOpen(o => !o); setCreating(false) }}
      >
        <Building2 size={14} className="shrink-0" />
        <span className="truncate">{organization?.name ?? 'Select organization'}</span>
        <ChevronDown size={12} className="shrink-0 text-muted-foreground" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-64 bg-white border border-border rounded-lg shadow-lg z-50 overflow-hidden">

            {!creating ? (
              <>
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                  Organizations
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {organizations?.map(org => (
                    <button
                      key={org.id}
                      onClick={() => handleSwitch(org.id)}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                        {org.name[0].toUpperCase()}
                      </div>
                      <span className="flex-1 truncate">{org.name}</span>
                      {organization?.id === org.id && (
                        <Check size={12} className="text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                  {!organizations?.length && (
                    <p className="px-3 py-3 text-sm text-muted-foreground">No organizations yet.</p>
                  )}
                </div>
                <div className="border-t border-border">
                  <button
                    onClick={() => setCreating(true)}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-primary hover:bg-primary/5 transition-colors"
                  >
                    <Plus size={14} /> New organization
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleCreate} className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">New organization</span>
                  <button type="button" onClick={() => setCreating(false)}>
                    <X size={14} className="text-muted-foreground" />
                  </button>
                </div>
                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Name</label>
                  <input
                    required
                    value={name}
                    onChange={e => {
                      setName(e.target.value)
                      setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                    }}
                    placeholder="Résidence Al Nour"
                    className="w-full h-8 rounded-md border border-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Slug (unique)</label>
                  <input
                    required
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    placeholder="residence-al-nour"
                    className="w-full h-8 rounded-md border border-input px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button type="submit" size="sm" className="w-full" disabled={loading}>
                  {loading ? 'Creating…' : 'Create'}
                </Button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  )
}
