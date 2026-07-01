import { AbilityBuilder, createMongoAbility } from '@casl/ability'
import type { MongoAbility } from '@casl/ability'
import { ProfileRole } from './permissions'

export type ServiceActions = 'create' | 'read' | 'update' | 'delete' | 'manage'
export type ServiceSubjects = 'Service' | 'ServiceContract' | 'ServiceSession' | 'all' | { profile_id?: string; [key: string]: any }

export type ServiceAbility = MongoAbility<[ServiceActions, ServiceSubjects]>

export function defineServiceAbility(profileRole: string, profileId?: string): ServiceAbility {
  const { can, build } = new AbilityBuilder<ServiceAbility>(createMongoAbility)

  switch (profileRole) {
    case ProfileRole.SYNDIC:
      can('manage', 'all')
      break
    case ProfileRole.STAFF:
      can('read', 'Service')
      can('read', 'ServiceContract')
      can('read', 'ServiceSession')
      if (profileId) {
        can('create', 'ServiceSession', { profile_id: profileId })
        can('update', 'ServiceSession', { profile_id: profileId })
      }
      break
    default:
      can('read', 'Service')
      can('read', 'ServiceContract')
      can('read', 'ServiceSession')
  }

  return build()
}
