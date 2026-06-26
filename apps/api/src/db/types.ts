import type { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely'

// ── HELPERS ───────────────────────────────────────────────────────────────────

type Timestamp = ColumnType<Date, Date | string, Date | string>

// ── PUBLIC SCHEMA TABLES ──────────────────────────────────────────────────────
// Prefixed with "public." so they stay qualified and are never affected by
// db.withSchema(orgSlug) calls.

export interface PublicUserTable {
  id: string
  name: string
  email: string
  emailVerified: ColumnType<boolean, boolean, boolean>
  verifiedAt: Timestamp | null
  image: string | null
  firstName: string | null
  lastName: string | null
  phone: string | null
  role: string | null
  platformRole: 'SUDO' | 'USER'
  banned: boolean | null
  banReason: string | null
  banExpires: Timestamp | null
  twoFactorEnabled: boolean | null
  createdAt: ColumnType<Date, Date | string | undefined, never>
  updatedAt: Timestamp
}

export interface PublicSessionTable {
  id: string
  expiresAt: Timestamp
  token: string
  createdAt: ColumnType<Date, Date | string | undefined, never>
  updatedAt: Timestamp
  ipAddress: string | null
  userAgent: string | null
  userId: string
  accountId: string | null
  profileId: string | null
  activeOrganizationId: string | null
  impersonatedBy: string | null
}

export interface PublicAccountTable {
  id: string
  accountId: string
  providerId: string
  userId: string
  organizationId: string | null
  accessToken: string | null
  refreshToken: string | null
  idToken: string | null
  accessTokenExpiresAt: Timestamp | null
  refreshTokenExpiresAt: Timestamp | null
  scope: string | null
  password: string | null
  createdAt: ColumnType<Date, Date | string | undefined, never>
  updatedAt: Timestamp
}

export interface PublicVerificationTable {
  id: string
  identifier: string
  value: string
  expiresAt: Timestamp
  createdAt: ColumnType<Date, Date | string | undefined, never>
  updatedAt: Timestamp
}

export interface PublicTwoFactorTable {
  id: string
  secret: string
  backupCodes: string
  userId: string
  verified: boolean | null
}

export interface PublicOrganizationTable {
  id: Generated<string>
  name: string
  slug: string
  logo: string | null
  created_at: ColumnType<Date, Date | string | undefined, never>
  updated_at: Timestamp
}

export interface PublicProfileTable {
  id: Generated<string>
  user_id: string
  organization_id: string
  role: 'SYNDIC' | 'OWNER' | 'TENANT' | 'STAFF'
  created_at: ColumnType<Date, Date | string | undefined, never>
  updated_at: Timestamp
  deleted_at: Timestamp | null
}

export interface PublicInvitationTable {
  id: Generated<string>
  email: string
  invited_by_id: string
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
  expires_at: Timestamp
  created_at: ColumnType<Date, Date | string | undefined, never>
}

export interface PublicLegalRegistrationResidenceTable {
  id: Generated<string>
  legal_registration_number: string
  org_id: string
  res_id: string
}

export interface PublicSharedFacilityTable {
  id: Generated<string>
  name: string
  type: 'GARAGE' | 'PARKING' | 'POOL' | 'GARDEN' | 'PLAYGROUND' | 'EQUIPMENT_ROOM' | 'OTHER'
  description: string | null
  created_at: ColumnType<Date, Date | string | undefined, never>
  updated_at: Timestamp
}

export interface PublicSharedFacilityLinkTable {
  id: Generated<string>
  org_id: string
  shared_facility_id: string
  residence_id: string | null
  building_id: string | null
}

export interface PublicDocTable {
  id: Generated<string>
  type: 'FILE' | 'FOLDER'
  parent_id: string | null
  name: string
  created_by: string
  created_at: ColumnType<Date, Date | string | undefined, never>
  updated_at: Timestamp
}

export interface PublicDocAccessTable {
  profile_id: string
  folder_id: string
  access_level: 'VIEW' | 'EDIT' | 'ADMIN'
}

// ── TENANT SCHEMA TABLES ──────────────────────────────────────────────────────
// No prefix — db.withSchema(orgSlug) will qualify these at query time.
// Cross-schema refs to public (ownerProfileId etc.) are plain strings;
// DB-level FK constraints are added via raw SQL in migrations.

export interface ResidenceTable {
  id: Generated<string>
  name: string
  address: string
  city: string | null
  titre_foncier: string | null
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE'
  image: string | null
  description: string | null
  created_at: ColumnType<Date, Date | string | undefined, never>
  updated_at: Timestamp
}

export interface BuildingTable {
  id: Generated<string>
  name: string
  address: string | null
  image: string | null
  floors: number | null
  has_elevator: boolean
  description: string | null
  residence_id: string
  quote_part: number | null
  created_at: ColumnType<Date, Date | string | undefined, never>
  updated_at: Timestamp
}

export interface ApartmentTable {
  id: Generated<string>
  unit_code: string
  lot_number: string | null
  floor: number | null
  area_sqm: number | null
  status: 'OCCUPIED' | 'VACANT' | 'MAINTENANCE'
  usage_type: 'RESIDENTIAL' | 'COMMERCIAL' | 'PARKING' | 'MIXED'
  quote_part: number | null
  building_id: string
  owner_profile_id: string | null  // → public.profiles.id (DB FK in migration SQL)
  shareholders: ColumnType<unknown, unknown, unknown> // jsonb
  created_at: ColumnType<Date, Date | string | undefined, never>
  updated_at: Timestamp
}

export interface PaymentTable {
  id: Generated<string>
  amount: number
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED'
  type: 'CHARGE' | 'MAINTENANCE' | 'REPAIR' | 'INSURANCE' | 'OTHER'
  method: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CARD' | null
  due_date: Timestamp
  paid_at: Timestamp | null
  description: string | null
  apartment_id: string
  paid_by: string  // → public.profiles.id (DB FK in migration SQL)
  created_at: ColumnType<Date, Date | string | undefined, never>
  updated_at: Timestamp
}

export interface ComplaintTable {
  id: Generated<string>
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  apartment_id: string
  created_at: ColumnType<Date, Date | string | undefined, never>
  updated_at: Timestamp
}

export interface MeetingTable {
  id: Generated<string>
  title: string
  description: string | null
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  type: 'GLOBAL' | 'EXCEPTIONAL' | 'NORMAL'
  convocation_number: 1 | 2
  scheduled_at: Timestamp
  location: string | null
  total_eligible: number
  residence_id: string | null
  building_id: string | null
  convocation_sent_at: Timestamp | null
  created_at: ColumnType<Date, Date | string | undefined, never>
  updated_at: Timestamp
}

export interface AgendaItemTable {
  id: Generated<string>
  meeting_id: string
  title: string
  description: string | null
  vote_status: 'PENDING' | 'OPEN' | 'CLOSED'
  pour: number
  contre: number
  abstention: number
  result: 'ADOPTED' | 'REJECTED' | null
  sort_order: number
  created_at: ColumnType<Date, Date | string | undefined, never>
  updated_at: Timestamp
}

export interface MeetingAttendeeTable {
  id: Generated<string>
  meeting_id: string
  profile_id: string | null
  name: string
  apartment: string
  rsvp: 'ACCEPTED' | 'DECLINED' | 'PENDING'
  present: boolean
  created_at: ColumnType<Date, Date | string | undefined, never>
  updated_at: Timestamp
}

export interface MeetingMemberTable {
  id: Generated<string>
  meeting_id: string
  member_id: string  // → public.profiles.id (DB FK in migration SQL)
}

export interface GroupTable {
  id: Generated<string>
  name: string
  slug: string
  residence_id: string | null
  building_id: string | null
  created_at: ColumnType<Date, Date | string | undefined, never>
  updated_at: Timestamp
}

export interface ProfileGroupTable {
  id: Generated<string>
  group_id: string
  profile_id: string  // → public.profiles.id (DB FK in migration SQL)
  role: 'USER' | 'ADMIN' | 'RIGHT_HAND'
}

export interface FeedPostTable {
  id: Generated<string>
  content: string
  media_url: string | null
  media_type: 'image' | 'video' | null
  author_id: string  // → profile_groups.id
  created_at: ColumnType<Date, Date | string | undefined, never>
  updated_at: Timestamp
}

export interface FeedCommentTable {
  id: Generated<string>
  content: string
  author_profile_id: string  // → public.profiles.id (DB FK in migration SQL)
  post_id: string
  parent_id: string | null
  created_at: ColumnType<Date, Date | string | undefined, never>
}

export interface FeedPostLikeTable {
  id: Generated<string>
  post_id: string           // → feed_posts.id (ON DELETE CASCADE)
  profile_group_id: string  // → _profile_groups.id (the member who liked)
  created_at: ColumnType<Date, Date | string | undefined, never>
}

export interface DocumentTable {
  id: Generated<string>
  type: 'FILE' | 'FOLDER'
  parent_id: string | null
  name: string
  path: string | null
  size: number | null
  uploaded_by: string  // → public.profiles.id (DB FK in migration SQL)
  uploaded_at: ColumnType<Date, Date | string | undefined, never>
  updated_at: Timestamp
}

export interface DocumentAccessTable {
  id: Generated<string>
  doc_id: string
  profile_id: string | null   // → public.profiles.id (DB FK in migration SQL)
  residence_id: string | null
  building_id: string | null
  apartment_id: string | null
  contract_id: string | null
  access_level: 'VIEW' | 'EDIT' | 'ADMIN'
}

export interface ServiceTable {
  id: Generated<string>
  name: string
  slug: string
  type: string | null
  contact_info: ColumnType<unknown, unknown, unknown> | null // json
}

export interface ServiceScheduleTable {
  service_id: string
  schedule: string
}

export interface ServiceCheckInOutTable {
  id: Generated<string>
  service_id: string
  profile_id: string  // → public.profiles.id (DB FK in migration SQL)
  check_in_at: Timestamp | null
  check_out_at: Timestamp | null
}

export interface ServiceContractTable {
  id: Generated<string>
  service_id: string
  name: string
  description: string | null
  amount: ColumnType<number, number | undefined, number>
  amount_paid: ColumnType<number, number | undefined, number>
  start_date: string
  end_date: string
  status: ColumnType<string, string | undefined, string>
}

export interface ServiceResidenceTable {
  service_contract_id: string
  residence_id: string
}

export interface NotificationTable {
  id: Generated<string>
  type: 'PAYMENT' | 'COMPLAINT' | 'MEETING' | 'DOCUMENT' | 'MEMBER' | 'FEED' | 'SERVICE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  profile_id: string  // → public.profiles.id (DB FK in migration SQL)
  context: ColumnType<unknown, unknown, unknown> // json
  events: ColumnType<unknown, unknown, unknown>  // json append-only log
  created_at: ColumnType<Date, Date | string | undefined, never>
  expires_at: Timestamp | null
}

// ── DATABASE INTERFACE ────────────────────────────────────────────────────────
// Public tables are prefixed with "public." — withSchema() never touches them.
// Tenant tables have no prefix — withSchema(orgSlug) qualifies them at query time.

export interface Database {
  // public schema — auth + org layer
  'public.user': PublicUserTable
  'public.session': PublicSessionTable
  'public.account': PublicAccountTable
  'public.verification': PublicVerificationTable
  'public.twoFactor': PublicTwoFactorTable
  'public.organizations': PublicOrganizationTable
  'public.profiles': PublicProfileTable
  'public.invitations': PublicInvitationTable
  'public.legal_registration_residences': PublicLegalRegistrationResidenceTable
  'public.shared_facilities': PublicSharedFacilityTable
  'public._shared_facility_links': PublicSharedFacilityLinkTable
  'public.docs': PublicDocTable
  'public._docs_access': PublicDocAccessTable

  // tenant schema — domain models (no prefix, qualified by withSchema)
  residences: ResidenceTable
  buildings: BuildingTable
  apartments: ApartmentTable
  payments: PaymentTable
  complaints: ComplaintTable
  meetings: MeetingTable
  agenda_items: AgendaItemTable
  meeting_attendees: MeetingAttendeeTable
  meetings_members: MeetingMemberTable
  groups: GroupTable
  _profile_groups: ProfileGroupTable
  feed_posts: FeedPostTable
  feed_post_likes: FeedPostLikeTable
  feed_comments: FeedCommentTable
  documents: DocumentTable
  document_access: DocumentAccessTable
  services: ServiceTable
  service_schedules: ServiceScheduleTable
  service_check_in_out: ServiceCheckInOutTable
  service_contracts: ServiceContractTable
  service_residences: ServiceResidenceTable
  notifications: NotificationTable
}

// ── CONVENIENCE SELECT TYPES ──────────────────────────────────────────────────

export type User         = Selectable<PublicUserTable>
export type Organization = Selectable<PublicOrganizationTable>
export type Profile      = Selectable<PublicProfileTable>
export type Invitation   = Selectable<PublicInvitationTable>

export type Residence    = Selectable<ResidenceTable>
export type Building     = Selectable<BuildingTable>
export type Apartment    = Selectable<ApartmentTable>
export type Payment      = Selectable<PaymentTable>
export type Complaint    = Selectable<ComplaintTable>
export type Meeting      = Selectable<MeetingTable>
export type Group        = Selectable<GroupTable>
export type FeedPost     = Selectable<FeedPostTable>
export type FeedPostLike = Selectable<FeedPostLikeTable>
export type Notification = Selectable<NotificationTable>

export type NewResidence = Insertable<ResidenceTable>
export type NewBuilding  = Insertable<BuildingTable>
export type NewApartment = Insertable<ApartmentTable>
export type NewPayment   = Insertable<PaymentTable>
export type NewComplaint = Insertable<ComplaintTable>
