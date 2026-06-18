// ── ENUMS ─────────────────────────────────────────────────────────────────────

Enum PlatformRole {
  SUDO
  USER
}

Enum ProfileRole {
  SYNDIC
  OWNER
  TENANT
  STAFF
}

Enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  CANCELLED
}

Enum ResidenceStatus {
  ACTIVE
  MAINTENANCE
  INACTIVE
}

Enum ApartmentStatus {
  OCCUPIED
  VACANT
  MAINTENANCE
}

Enum UsageType {
  RESIDENTIAL
  COMMERCIAL
  PARKING
  MIXED
}

Enum SharedFacilityType {
  GARAGE
  PARKING
  POOL
  GARDEN
  PLAYGROUND
  EQUIPMENT_ROOM
  OTHER
}

Enum PaymentStatus {
  PAID
  PENDING
  OVERDUE
  CANCELLED
}

Enum PaymentType {
  CHARGE
  MAINTENANCE
  REPAIR
  INSURANCE
  OTHER
}

Enum PaymentMethod {
  CASH
  BANK_TRANSFER
  CHECK
  CARD
}

Enum ComplaintStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

Enum ComplaintPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

Enum MeetingStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

Enum MeetingType {
  GLOBAL
  EXCEPTIONAL
  NORMAL
}

Enum GroupMemberRole {
  USER
  ADMIN
  RIGHT_HAND
}

Enum DocumentRowType {
  FILE
  FOLDER
}

Enum DocAccessLevel {
  VIEW
  EDIT
  ADMIN
}

// ── PUBLIC SCHEMA ─────────────────────────────────────────────────────────────
// Tables in this section live in the shared public schema.
// public → public FKs: enforced natively by Postgres.
// public → tenant FKs: NOT enforceable — tenant schemas do not exist at the time
//   public tables are created, so Postgres cannot resolve the reference at DDL time.
//   These are managed by application code.
// tenant → public FKs: enforced natively — tenant schemas are created after the
//   public schema exists, so the reference target is always known at DDL time.

Table public.users {
  id               varchar      [pk]
  name             varchar      [not null]
  email            varchar      [unique, not null]
  verifiedAt       timestamp    [default: null, note: 'null means not verified yet']
  image            varchar      [default: null, note: 'image path in object storage']
  firstName        varchar
  lastName         varchar
  phone            varchar
  role             PlatformRole [default: 'USER', note: 'reserved for BA admin plugin']
  banned           boolean      [default: false]
  banReason        varchar
  banExpires       timestamp
  twoFactorEnabled boolean      [default: false]
  createdAt        timestamp    [default: `now()`]
  updatedAt        timestamp
}

Table public.session {
  id                   varchar   [pk]
  expiresAt            timestamp [not null]
  token                varchar   [unique, not null]
  createdAt            timestamp [default: `now()`]
  updatedAt            timestamp
  ipAddress            varchar
  userAgent            varchar
  userId               varchar   [not null, ref: > public.users.id, note: 'delete: cascade']
  accountId            varchar   [ref: > public.account.id, note: 'which BA credential/provider was used; delete: set null']
  profileId            varchar   [not null, ref: > public.profiles.id, note: 'profile active in this session; delete: cascade']
  activeOrganizationId varchar   [note: 'O(1) org access without join — mirrors profiles.organizationId']
  impersonatedBy       varchar

  indexes {
    userId
  }
}

Table public.account {
  id                    varchar   [pk]
  providerId            varchar   [not null]
  userId                varchar   [not null, ref: > public.users.id, note: 'delete: cascade']
  organizationId        varchar   [ref: > public.organizations.id, note: 'org-scoped OAuth — null for platform-level accounts; delete: set null']
  accessToken           varchar
  refreshToken          varchar
  idToken               varchar
  accessTokenExpiresAt  timestamp
  refreshTokenExpiresAt timestamp
  scope                 varchar
  password              varchar
  createdAt             timestamp [default: `now()`]
  updatedAt             timestamp

  indexes {
    userId
    organizationId
  }
}

Table public.verification {
  id         varchar   [pk]
  identifier varchar   [not null]
  value      varchar   [not null]
  expiresAt  timestamp [not null]
  createdAt  timestamp [default: `now()`]
  updatedAt  timestamp

  indexes {
    identifier
  }
}

Table public.twoFactor {
  id          varchar [pk]
  secret      varchar [not null]
  backupCodes varchar [not null]
  userId      varchar [not null, ref: > public.users.id, note: 'delete: cascade']
  verified    boolean [default: true]

  indexes {
    secret
    userId
  }
}

Table public.organizations {
  id        varchar   [pk]
  name      varchar   [not null]
  slug      varchar   [unique, not null]
  logo      varchar
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

// The user's identity within an organization.
// "session belongs to profile, profile belongs to org."
// All tenant-side domain activity is anchored to profileId, not userId,
// so tenant isolation is enforced at the org level.
Table public.profiles {
  id             varchar     [pk]
  userId         varchar     [not null, ref: > public.users.id, note: 'delete: cascade']
  organizationId varchar     [not null, ref: > public.organizations.id, note: 'delete: cascade']
  role           ProfileRole [not null]
  createdAt      timestamp   [default: `now()`]
  updatedAt      timestamp

  indexes {
    (userId, organizationId) [unique]
    userId
    organizationId
  }
}

// invitedById refs profiles — the profile already carries organizationId,
// so the org is implicit and does not need a separate column here.
Table public.invitations {
  id          varchar          [pk]
  email       varchar          [not null]
  invitedById varchar          [not null, ref: > public.profiles.id, note: 'delete: cascade']
  status      InvitationStatus [default: 'PENDING']
  expiresAt   timestamp        [not null]
  createdAt   timestamp        [default: `now()`]

  indexes {
    email
    invitedById
  }
}

// Cross-boundary bridge: records each residence's global legal registration number.
// This table lives in the public schema and points INTO tenant schemas (public → tenant).
// Postgres cannot enforce these FKs — tenant schemas do not exist when this table is
// created, and cannot be assigned dynamically at query time. orgId and resId integrity
// is managed by application code. legalRegistrationNumber uniqueness IS enforced here
// since the constraint lives entirely within the public schema.
Table public.legal_registration_residences {
  id                      varchar [pk]
  legalRegistrationNumber varchar [not null, unique, note: 'global registration number for the residence (titre foncier at the national level)']
  orgId                   varchar [not null, note: 'tenant org id — app-managed reference, no DB FK']
  resId                   varchar [not null, note: 'residence id inside the tenant schema — app-managed reference, no DB FK']
}

// Platform-level document store shared across orgs (legal templates, regulations, etc.)
// Supports a folder tree via parentId self-reference.
// createdBy → public.profiles.id is public → public, fully enforced by Postgres.
// Access control is in public._docs_access (separate from authorship).
Table public.docs {
  id        varchar         [pk]
  type      DocumentRowType [not null]
  parentId  varchar         [ref: > public.docs.id, note: 'null = root; delete: cascade']
  name      varchar         [not null]
  createdBy varchar         [not null, ref: > public.profiles.id]
  createdAt timestamp       [default: `now()`]
  updatedAt timestamp       [default: `now()`]

  indexes {
    (name, parentId) [unique]
  }
}

// Grants a profile access to a public.docs folder (and implicitly its children).
// Access level determines what the profile can do within that folder.
Table public._docs_access {
  profileId   varchar        [not null, ref: > public.profiles.id]
  folderId    varchar        [not null, ref: > public.docs.id]
  accessLevel DocAccessLevel [not null, default: 'VIEW']

  indexes {
    (folderId, profileId) [pk]
  }
}

// Shared facilities under Moroccan real estate law (Loi 18-00) can be shared
// across multiple residences, not just within one. Stored in public so the
// linkage table can reference any tenant's residences or buildings via
// app-managed references (public → tenant, not enforceable by Postgres).
Table public.shared_facilities {
  id          varchar            [pk]
  name        varchar            [not null]
  type        SharedFacilityType [not null]
  description varchar
  createdAt   timestamp          [default: `now()`]
  updatedAt   timestamp
}

// Links a shared facility to either a residence or a building across any tenant.
// orgId scopes the link to a tenant. buildingId and residenceId are public → tenant
// references — not enforceable by Postgres, managed by application code.
// CHECK constraint ensures exactly one of buildingId / residenceId is set.
Table public._shared_facility_links {
  id               varchar [pk]
  orgId            varchar [not null, ref: > public.organizations.id]
  sharedFacilityId varchar [not null, ref: > public.shared_facilities.id]
  residenceId      varchar [note: 'app-managed ref to tenant.residences.id — mutually exclusive with buildingId; no DB FK']
  buildingId       varchar [note: 'app-managed ref to tenant.buildings.id — mutually exclusive with residenceId; no DB FK']

  Note: '''
  CONSTRAINT chk_exclusive_target CHECK (
    (buildingId IS NOT NULL AND residenceId IS NULL) OR
    (buildingId IS NULL AND residenceId IS NOT NULL)
  )
  '''

  indexes {
    (buildingId, residenceId, sharedFacilityId) [unique]
  }
}

// ── TENANT SCHEMA ─────────────────────────────────────────────────────────────
// Tables in this section live inside each org's isolated schema.
// tenant → tenant FKs: enforced natively by Postgres.
// tenant → public FKs: enforced natively — the public schema is always present
//   when a tenant schema is provisioned, so all references to public tables
//   (profiles, organizations, users) are valid enforced foreign keys.

Table tenant.residences {
  id           varchar         [pk]
  name         varchar         [not null]
  address      varchar         [not null]
  city         varchar
  titreFoncier varchar         [note: 'property-level legal registration number']
  status       ResidenceStatus [default: 'ACTIVE']
  image        varchar
  description  varchar
  createdAt    timestamp       [default: `now()`]
  updatedAt    timestamp
}

Table tenant.buildings {
  id          varchar   [pk]
  name        varchar   [not null]
  address     varchar
  image       varchar
  floors      integer
  hasElevator boolean   [default: false]
  description varchar
  residenceId varchar   [not null, ref: > tenant.residences.id]
  quotePart   float     [note: 'this building''s fractional share of residence-level charges (0–1)']
  createdAt   timestamp [default: `now()`]
  updatedAt   timestamp
}

Table tenant.apartments {
  id             varchar         [pk]
  unitCode       varchar         [not null, note: 'government-issued unit identifier']
  lotNumber      varchar
  floor          integer
  areaSqm        float
  status         ApartmentStatus [default: 'VACANT']
  usageType      UsageType       [default: 'RESIDENTIAL']
  quotePart      float           [note: 'this apartment''s fractional share of building-level charges (0–1)']
  buildingId     varchar         [not null, ref: > tenant.buildings.id]
  ownerProfileId varchar         [ref: > public.profiles.id, note: 'tenant → public; enforced by Postgres']
  shareholders   jsonb           [default: '[]', note: 'reference data only: other shareholders (name, CIN, etc.) — not actual platform accounts']
  createdAt      timestamp       [default: `now()`]
  updatedAt      timestamp
}

Table tenant.payments {
  id          varchar       [pk]
  amount      float         [not null]
  status      PaymentStatus [default: 'PENDING']
  type        PaymentType   [default: 'CHARGE']
  method      PaymentMethod [note: 'null until payment is made']
  dueDate     timestamp     [not null]
  paidAt      timestamp
  description varchar
  apartmentId varchar       [not null, ref: > tenant.apartments.id]
  paidBy      varchar       [not null, ref: > public.profiles.id, note: 'tenant → public; the payer, not necessarily the owner; enforced by Postgres']
  createdAt   timestamp     [default: `now()`]
  updatedAt   timestamp
}

// authorProfileId is omitted — the apartment already carries ownerProfileId,
// and only the apartment owner can file a complaint for it.
Table tenant.complaints {
  id          varchar           [pk]
  title       varchar           [not null]
  description varchar           [not null]
  status      ComplaintStatus   [default: 'OPEN']
  priority    ComplaintPriority [default: 'MEDIUM']
  apartmentId varchar           [not null, ref: > tenant.apartments.id]
  createdAt   timestamp         [default: `now()`]
  updatedAt   timestamp
}

// residenceId removed — scope is determined via meetings_members.
// A meeting with no members in the junction table is residence-wide (GLOBAL type).
Table tenant.meetings {
  id          varchar       [pk]
  title       varchar       [not null]
  description varchar
  status      MeetingStatus [default: 'SCHEDULED']
  type        MeetingType   [not null]
  scheduledAt timestamp     [not null]
  location    varchar
  agenda      json          [default: '[]', note: 'ordered array of agenda items with timing']
  createdAt   timestamp     [default: `now()`]
  updatedAt   timestamp
}

Table tenant.meetings_members {
  id        varchar [pk]
  meetingId varchar [not null, ref: > tenant.meetings.id]
  memberId  varchar [not null, ref: > public.profiles.id, note: 'tenant → public; enforced by Postgres']

  indexes {
    (meetingId, memberId) [unique]
  }
}

Table tenant.groups {
  id          varchar   [pk]
  name        varchar   [not null]
  slug        varchar   [not null, unique]
  residenceId varchar   [ref: > tenant.residences.id, note: 'mutually exclusive with buildingId']
  buildingId  varchar   [ref: > tenant.buildings.id, note: 'mutually exclusive with residenceId']
  createdAt   timestamp [default: `now()`]
  updatedAt   timestamp

  Note: 'A group belongs to a residence, a building, or neither — never both. Enforced by CHECK constraint: residenceId IS NULL OR buildingId IS NULL.'

  indexes {
    (residenceId, buildingId) [name: 'check_only_one_or_none']
  }
}

// M2M: profile membership in a group. Surrogate PK so memberId is stable
// for feed_posts.authorId references.
Table tenant._profile_groups {
  id        varchar         [pk]
  groupId   varchar         [not null, ref: > tenant.groups.id]
  profileId varchar         [not null, ref: > public.profiles.id, note: 'tenant → public; enforced by Postgres']
  role      GroupMemberRole [not null, default: 'USER']

  indexes {
    (groupId, profileId) [unique]
  }
}

// authorId refs the group membership row — a post is scoped to both the group
// and the member who posted. If the member leaves the group the post is still
// traceable via the membership id.
Table tenant.feed_posts {
  id        varchar   [pk]
  content   varchar   [not null]
  authorId  varchar   [not null, ref: > tenant._profile_groups.id]
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table tenant.feed_comments {
  id              varchar   [pk]
  content         varchar   [not null]
  authorProfileId varchar   [not null, ref: > public.profiles.id, note: 'tenant → public; enforced by Postgres']
  postId          varchar   [not null, ref: > tenant.feed_posts.id, note: 'delete: cascade']
  parentId        varchar   [ref: > tenant.feed_comments.id, note: 'null = top-level comment; delete: no action']
  createdAt       timestamp [default: `now()`]

  indexes {
    postId
    parentId
  }
}

// Per-residence document store. Supports a folder tree via parentId self-reference.
// uploadedBy → public.profiles.id is tenant → public, enforced by Postgres.
// Access control is in tenant.document_access (separate from authorship).
Table tenant.documents {
  id          varchar         [pk]
  type        DocumentRowType [not null]
  parentId    varchar         [ref: > tenant.documents.id, note: 'null = root; delete: cascade']
  name        varchar         [not null]
  path        varchar         [note: 'null for folders; required for files']
  size        integer         [note: 'bytes; null for folders']
  residenceId varchar         [not null, ref: > tenant.residences.id]
  uploadedBy  varchar         [not null, ref: > public.profiles.id, note: 'tenant → public; enforced by Postgres']
  uploadedAt  timestamp       [default: `now()`]
  updatedAt   timestamp

  indexes {
    (name, parentId) [unique]
  }
}

Table tenant.document_access {
  id          varchar        [pk]
  docId       varchar        [not null, ref: > tenant.documents.id]
  apartmentId varchar        [not null, ref: > tenant.apartments.id]
  accessLevel DocAccessLevel [not null]
}
