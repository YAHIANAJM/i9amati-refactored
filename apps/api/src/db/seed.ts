/**
 * Seed script — creates dev users for local development.
 * Run: npm --workspace apps/api run db:seed
 *
 * Seeded accounts:
 *   admin@i9amati.com   / Admin@1234   (platform SUDO)
 *   syndic@i9amati.com  / Syndic@1234  (SYNDIC of Résidence Atlas)
 */
import 'dotenv/config'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { randomUUID, randomBytes, scrypt } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

// Matches Better Auth's @better-auth/utils hashPassword exactly
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const key = await scryptAsync(password.normalize('NFKC'), salt, 64, {
    N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2,
  }) as Buffer
  return `${salt}:${key.toString('hex')}`
}

const db = new Kysely<any>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: process.env.DATABASE_URL }),
  }),
})

async function createUser(opts: {
  email: string
  password: string
  name: string
  firstName: string
  lastName: string
  platformRole: string
  role?: string
}) {
  const now = new Date()

  const existing = await db
    .selectFrom('user')
    .select('id')
    .where('email', '=', opts.email)
    .executeTakeFirst()

  if (existing) {
    console.log(`  ↳ ${opts.email} already exists — skipping.`)
    return existing.id as string
  }

  const userId       = randomUUID()
  const passwordHash = await hashPassword(opts.password)

  await db.insertInto('user').values({
    id:             userId,
    name:           opts.name,
    email:          opts.email,
    emailVerified:  true,
    firstName:      opts.firstName,
    lastName:       opts.lastName,
    platformRole:   opts.platformRole,
    role:           opts.role ?? null,
    createdAt:      now,
    updatedAt:      now,
  }).execute()

  await db.insertInto('account').values({
    id:          randomUUID(),
    accountId:   userId,          // BA: provider-side account ID
    providerId:  'credential',
    userId:      userId,
    password:    passwordHash,
    createdAt:   now,
    updatedAt:   now,
  }).execute()

  return userId
}

async function seed() {
  const now = new Date()
  console.log('Seeding dev accounts...\n')

  // ── Admin ──────────────────────────────────────────────────────────────────
  await createUser({
    email:        'admin@i9amati.com',
    password:     'Admin@1234',
    name:         'Admin I9amati',
    firstName:    'Admin',
    lastName:     'I9amati',
    platformRole: 'SUDO',
    role:         'admin',
  })
  console.log('✓ Admin          admin@i9amati.com  /  Admin@1234')

  // ── Syndic ─────────────────────────────────────────────────────────────────
  const syndicId = await createUser({
    email:        'syndic@i9amati.com',
    password:     'Syndic@1234',
    name:         'Ayman Chabbaki',
    firstName:    'Ayman',
    lastName:     'Chabbaki',
    platformRole: 'USER',
  })
  console.log('✓ Syndic         syndic@i9amati.com  /  Syndic@1234')

  // ── Organisation + Profile for syndic ─────────────────────────────────────
  const existingOrg = await db
    .selectFrom('organizations')
    .select('id')
    .where('slug', '=', 'residence-atlas')
    .executeTakeFirst()

  let orgId: string

  if (existingOrg) {
    orgId = existingOrg.id
    console.log('  ↳ Organisation already exists — skipping.')
  } else {
    orgId = randomUUID()
    await db.insertInto('organizations').values({
      id:         orgId,
      name:       'Résidence Atlas',
      slug:       'residence-atlas',
      created_at: now,
      updated_at: now,
    }).execute()
    console.log('✓ Organisation   Résidence Atlas  (slug: residence-atlas)')
  }

  const existingProfile = await db
    .selectFrom('profiles')
    .select('id')
    .where('user_id', '=', syndicId)
    .where('organization_id', '=', orgId)
    .executeTakeFirst()

  if (!existingProfile) {
    await db.insertInto('profiles').values({
      id:              randomUUID(),
      user_id:         syndicId,
      organization_id: orgId,
      role:            'SYNDIC',
      created_at:      now,
      updated_at:      now,
    }).execute()
    console.log('✓ Profile        Ayman Chabbaki → SYNDIC of Résidence Atlas')
  }

  console.log('\nDone.')
}

seed()
  .catch(err => { console.error('\nSeed failed:', err); process.exit(1) })
  .finally(() => db.destroy())
