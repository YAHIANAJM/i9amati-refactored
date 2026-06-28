import { AbilityBuilder, createMongoAbility } from '@casl/ability'
import type { MongoAbility, ForcedSubject } from '@casl/ability'
import { ProfileRole } from '@i9amati/shared'

export { subject } from '@casl/ability'

// ── Subject shapes ─────────────────────────────────────────────────────────────

type ResidenceAttrs = { syndicId: string }
type BuildingAttrs  = { residenceId: string }
type ApartmentAttrs = { buildingId: string; residenceId: string }
type OwnerAttrs     = { profileId: string; apartmentId: string }

export type TaggedResidence = ResidenceAttrs & ForcedSubject<'Residence'>
export type TaggedBuilding  = BuildingAttrs  & ForcedSubject<'Building'>
export type TaggedApartment = ApartmentAttrs & ForcedSubject<'Apartment'>
export type TaggedOwner     = OwnerAttrs     & ForcedSubject<'Owner'>

type Actions  = 'create' | 'read' | 'update' | 'delete' | 'manage'
type Subjects =
  | 'Residence' | TaggedResidence
  | 'Building'  | TaggedBuilding
  | 'Apartment' | TaggedApartment
  | 'Owner'     | TaggedOwner
  | 'all'

export type ResidenceAbility = MongoAbility<[Actions, Subjects]>

// ── Ability builder ────────────────────────────────────────────────────────────

export function defineResidenceAbility(
  profileRole: ProfileRole,
  _profileId: string,
): ResidenceAbility {
  const { can, build } = new AbilityBuilder<ResidenceAbility>(createMongoAbility)

  // SYNDIC — full control over everything
  if (profileRole === ProfileRole.SYNDIC) {
    can('manage', 'all')
    return build()
  }

  // STAFF — read-only across all entities
  if (profileRole === ProfileRole.STAFF) {
    can('read', 'Residence')
    can('read', 'Building')
    can('read', 'Apartment')
    can('read', 'Owner')
    return build()
  }

  // OWNER — can read everything; can update their own apartment info
  if (profileRole === ProfileRole.OWNER) {
    can('read', 'Residence')
    can('read', 'Building')
    can('read', 'Apartment')
    can('read', 'Owner')
    return build()
  }

  // TENANT — read residences, buildings, their own apartment
  if (profileRole === ProfileRole.TENANT) {
    can('read', 'Residence')
    can('read', 'Building')
    can('read', 'Apartment')
    return build()
  }

  return build()
}
