import { createContext, useContext } from 'react'
import type { ResidenceAbility } from './residence-ability'

export const ResidenceAbilityContext = createContext<ResidenceAbility | null>(null)

export function useResidenceAbility(): ResidenceAbility {
  const ability = useContext(ResidenceAbilityContext)
  if (!ability) throw new Error('useResidenceAbility must be used within ResidenceAbilityProvider')
  return ability
}
