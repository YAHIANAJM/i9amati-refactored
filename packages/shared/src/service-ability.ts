import { AbilityBuilder, createMongoAbility } from '@casl/ability'
import type { MongoAbility } from '@casl/ability'
import { ProfileRole } from './permissions'

export type ServiceActions = 'create' | 'read' | 'update' | 'delete' | 'manage'
export type ServiceSubjects = 'Service' | 'ServiceContract' | 'all'

export type ServiceAbility = MongoAbility<[ServiceActions, ServiceSubjects]>

export function defineServiceAbility(profileRole: string): ServiceAbility {
  const { can, build } = new AbilityBuilder<ServiceAbility>(createMongoAbility)

  switch (profileRole) {
    case ProfileRole.SYNDIC:
      can('manage', 'all')
      break
    case ProfileRole.STAFF:
      can('read', 'Service')
      can('read', 'ServiceContract')
      break
    default:
      can('read', 'Service')
      can('read', 'ServiceContract')
  }

  return build()
}
