import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function OrganizationSwitcher() {
  const { data: organization } = authClient.useActiveOrganization()
  const { data: organizations } = authClient.useListOrganizations()
  const [isOpen, setIsOpen] = useState(false)

  const handleSwitch = async (orgId: string) => {
    await authClient.organization.setActive({ organizationId: orgId })
    setIsOpen(false)
    // Optionally reload to fetch new tenant context data
    window.location.reload()
  }

  const handleCreate = async () => {
    const name = prompt('Organization Name:')
    const slug = prompt('Organization Slug (unique):')
    if (name && slug) {
      const res = await authClient.organization.create({ name, slug })
      if (!res.error) {
        handleSwitch(res.data.id)
      } else {
        alert(res.error.message)
      }
    }
  }

  return (
    <div className="relative">
      <Button variant="outline" onClick={() => setIsOpen(!isOpen)}>
        {organization ? organization.name : 'Select Tenant'}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            {organizations?.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSwitch(org.id)}
                className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                  organization?.id === org.id ? 'bg-gray-50 font-bold' : ''
                }`}
              >
                {org.name}
              </button>
            ))}
            <div className="border-t border-gray-100 mt-1"></div>
            <button
              onClick={handleCreate}
              className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
            >
              + Create Tenant
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
