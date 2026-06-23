/**
 * Seed script — idempotent, safe to re-run.
 * Run: npm --workspace apps/api run db:seed
 *
 * Creates:
 *   admin@i9amati.com   / Admin@1234   (SUDO)
 *   syndic@i9amati.com  / Syndic@1234  (SYNDIC of Résidence Atlas)
 *   Org: Résidence Atlas  (slug: residence-atlas)
 *   Tenant schema: residence-atlas  (meetings, agenda_items, meeting_attendees)
 *   3 demo meetings with full data
 */
import 'dotenv/config'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { randomUUID, randomBytes, scryptSync } from 'crypto'
import { provisionTenant } from './provisionTenant'

const db = new Kysely<any>({
  dialect: new PostgresDialect({ pool: new Pool({ connectionString: process.env.DATABASE_URL }) }),
})

// Matches Better Auth's @better-auth/utils hashPassword exactly (scrypt, salt:hex)
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const key  = scryptSync(password.normalize('NFKC'), salt, 64, {
    N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2,
  }) as Buffer
  return `${salt}:${key.toString('hex')}`
}

async function upsertUser(opts: {
  email: string; password: string; name: string
  firstName: string; lastName: string; platformRole: string; role?: string
}): Promise<string> {
  const now = new Date()
  const existing = await db.selectFrom('user').select('id').where('email', '=', opts.email).executeTakeFirst()
  if (existing) { console.log(`  ↳ ${opts.email} already exists — skipping.`); return existing.id }

  const userId = randomUUID()
  await db.insertInto('user').values({
    id: userId, name: opts.name, email: opts.email,
    emailVerified: true, firstName: opts.firstName, lastName: opts.lastName,
    platformRole: opts.platformRole, role: opts.role ?? null, createdAt: now, updatedAt: now,
  }).execute()

  await db.insertInto('account').values({
    id: randomUUID(), accountId: userId, providerId: 'credential',
    userId, password: await hashPassword(opts.password), createdAt: now, updatedAt: now,
  }).execute()

  return userId
}

async function seed() {
  const now = new Date()

  // ── Users ──────────────────────────────────────────────────────────────────
  await upsertUser({ email: 'admin@i9amati.com', password: 'Admin@1234', name: 'Admin I9amati', firstName: 'Admin', lastName: 'I9amati', platformRole: 'SUDO', role: 'admin' })
  console.log('✓ admin@i9amati.com  /  Admin@1234')

  const syndicId = await upsertUser({ email: 'syndic@i9amati.com', password: 'Syndic@1234', name: 'Ayman Chabbaki', firstName: 'Ayman', lastName: 'Chabbaki', platformRole: 'USER' })
  console.log('✓ syndic@i9amati.com  /  Syndic@1234')

  // ── Organisation ───────────────────────────────────────────────────────────
  const ORG_SLUG = 'residence-atlas'
  let orgId: string
  const existingOrg = await db.selectFrom('organizations').select('id').where('slug', '=', ORG_SLUG).executeTakeFirst()
  if (existingOrg) {
    orgId = existingOrg.id
    console.log('  ↳ Organisation already exists.')
  } else {
    orgId = randomUUID()
    await db.insertInto('organizations').values({ id: orgId, name: 'Résidence Atlas', slug: ORG_SLUG, created_at: now, updated_at: now }).execute()
    console.log('✓ Organisation: Résidence Atlas (residence-atlas)')
  }

  // ── Profile ────────────────────────────────────────────────────────────────
  const existingProfile = await db.selectFrom('profiles').select('id').where('user_id', '=', syndicId).where('organization_id', '=', orgId).executeTakeFirst()
  let profileId: string
  if (existingProfile) {
    profileId = existingProfile.id
    console.log('  ↳ Profile already exists.')
  } else {
    profileId = randomUUID()
    await db.insertInto('profiles').values({ id: profileId, user_id: syndicId, organization_id: orgId, role: 'SYNDIC', created_at: now, updated_at: now }).execute()
    console.log(`✓ Profile: SYNDIC → Ayman Chabbaki`)
  }

  // ── Provision tenant schema ────────────────────────────────────────────────
  console.log(`\nProvisioning tenant schema "${ORG_SLUG}"...`)
  await provisionTenant(ORG_SLUG)
  console.log(`✓ Schema "${ORG_SLUG}" ready.`)

  const t = db.withSchema(ORG_SLUG) // tenant-scoped db

  // ── Residence ──────────────────────────────────────────────────────────────
  let residenceId: string
  const existingRes = await t.selectFrom('residences').select('id').where('name', '=', 'Résidence Atlas').executeTakeFirst()
  if (existingRes) {
    residenceId = existingRes.id
    console.log('  ↳ Residence already exists.')
  } else {
    residenceId = randomUUID()
    await t.insertInto('residences').values({ id: residenceId, name: 'Résidence Atlas', address: '12 Rue Ibn Batouta', city: 'Casablanca', status: 'ACTIVE', updated_at: now }).execute()
    console.log('✓ Residence: Résidence Atlas, Casablanca')
  }

  // ── Meetings ───────────────────────────────────────────────────────────────
  const existingMtg = await t.selectFrom('meetings').select('id').executeTakeFirst()
  if (existingMtg) { console.log('  ↳ Meetings already seeded — skipping.\n'); return }

  const ATTENDEES = [
    { name: 'Ahmed Alaoui',        apartment: 'Apt 1A' },
    { name: 'Fatima Benali',       apartment: 'Apt 1B' },
    { name: 'Youssef El Idrissi',  apartment: 'Apt 2A' },
    { name: 'Khadija Tazi',        apartment: 'Apt 2B' },
    { name: 'Rachid Benjelloun',   apartment: 'Apt 3A' },
    { name: 'Nadia Chaoui',        apartment: 'Apt 3B' },
    { name: 'Hassan Berrada',      apartment: 'Apt 4A' },
    { name: 'Laila Chraibi',       apartment: 'Apt 4B' },
  ]

  // ── Meeting 1: SCHEDULED, 1ère convocation ─────────────────────────────────
  const m1id = randomUUID()
  await t.insertInto('meetings').values({
    id: m1id, title: 'Assemblée Générale Ordinaire 2024',
    description: 'Présentation des comptes annuels et élection du bureau syndical.',
    type: 'GLOBAL', status: 'SCHEDULED', convocation_number: 1,
    scheduled_at: new Date('2024-07-15T10:00:00'), location: 'Salle de réunion RDC',
    total_eligible: 8, residence_id: residenceId, updated_at: now,
  }).execute()

  await t.insertInto('agenda_items').values([
    { id: randomUUID(), meeting_id: m1id, sort_order: 0, vote_status: 'PENDING', pour: 0, contre: 0, abstention: 0, result: null, updated_at: now, title: 'Présentation et approbation des comptes 2023', description: "Revue du bilan financier de l'exercice 2023 présenté par le syndic." },
    { id: randomUUID(), meeting_id: m1id, sort_order: 1, vote_status: 'PENDING', pour: 0, contre: 0, abstention: 0, result: null, updated_at: now, title: 'Élection du nouveau bureau du conseil syndical', description: 'Vote pour les membres du conseil : Président, Trésorier, Secrétaire.' },
    { id: randomUUID(), meeting_id: m1id, sort_order: 2, vote_status: 'PENDING', pour: 0, contre: 0, abstention: 0, result: null, updated_at: now, title: 'Budget prévisionnel 2024-2025', description: "Discussion et vote du budget de gestion pour l'exercice à venir." },
  ]).execute()

  const m1rsvps: ('ACCEPTED' | 'DECLINED' | 'PENDING')[] = ['ACCEPTED', 'ACCEPTED', 'ACCEPTED', 'DECLINED', 'ACCEPTED', 'PENDING', 'PENDING', 'ACCEPTED']
  await t.insertInto('meeting_attendees').values(
    ATTENDEES.map((a, i) => ({ id: randomUUID(), meeting_id: m1id, profile_id: null, ...a, rsvp: m1rsvps[i], present: false, updated_at: now }))
  ).execute()
  console.log('✓ Meeting 1: AGO 2024 (SCHEDULED)')

  // ── Meeting 2: IN_PROGRESS, 2ème convocation ───────────────────────────────
  const m2id = randomUUID()
  await t.insertInto('meetings').values({
    id: m2id, title: 'Point urgence ascenseur',
    description: "Décision sur le remplacement du moteur de l'ascenseur en panne.",
    type: 'EXCEPTIONAL', status: 'IN_PROGRESS', convocation_number: 2,
    scheduled_at: new Date('2024-06-20T17:30:00'), location: 'En ligne (Zoom)',
    total_eligible: 8, residence_id: residenceId, updated_at: now,
  }).execute()

  const ai2a = randomUUID()
  const ai2b = randomUUID()
  await t.insertInto('agenda_items').values([
    { id: ai2a, meeting_id: m2id, sort_order: 0, vote_status: 'CLOSED', pour: 6, contre: 0, abstention: 1, result: 'ADOPTED', updated_at: now, title: 'Rapport de panne ascenseur', description: 'Présentation du rapport technique du prestataire OTIS Maroc.' },
    { id: ai2b, meeting_id: m2id, sort_order: 1, vote_status: 'OPEN',   pour: 3, contre: 3, abstention: 1, result: null,      updated_at: now, title: 'Vote remplacement moteur ascenseur', description: 'Devis OTIS — 62 000 MAD, délai d\'intervention 3 semaines.' },
  ]).execute()

  const m2presence = [true, true, true, true, true, true, false, true]
  const m2rsvps: ('ACCEPTED' | 'DECLINED' | 'PENDING')[]   = ['ACCEPTED', 'ACCEPTED', 'ACCEPTED', 'ACCEPTED', 'ACCEPTED', 'DECLINED', 'DECLINED', 'PENDING']
  await t.insertInto('meeting_attendees').values(
    ATTENDEES.map((a, i) => ({ id: randomUUID(), meeting_id: m2id, profile_id: null, ...a, rsvp: m2rsvps[i], present: m2presence[i], updated_at: now }))
  ).execute()
  console.log('✓ Meeting 2: Urgence ascenseur (IN_PROGRESS, 2ème convocation, vote en cours avec égalité)')

  // ── Meeting 3: COMPLETED, 1ère convocation ─────────────────────────────────
  const m3id = randomUUID()
  await t.insertInto('meetings').values({
    id: m3id, title: 'Réunion travaux toiture',
    description: 'Discussion sur le devis pour la réfection complète de la toiture.',
    type: 'EXCEPTIONAL', status: 'COMPLETED', convocation_number: 1,
    scheduled_at: new Date('2024-05-20T18:00:00'), location: 'Salle de réunion RDC',
    total_eligible: 8, residence_id: residenceId, updated_at: now,
  }).execute()

  await t.insertInto('agenda_items').values([
    { id: randomUUID(), meeting_id: m3id, sort_order: 0, vote_status: 'CLOSED', pour: 5, contre: 2, abstention: 0, result: 'ADOPTED',  updated_at: now, title: 'Approbation du devis toiture', description: 'Devis société ABC Travaux pour réfection complète — 145 000 MAD.' },
    { id: randomUUID(), meeting_id: m3id, sort_order: 1, vote_status: 'CLOSED', pour: 4, contre: 3, abstention: 0, result: 'ADOPTED',  updated_at: now, title: 'Modalités de financement des travaux', description: 'Cotisation exceptionnelle de 1 500 MAD / appartement sur 3 mensualités.' },
  ]).execute()

  const m3presence = [true, true, true, true, false, true, true, false]
  const m3rsvps: ('ACCEPTED' | 'DECLINED' | 'PENDING')[]   = ['ACCEPTED', 'ACCEPTED', 'ACCEPTED', 'ACCEPTED', 'DECLINED', 'ACCEPTED', 'ACCEPTED', 'PENDING']
  await t.insertInto('meeting_attendees').values(
    ATTENDEES.map((a, i) => ({ id: randomUUID(), meeting_id: m3id, profile_id: null, ...a, rsvp: m3rsvps[i], present: m3presence[i], updated_at: now }))
  ).execute()
  console.log('✓ Meeting 3: Travaux toiture (COMPLETED)')

  console.log('\nDone.')
}

seed()
  .catch(err => { console.error('\nSeed failed:', err); process.exit(1) })
  .finally(() => db.destroy())
