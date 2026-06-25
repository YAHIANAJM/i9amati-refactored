import { Router, Request } from 'express'
import { sql } from 'kysely'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import type { AuthRequest, TenantDB } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { db } from '../db/db'
import { defineFeedAbility, subject } from '../lib/ability'
import type { MembershipInfo } from '../lib/ability'
import { ProfileRole } from '@i9amati/shared'

const router = Router()
router.use(authenticate)

// ── DB helpers ────────────────────────────────────────────────────────────────

async function getMemberships(tenantDb: TenantDB, profileId: string): Promise<MembershipInfo[]> {
  const rows = await tenantDb
    .selectFrom('_profile_groups')
    .select(['id', 'group_id', 'role'])
    .where('profile_id', '=', profileId)
    .execute()
  return rows.map(r => ({
    profileGroupId: r.id,
    groupId:        r.group_id,
    role:           r.role as MembershipInfo['role'],
  }))
}

async function getPostWithGroup(tenantDb: TenantDB, postId: string) {
  return tenantDb
    .selectFrom('feed_posts as fp')
    .innerJoin('_profile_groups as pg', 'fp.author_id', 'pg.id')
    .where('fp.id', '=', postId)
    .select(['fp.id', 'fp.content', 'fp.media_url', 'fp.media_type', 'fp.author_id', 'fp.created_at', 'fp.updated_at',
             'pg.group_id', 'pg.profile_id as author_profile_id'])
    .executeTakeFirst()
}

async function getCommentWithGroup(tenantDb: TenantDB, commentId: string) {
  return tenantDb
    .selectFrom('feed_comments as fc')
    .innerJoin('feed_posts as fp', 'fc.post_id', 'fp.id')
    .innerJoin('_profile_groups as pg', 'fp.author_id', 'pg.id')
    .where('fc.id', '=', commentId)
    .select(['fc.id', 'fc.content', 'fc.author_profile_id', 'fc.post_id',
             'fc.parent_id', 'fc.created_at', 'pg.group_id'])
    .executeTakeFirst()
}

// Ensures SYNDIC always has a _profile_groups row — needed because feed_posts.author_id
// is an FK to _profile_groups.id, so even SYNDIC must be a formal member to post.
async function ensureSyndicMembership(
  tenantDb: TenantDB,
  profileId: string,
  groupId: string,
): Promise<string> {
  const existing = await tenantDb
    .selectFrom('_profile_groups')
    .select('id')
    .where('profile_id', '=', profileId)
    .where('group_id',   '=', groupId)
    .executeTakeFirst()
  if (existing) return existing.id

  const id = crypto.randomUUID()
  await tenantDb
    .insertInto('_profile_groups')
    .values({ id, group_id: groupId, profile_id: profileId, role: 'ADMIN' })
    .execute()
  return id
}

// ── GET /feed/groups ──────────────────────────────────────────────────────────

router.get('/groups', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId, profileRole } = req as AuthRequest

    // SYNDIC is always a member of every group — ensure their _profile_groups rows exist
    // for all groups before the main query (bulk-insert any missing rows in one shot).
    if (profileRole === ProfileRole.SYNDIC) {
      const [allGroupIds, existingPgGroupIds] = await Promise.all([
        tenantDb.selectFrom('groups').select('id').execute().then(rs => rs.map(r => r.id)),
        tenantDb
          .selectFrom('_profile_groups')
          .select('group_id')
          .where('profile_id', '=', profileId)
          .execute()
          .then(rs => new Set(rs.map(r => r.group_id))),
      ])
      const missing = allGroupIds.filter(gid => !existingPgGroupIds.has(gid))
      if (missing.length > 0) {
        await tenantDb
          .insertInto('_profile_groups')
          .values(missing.map(groupId => ({
            id:         crypto.randomUUID(),
            group_id:   groupId,
            profile_id: profileId,
            role:       'ADMIN' as const,
          })))
          .execute()
      }
    }

    // Single query: count all members per group via LEFT JOIN on pg,
    // plus the current user's own membership row via a separate aliased join.
    // SYNDIC: rows guaranteed above so innerJoin; others: innerJoin scopes to their groups.
    const groups = profileRole === ProfileRole.SYNDIC
      ? await tenantDb
          .selectFrom('groups as g')
          .leftJoin('_profile_groups as pg', 'pg.group_id', 'g.id')
          .innerJoin('_profile_groups as my_pg', join =>
            join.onRef('my_pg.group_id', '=', 'g.id').on('my_pg.profile_id', '=', profileId),
          )
          .groupBy(['g.id', 'my_pg.id', 'my_pg.role'])
          .select([
            'g.id', 'g.name', 'g.slug', 'g.residence_id', 'g.building_id', 'g.created_at',
            'my_pg.role as memberRole',
            'my_pg.id as memberProfileGroupId',
            sql<string>`count(pg.id)`.as('memberCount'),
          ])
          .orderBy('g.created_at', 'asc')
          .execute()
      : await tenantDb
          .selectFrom('groups as g')
          .innerJoin('_profile_groups as my_pg', join =>
            join.onRef('my_pg.group_id', '=', 'g.id').on('my_pg.profile_id', '=', profileId),
          )
          .leftJoin('_profile_groups as pg', 'pg.group_id', 'g.id')
          .groupBy(['g.id', 'my_pg.id', 'my_pg.role'])
          .select([
            'g.id', 'g.name', 'g.slug', 'g.residence_id', 'g.building_id', 'g.created_at',
            'my_pg.role as memberRole',
            'my_pg.id as memberProfileGroupId',
            sql<string>`count(pg.id)`.as('memberCount'),
          ])
          .orderBy('g.created_at', 'asc')
          .execute()

    res.json({ groups, profileId, profileRole })
  } catch (err) { next(err) }
})

// ── POST /feed/groups ─────────────────────────────────────────────────────────

const CreateGroupSchema = z.object({
  name:        z.string().min(1).max(120),
  residenceId: z.string().uuid().optional(),
  buildingId:  z.string().uuid().optional(),
}).refine(d => !(d.residenceId && d.buildingId), {
  message: 'A group can be linked to a residence OR a building, not both',
})

router.post('/groups', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId, profileRole } = req as AuthRequest
    const memberships = await getMemberships(tenantDb, profileId)
    const ability     = defineFeedAbility(profileRole, profileId, memberships)
    if (ability.cannot('create', 'Group')) throw new AppError(403, 'Forbidden')

    const { name, residenceId, buildingId } = CreateGroupSchema.parse(req.body)

    // Generate a unique slug: lowercase name + random suffix
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const slug = `${base}-${crypto.randomUUID().slice(0, 6)}`

    const id = crypto.randomUUID()
    await tenantDb
      .insertInto('groups')
      .values({
        id,
        name,
        slug,
        residence_id: residenceId ?? null,
        building_id:  buildingId  ?? null,
        updated_at:   new Date(),
      })
      .execute()

    // All SYNDIC profiles are always ADMIN members of every group — auto-add them on creation.
    const { activeOrganizationId } = req as AuthRequest
    const syndicProfiles = await db
      .selectFrom('public.profiles')
      .select('id')
      .where('organization_id', '=', activeOrganizationId)
      .where('role', '=', ProfileRole.SYNDIC)
      .execute()

    if (syndicProfiles.length > 0) {
      await tenantDb
        .insertInto('_profile_groups')
        .values(syndicProfiles.map(p => ({
          id:         crypto.randomUUID(),
          group_id:   id,
          profile_id: p.id,
          role:       'ADMIN' as const,
        })))
        .execute()
    }

    res.status(201).json({ id, slug })
  } catch (err) { next(err) }
})

// ── PATCH /feed/groups/:groupId ───────────────────────────────────────────────

const UpdateGroupSchema = z.object({ name: z.string().min(1).max(120) })

router.patch('/groups/:groupId', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId, profileRole } = req as AuthRequest
    const { groupId } = req.params
    const memberships = await getMemberships(tenantDb, profileId)
    const ability     = defineFeedAbility(profileRole, profileId, memberships)
    if (ability.cannot('update', 'Group')) throw new AppError(403, 'Forbidden')

    const { name } = UpdateGroupSchema.parse(req.body)

    const group = await tenantDb
      .selectFrom('groups').select('id').where('id', '=', groupId).executeTakeFirst()
    if (!group) throw new AppError(404, 'Group not found')

    await tenantDb
      .updateTable('groups')
      .set({ name, updated_at: new Date() })
      .where('id', '=', groupId)
      .execute()

    res.json({ id: groupId })
  } catch (err) { next(err) }
})

// ── DELETE /feed/groups/:groupId ──────────────────────────────────────────────

router.delete('/groups/:groupId', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId, profileRole } = req as AuthRequest
    const { groupId } = req.params
    const memberships = await getMemberships(tenantDb, profileId)
    const ability     = defineFeedAbility(profileRole, profileId, memberships)
    if (ability.cannot('delete', 'Group')) throw new AppError(403, 'Forbidden')

    const group = await tenantDb
      .selectFrom('groups').select('id').where('id', '=', groupId).executeTakeFirst()
    if (!group) throw new AppError(404, 'Group not found')

    // _profile_groups rows are deleted first to avoid FK violation from feed_posts
    // (feed_posts.author_id → _profile_groups.id). Feed posts/comments/likes have
    // no direct FK to groups, so we delete in order:
    // 1. feed_post_likes (cascade would cover, but be explicit)
    // 2. feed_comments (cascade from feed_posts)
    // 3. feed_posts via author_id in this group's _profile_groups
    // 4. _profile_groups
    // 5. groups

    const pgIds = await tenantDb
      .selectFrom('_profile_groups')
      .select('id')
      .where('group_id', '=', groupId)
      .execute()
    const pgIdList = pgIds.map(r => r.id)

    if (pgIdList.length > 0) {
      // Delete likes → posts (comments cascade from posts FK)
      const postIds = await tenantDb
        .selectFrom('feed_posts')
        .select('id')
        .where('author_id', 'in', pgIdList)
        .execute()
      const postIdList = postIds.map(p => p.id)

      if (postIdList.length > 0) {
        await tenantDb.deleteFrom('feed_post_likes').where('post_id', 'in', postIdList).execute()
        await tenantDb.deleteFrom('feed_comments').where('post_id', 'in', postIdList).execute()
        await tenantDb.deleteFrom('feed_posts').where('id', 'in', postIdList).execute()
      }
      await tenantDb.deleteFrom('_profile_groups').where('group_id', '=', groupId).execute()
    }

    await tenantDb.deleteFrom('groups').where('id', '=', groupId).execute()

    res.status(204).send()
  } catch (err) { next(err) }
})

// ── GET /feed/groups/:groupId/members ─────────────────────────────────────────

router.get('/groups/:groupId/members', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId, profileRole } = req as AuthRequest
    const { groupId } = req.params

    // SYNDIC must always be a member — ensure their row exists before we read members.
    // This guards against the case where the page was served from cache and the
    // bulk-ensure in GET /groups never ran in the current session.
    if (profileRole === ProfileRole.SYNDIC) {
      await ensureSyndicMembership(tenantDb, profileId, groupId)
    }

    const memberships = await getMemberships(tenantDb, profileId)
    const ability     = defineFeedAbility(profileRole, profileId, memberships)
    if (ability.cannot('read', subject('GroupMember', { groupId }))) throw new AppError(403, 'Forbidden')

    const pgRows = await tenantDb
      .selectFrom('_profile_groups')
      .where('group_id', '=', groupId)
      .select(['id', 'profile_id', 'role'])
      .execute()

    if (pgRows.length === 0) return res.json({ members: [] })

    const profileIds = pgRows.map(r => r.profile_id)
    const profileRows = await db
      .selectFrom('public.profiles as prof')
      .innerJoin('public.user as u', 'prof.user_id', 'u.id')
      .where('prof.id', 'in', profileIds)
      .select(['prof.id as profile_id', 'u.name', 'u.image', 'prof.role as orgRole'])
      .execute()

    const profileMap = Object.fromEntries(profileRows.map(p => [p.profile_id, p]))

    res.json({
      members: pgRows.map(pg => ({
        membershipId: pg.id,
        profileId:    pg.profile_id,
        groupRole:    pg.role,
        name:         profileMap[pg.profile_id]?.name   ?? null,
        avatar:       profileMap[pg.profile_id]?.image  ?? null,
        orgRole:      profileMap[pg.profile_id]?.orgRole ?? null,
      })),
    })
  } catch (err) { next(err) }
})

// ── POST /feed/groups/:groupId/members ────────────────────────────────────────

const AddMemberSchema = z.object({ profileId: z.string().uuid() })

router.post('/groups/:groupId/members', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId: requesterId, profileRole } = req as AuthRequest
    const { groupId } = req.params
    const { profileId: targetProfileId } = AddMemberSchema.parse(req.body)

    const memberships = await getMemberships(tenantDb, requesterId)
    const ability     = defineFeedAbility(profileRole, requesterId, memberships)
    if (ability.cannot('create', subject('GroupMember', { groupId }))) throw new AppError(403, 'Forbidden')

    const existing = await tenantDb
      .selectFrom('_profile_groups')
      .select('id')
      .where('group_id', '=', groupId)
      .where('profile_id', '=', targetProfileId)
      .executeTakeFirst()

    if (existing) return res.status(200).json({ membershipId: existing.id })

    const id = crypto.randomUUID()
    await tenantDb
      .insertInto('_profile_groups')
      .values({ id, group_id: groupId, profile_id: targetProfileId, role: 'USER' })
      .execute()

    res.status(201).json({ membershipId: id })
  } catch (err) { next(err) }
})

// ── DELETE /feed/groups/:groupId/members/:profileId ───────────────────────────

router.delete('/groups/:groupId/members/:profileId', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId: requesterId, profileRole } = req as AuthRequest
    const { groupId, profileId: targetProfileId } = req.params

    const memberships = await getMemberships(tenantDb, requesterId)
    const ability     = defineFeedAbility(profileRole, requesterId, memberships)
    if (ability.cannot('delete', subject('GroupMember', { groupId }))) throw new AppError(403, 'Forbidden')

    await tenantDb
      .deleteFrom('_profile_groups')
      .where('group_id', '=', groupId)
      .where('profile_id', '=', targetProfileId)
      .execute()

    res.status(204).send()
  } catch (err) { next(err) }
})

// ── GET /feed/groups/:groupId/posts ───────────────────────────────────────────

router.get('/groups/:groupId/posts', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId, profileRole } = req as AuthRequest
    const { groupId } = req.params
    const limit  = Math.min(Number(req.query.limit) || 20, 50)
    const cursor = req.query.cursor as string | undefined

    const memberships = await getMemberships(tenantDb, profileId)
    const ability     = defineFeedAbility(profileRole, profileId, memberships)

    if (ability.cannot('read', subject('FeedPost', { groupId, authorId: '' }))) {
      throw new AppError(403, 'Forbidden')
    }

    let postsQuery = tenantDb
      .selectFrom('feed_posts as fp')
      .innerJoin('_profile_groups as pg', 'fp.author_id', 'pg.id')
      .where('pg.group_id', '=', groupId)
      .select(['fp.id', 'fp.content', 'fp.media_url', 'fp.media_type', 'fp.author_id', 'fp.created_at', 'fp.updated_at',
               'pg.profile_id as author_profile_id', 'pg.role as author_group_role'])
      .orderBy('fp.created_at', 'desc')
      .limit(limit + 1)

    if (cursor) {
      const cursorPost = await tenantDb
        .selectFrom('feed_posts')
        .select('created_at')
        .where('id', '=', cursor)
        .executeTakeFirst()
      if (cursorPost) {
        postsQuery = postsQuery.where('fp.created_at', '<', cursorPost.created_at)
      }
    }

    const rows    = await postsQuery.execute()
    const hasMore = rows.length > limit
    const posts   = hasMore ? rows.slice(0, -1) : rows

    if (posts.length === 0) return res.json({ posts: [], hasMore: false, nextCursor: null })

    const postIds          = posts.map(p => p.id)
    const authorProfileIds = [...new Set(posts.map(p => p.author_profile_id))]
    const myPGIds          = memberships.map(m => m.profileGroupId)

    // Parallel: like counts, my likes, comment counts, author names
    const [likeCounts, myLikes, commentCounts, authorRows] = await Promise.all([
      tenantDb
        .selectFrom('feed_post_likes')
        .where('post_id', 'in', postIds)
        .select(['post_id', sql<string>`count(*)`.as('count')])
        .groupBy('post_id')
        .execute(),

      myPGIds.length > 0
        ? tenantDb
            .selectFrom('feed_post_likes')
            .select('post_id')
            .where('post_id', 'in', postIds)
            .where('profile_group_id', 'in', myPGIds)
            .execute()
        : Promise.resolve([]),

      tenantDb
        .selectFrom('feed_comments')
        .where('post_id', 'in', postIds)
        .select(['post_id', sql<string>`count(*)`.as('count')])
        .groupBy('post_id')
        .execute(),

      db
        .selectFrom('public.profiles as prof')
        .innerJoin('public.user as u', 'prof.user_id', 'u.id')
        .where('prof.id', 'in', authorProfileIds)
        .select(['prof.id as profile_id', 'u.name', 'u.image'])
        .execute(),
    ])

    const authorMap  = Object.fromEntries(authorRows.map(a => [a.profile_id, a]))
    const likeMap    = Object.fromEntries(likeCounts.map(l => [l.post_id, Number(l.count)]))
    const commentMap = Object.fromEntries(commentCounts.map(c => [c.post_id, Number(c.count)]))
    const likedSet   = new Set(myLikes.map(l => l.post_id))

    res.json({
      posts: posts.map(p => ({
        id:              p.id,
        content:         p.content,
        mediaUrl:        p.media_url,
        mediaType:       p.media_type,
        createdAt:       p.created_at,
        updatedAt:       p.updated_at,
        authorId:        p.author_id,
        authorProfileId: p.author_profile_id,
        authorGroupRole: p.author_group_role,
        authorName:      authorMap[p.author_profile_id]?.name   ?? null,
        authorAvatar:    authorMap[p.author_profile_id]?.image  ?? null,
        likeCount:       likeMap[p.id]    ?? 0,
        likedByMe:       likedSet.has(p.id),
        commentCount:    commentMap[p.id] ?? 0,
      })),
      hasMore,
      nextCursor: hasMore ? posts.at(-1)!.id : null,
    })
  } catch (err) { next(err) }
})

// ── POST /feed/groups/:groupId/posts ──────────────────────────────────────────

const CreatePostSchema = z.object({
  content: z.string().min(1).max(5000),
  mediaUrl: z.string().url().max(1000).optional(),
  mediaType: z.enum(['image', 'video']).optional(),
})

router.post('/groups/:groupId/posts', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId, profileRole } = req as AuthRequest
    const { groupId } = req.params
    const { content, mediaUrl, mediaType } = CreatePostSchema.parse(req.body)

    const memberships = await getMemberships(tenantDb, profileId)
    const ability     = defineFeedAbility(profileRole, profileId, memberships)

    if (ability.cannot('create', subject('FeedPost', { groupId, authorId: '' }))) {
      throw new AppError(403, 'Forbidden')
    }

    const profileGroupId =
      profileRole === ProfileRole.SYNDIC
        ? await ensureSyndicMembership(tenantDb, profileId, groupId)
        : memberships.find(m => m.groupId === groupId)?.profileGroupId

    if (!profileGroupId) throw new AppError(400, 'Not a member of this group')

    const id = crypto.randomUUID()
    await tenantDb
      .insertInto('feed_posts')
      .values({
        id, content,
        media_url: mediaUrl ?? null,
        media_type: mediaType ?? null,
        author_id: profileGroupId,
        updated_at: new Date()
      })
      .execute()

    res.status(201).json({ id })
  } catch (err) { next(err) }
})

// ── PATCH /feed/posts/:postId ─────────────────────────────────────────────────

const UpdatePostSchema = z.object({
  content: z.string().min(1).max(5000),
  mediaUrl: z.string().url().max(1000).optional().nullable(),
  mediaType: z.enum(['image', 'video']).optional().nullable(),
})

router.patch('/posts/:postId', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId, profileRole } = req as AuthRequest
    const { postId } = req.params
    const { content, mediaUrl, mediaType } = UpdatePostSchema.parse(req.body)

    const post = await getPostWithGroup(tenantDb, postId)
    if (!post) throw new AppError(404, 'Post not found')

    const memberships = await getMemberships(tenantDb, profileId)
    const ability     = defineFeedAbility(profileRole, profileId, memberships)

    if (ability.cannot('update', subject('FeedPost', { groupId: post.group_id, authorId: post.author_id }))) {
      throw new AppError(403, 'Forbidden')
    }

    await tenantDb
      .updateTable('feed_posts')
      .set({
        content,
        ...(mediaUrl !== undefined && { media_url: mediaUrl }),
        ...(mediaType !== undefined && { media_type: mediaType }),
        updated_at: new Date()
      })
      .where('id', '=', postId)
      .execute()

    res.json({ id: postId })
  } catch (err) { next(err) }
})

// ── DELETE /feed/posts/:postId ────────────────────────────────────────────────

router.delete('/posts/:postId', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId, profileRole } = req as AuthRequest
    const { postId } = req.params

    const post = await getPostWithGroup(tenantDb, postId)
    if (!post) throw new AppError(404, 'Post not found')

    const memberships = await getMemberships(tenantDb, profileId)
    const ability     = defineFeedAbility(profileRole, profileId, memberships)

    if (ability.cannot('delete', subject('FeedPost', { groupId: post.group_id, authorId: post.author_id }))) {
      throw new AppError(403, 'Forbidden')
    }

    // feed_post_likes and feed_comments cascade-delete via FK ON DELETE CASCADE
    await tenantDb.deleteFrom('feed_posts').where('id', '=', postId).execute()

    res.status(204).send()
  } catch (err) { next(err) }
})

// ── GET /feed/posts/:postId/comments ─────────────────────────────────────────

router.get('/posts/:postId/comments', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId, profileRole } = req as AuthRequest
    const { postId } = req.params

    const post = await getPostWithGroup(tenantDb, postId)
    if (!post) throw new AppError(404, 'Post not found')

    const memberships = await getMemberships(tenantDb, profileId)
    const ability     = defineFeedAbility(profileRole, profileId, memberships)

    if (ability.cannot('read', subject('FeedComment', { groupId: post.group_id, authorProfileId: '' }))) {
      throw new AppError(403, 'Forbidden')
    }

    const comments = await tenantDb
      .selectFrom('feed_comments')
      .selectAll()
      .where('post_id', '=', postId)
      .orderBy('created_at', 'asc')
      .execute()

    if (comments.length === 0) return res.json({ comments: [] })

    const authorProfileIds = [...new Set(comments.map(c => c.author_profile_id))]
    const authorRows = await db
      .selectFrom('public.profiles as prof')
      .innerJoin('public.user as u', 'prof.user_id', 'u.id')
      .where('prof.id', 'in', authorProfileIds)
      .select(['prof.id as profile_id', 'u.name', 'u.image'])
      .execute()

    const authorMap = Object.fromEntries(authorRows.map(a => [a.profile_id, a]))

    res.json({
      comments: comments.map(c => ({
        id:              c.id,
        content:         c.content,
        postId:          c.post_id,
        parentId:        c.parent_id,
        authorProfileId: c.author_profile_id,
        authorName:      authorMap[c.author_profile_id]?.name  ?? null,
        authorAvatar:    authorMap[c.author_profile_id]?.image ?? null,
        createdAt:       c.created_at,
      })),
    })
  } catch (err) { next(err) }
})

// ── POST /feed/posts/:postId/comments ────────────────────────────────────────

const CreateCommentSchema = z.object({
  content:  z.string().min(1).max(2000),
  parentId: z.string().uuid().optional(),
})

router.post('/posts/:postId/comments', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId, profileRole } = req as AuthRequest
    const { postId } = req.params
    const { content, parentId } = CreateCommentSchema.parse(req.body)

    const post = await getPostWithGroup(tenantDb, postId)
    if (!post) throw new AppError(404, 'Post not found')

    const memberships = await getMemberships(tenantDb, profileId)
    const ability     = defineFeedAbility(profileRole, profileId, memberships)

    if (ability.cannot('create', subject('FeedComment', { groupId: post.group_id, authorProfileId: profileId }))) {
      throw new AppError(403, 'Forbidden')
    }

    if (parentId) {
      const parent = await tenantDb
        .selectFrom('feed_comments')
        .select('id')
        .where('id', '=', parentId)
        .where('post_id', '=', postId)
        .executeTakeFirst()
      if (!parent) throw new AppError(400, 'Parent comment not found in this post')
    }

    const id = crypto.randomUUID()
    await tenantDb
      .insertInto('feed_comments')
      .values({ id, content, author_profile_id: profileId, post_id: postId, parent_id: parentId ?? null })
      .execute()

    res.status(201).json({ id })
  } catch (err) { next(err) }
})

// ── PATCH /feed/comments/:commentId ──────────────────────────────────────────

const UpdateCommentSchema = z.object({ content: z.string().min(1).max(2000) })

router.patch('/comments/:commentId', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId, profileRole } = req as AuthRequest
    const { commentId } = req.params
    const { content } = UpdateCommentSchema.parse(req.body)

    const comment = await getCommentWithGroup(tenantDb, commentId)
    if (!comment) throw new AppError(404, 'Comment not found')

    const memberships = await getMemberships(tenantDb, profileId)
    const ability     = defineFeedAbility(profileRole, profileId, memberships)

    if (ability.cannot('update', subject('FeedComment', { groupId: comment.group_id, authorProfileId: comment.author_profile_id }))) {
      throw new AppError(403, 'Forbidden')
    }

    await tenantDb
      .updateTable('feed_comments')
      .set({ content })
      .where('id', '=', commentId)
      .execute()

    res.json({ id: commentId })
  } catch (err) { next(err) }
})

// ── DELETE /feed/comments/:commentId ─────────────────────────────────────────

router.delete('/comments/:commentId', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId, profileRole } = req as AuthRequest
    const { commentId } = req.params

    const comment = await getCommentWithGroup(tenantDb, commentId)
    if (!comment) throw new AppError(404, 'Comment not found')

    const memberships = await getMemberships(tenantDb, profileId)
    const ability     = defineFeedAbility(profileRole, profileId, memberships)

    if (ability.cannot('delete', subject('FeedComment', { groupId: comment.group_id, authorProfileId: comment.author_profile_id }))) {
      throw new AppError(403, 'Forbidden')
    }

    await tenantDb.deleteFrom('feed_comments').where('id', '=', commentId).execute()
    res.status(204).send()
  } catch (err) { next(err) }
})

// ── POST /feed/posts/:postId/like ─────────────────────────────────────────────
// Idempotent — returns 200 if already liked, 201 if newly liked.

router.post('/posts/:postId/like', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId, profileRole } = req as AuthRequest
    const { postId } = req.params

    const post = await getPostWithGroup(tenantDb, postId)
    if (!post) throw new AppError(404, 'Post not found')

    const memberships = await getMemberships(tenantDb, profileId)
    const ability     = defineFeedAbility(profileRole, profileId, memberships)

    if (ability.cannot('create', subject('FeedPostLike', { groupId: post.group_id }))) {
      throw new AppError(403, 'Forbidden')
    }

    const profileGroupId =
      profileRole === ProfileRole.SYNDIC
        ? await ensureSyndicMembership(tenantDb, profileId, post.group_id)
        : memberships.find(m => m.groupId === post.group_id)?.profileGroupId

    if (!profileGroupId) throw new AppError(400, 'Not a member of this group')

    const existing = await tenantDb
      .selectFrom('feed_post_likes')
      .select('id')
      .where('post_id', '=', postId)
      .where('profile_group_id', '=', profileGroupId)
      .executeTakeFirst()

    if (existing) return res.status(200).json({ liked: true })

    await tenantDb
      .insertInto('feed_post_likes')
      .values({ id: crypto.randomUUID(), post_id: postId, profile_group_id: profileGroupId })
      .execute()

    res.status(201).json({ liked: true })
  } catch (err) { next(err) }
})

// ── DELETE /feed/posts/:postId/like ──────────────────────────────────────────

router.delete('/posts/:postId/like', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId, profileRole } = req as AuthRequest
    const { postId } = req.params

    const post = await getPostWithGroup(tenantDb, postId)
    if (!post) throw new AppError(404, 'Post not found')

    const memberships = await getMemberships(tenantDb, profileId)
    const ability     = defineFeedAbility(profileRole, profileId, memberships)

    if (ability.cannot('delete', subject('FeedPostLike', { groupId: post.group_id }))) {
      throw new AppError(403, 'Forbidden')
    }

    const membership = memberships.find(m => m.groupId === post.group_id)
    if (!membership) throw new AppError(400, 'Not a member of this group')

    await tenantDb
      .deleteFrom('feed_post_likes')
      .where('post_id', '=', postId)
      .where('profile_group_id', '=', membership.profileGroupId)
      .execute()

    res.status(204).send()
  } catch (err) { next(err) }
})

// ── GET /feed/org-profiles ────────────────────────────────────────────────────
// Returns all profiles in this org — used by the member picker when adding members to a group.

router.get('/org-profiles', async (req: Request, res, next) => {
  try {
    const { activeOrganizationId } = req as AuthRequest

    const profiles = await db
      .selectFrom('public.profiles as prof')
      .innerJoin('public.user as u', 'prof.user_id', 'u.id')
      .where('prof.organization_id', '=', activeOrganizationId)
      .select(['prof.id as profileId', 'u.name', 'u.image', 'prof.role as orgRole'])
      .orderBy('u.name', 'asc')
      .execute()

    res.json({ profiles })
  } catch (err) { next(err) }
})

export default router
