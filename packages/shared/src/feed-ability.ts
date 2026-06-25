import { AbilityBuilder, createMongoAbility } from '@casl/ability'
import type { MongoAbility, ForcedSubject } from '@casl/ability'
import { ProfileRole } from './permissions'

export { subject } from '@casl/ability'

// ── Subject shapes ────────────────────────────────────────────────────────────

type FeedPostAttrs    = { groupId: string; authorId: string }
type FeedCommentAttrs = { groupId: string; authorProfileId: string }
type FeedLikeAttrs    = { groupId: string }
type GroupMemberAttrs = { groupId: string }

export type TaggedFeedPost    = FeedPostAttrs    & ForcedSubject<'FeedPost'>
export type TaggedFeedComment = FeedCommentAttrs & ForcedSubject<'FeedComment'>
export type TaggedFeedLike    = FeedLikeAttrs    & ForcedSubject<'FeedPostLike'>
export type TaggedGroupMember = GroupMemberAttrs & ForcedSubject<'GroupMember'>

type Actions  = 'create' | 'read' | 'update' | 'delete' | 'manage'
type Subjects =
  | 'FeedPost'     | TaggedFeedPost
  | 'FeedComment'  | TaggedFeedComment
  | 'FeedPostLike' | TaggedFeedLike
  | 'Group'
  | 'GroupMember'  | TaggedGroupMember
  | 'FeedAnalytics'  // read: SYNDIC only (covered by manage all)
  | 'all'

export type FeedAbility = MongoAbility<[Actions, Subjects]>

export type MembershipInfo = {
  profileGroupId: string  // _profile_groups.id  (author_id on posts, profile_group_id on likes)
  groupId: string
  role: 'USER' | 'ADMIN' | 'RIGHT_HAND'
}

// ── Ability builder ────────────────────────────────────────────────────────────

export function defineFeedAbility(
  profileRole: ProfileRole,
  profileId: string,
  memberships: MembershipInfo[],
): FeedAbility {
  const { can, build } = new AbilityBuilder<FeedAbility>(createMongoAbility)

  const allGroupIds   = memberships.map(m => m.groupId)
  const adminGroupIds = memberships.filter(m => m.role === 'ADMIN').map(m => m.groupId)
  const ownPGIds      = memberships.map(m => m.profileGroupId)
  const isRightHand   = memberships.some(m => m.role === 'RIGHT_HAND')

  // ── SYNDIC: unrestricted tenant admin ──────────────────────────────────────
  if (profileRole === ProfileRole.SYNDIC) {
    can('manage', 'all')
    return build()
  }

  // ── RIGHT_HAND: syndic-level content powers, no Group management ──────────
  if (isRightHand) {
    can('manage', 'FeedPost')
    can('manage', 'FeedComment')
    can('manage', 'FeedPostLike')
    return build()
  }

  // ── STAFF: outside the residence — read-only where enrolled ───────────────
  if (profileRole === ProfileRole.STAFF) {
    if (allGroupIds.length > 0) {
      can<TaggedFeedPost>('read', 'FeedPost',    { groupId: { $in: allGroupIds } })
      can<TaggedFeedComment>('read', 'FeedComment', { groupId: { $in: allGroupIds } })
      can<TaggedGroupMember>('read', 'GroupMember', { groupId: { $in: allGroupIds } })
    }
    return build()
  }

  // ── OWNER / TENANT: base member rights in all their groups ────────────────
  if (allGroupIds.length > 0) {
    can<TaggedFeedPost>('read',   'FeedPost',    { groupId: { $in: allGroupIds } })
    can<TaggedFeedComment>('read',   'FeedComment', { groupId: { $in: allGroupIds } })
    can<TaggedGroupMember>('read',   'GroupMember', { groupId: { $in: allGroupIds } })

    can<TaggedFeedPost>('create', 'FeedPost',    { groupId: { $in: allGroupIds } })
    can<TaggedFeedComment>('create', 'FeedComment', { groupId: { $in: allGroupIds } })

    // Own posts (authorId = their _profile_groups.id membership row)
    can<TaggedFeedPost>(['update', 'delete'], 'FeedPost',    { authorId: { $in: ownPGIds } })

    // Own comments (by public.profiles.id)
    can<TaggedFeedComment>(['update', 'delete'], 'FeedComment', { authorProfileId: profileId })

    can<TaggedFeedLike>(['create', 'delete'], 'FeedPostLike', { groupId: { $in: allGroupIds } })
    can<TaggedFeedLike>('read',               'FeedPostLike', { groupId: { $in: allGroupIds } })
  }

  // ── Group ADMIN: moderate content + manage members in their groups ─────────
  if (adminGroupIds.length > 0) {
    can<TaggedFeedPost>(['update', 'delete'], 'FeedPost',    { groupId: { $in: adminGroupIds } })
    can<TaggedFeedComment>(['update', 'delete'], 'FeedComment', { groupId: { $in: adminGroupIds } })
    can<TaggedGroupMember>(['create', 'delete'], 'GroupMember', { groupId: { $in: adminGroupIds } })
  }

  return build()
}
