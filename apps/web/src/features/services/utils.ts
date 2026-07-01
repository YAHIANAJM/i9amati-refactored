import type { ServiceContractStatus } from '@/lib/services.api'

export function getStatusVariant(status: ServiceContractStatus): 'success' | 'warning' | 'destructive' | 'outline' {
  switch (status) {
    case 'ACTIVE':    return 'success'
    case 'PENDING':   return 'warning'
    case 'EXPIRED':   return 'destructive'
    case 'CANCELLED': return 'outline'
  }
}

export function getTypeColorClass(type: string | null): string {
  if (!type) return 'bg-gray-50 text-gray-700'
  const map: Record<string, string> = {
    Nettoyage:   'bg-blue-50 text-blue-700',
    Sécurité:    'bg-purple-50 text-purple-700',
    Ascenseur:   'bg-amber-50 text-amber-700',
    Plomberie:   'bg-cyan-50 text-cyan-700',
    Électricité: 'bg-yellow-50 text-yellow-700',
    Jardinage:   'bg-green-50 text-green-700',
    Peinture:    'bg-pink-50 text-pink-700',
  }
  return map[type] ?? 'bg-gray-50 text-gray-700'
}

export function paymentPercent(paid: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.round((paid / total) * 100))
}
