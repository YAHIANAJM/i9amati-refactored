import { Router, Request, Response, NextFunction } from 'express'
import { subject } from '@casl/ability'
import type { ZodTypeAny, infer as ZodInfer } from 'zod'
import { randomUUID } from 'crypto'
import { hashPassword } from 'better-auth/crypto'
import { sql, type Selectable } from 'kysely'
import { authenticate } from '../middleware/auth'
import type { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { formatZodError } from '../lib/zod-errors'
import {
  defineServiceAbility,
  CreateServiceSchema,
  UpdateServiceSchema,
  CreateContractSchema,
  UpdateContractSchema,
  RecordPaymentSchema,
  AttachFileSchema,
  RecordCheckInSchema,
  CreateStaffSchema,
} from '@i9amati/shared'
import type { ServiceActions, ServiceSubjects } from '@i9amati/shared'
import type { ServiceContractTable, ServiceTable } from '../db/types'
import { minioClient, BUCKET, presignedUrl } from '../lib/storage'
import { auth } from '../auth'

type ContractRow = Selectable<ServiceContractTable>
type ServiceRow = Selectable<ServiceTable>

type FileRow = {
  id: string
  name: string
  size: number | null
  path: string | null
  uploaded_at: Date
}

const router = Router()
router.use(authenticate)

// ── Helpers ───────────────────────────────────────────────────────────────────

function guard(action: ServiceActions, sub: ServiceSubjects) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { profileRole, profileId } = req as AuthRequest
    next(defineServiceAbility(profileRole, profileId).cannot(action, sub)
      ? new AppError(403, 'Forbidden', 'FORBIDDEN')
      : undefined)
  }
}

function parseBody<S extends ZodTypeAny>(schema: S, data: unknown): ZodInfer<S> {
  const r = schema.safeParse(data)
  if (!r.success) throw new AppError(400, formatZodError(r.error), 'VALIDATION_ERROR')
  return r.data
}

function requireRow<T>(row: T | undefined, resource: string): T {
  if (row === undefined) throw new AppError(404, `${resource} not found`, 'NOT_FOUND')
  return row
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── Formatters ────────────────────────────────────────────────────────────────

async function fmtContract(c: ContractRow, files: FileRow[] = []) {
  return {
    id: c.id,
    service_id: c.service_id,
    name: c.name,
    description: c.description ?? null,
    amount: Number(c.amount),
    amount_paid: Number(c.amount_paid),
    start_date: c.start_date ?? null,
    end_date: c.end_date ?? null,
    status: c.status,
    files: await Promise.all(files.map(async f => ({
      id: f.id,
      name: f.name,
      size: f.size ?? null,
      url: f.path ? await presignedUrl(f.path) : null,
      uploaded_at: f.uploaded_at instanceof Date
        ? f.uploaded_at.toISOString()
        : String(f.uploaded_at),
    }))),
  }
}

async function fmtService(
  s: ServiceRow,
  contracts: ContractRow[],
  filesByContract: Map<string, FileRow[]> = new Map(),
) {
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    type: s.type ?? null,
    contact_info: (s.contact_info as { phone?: string; email?: string } | null) ?? null,
    contracts: await Promise.all(contracts.map(c => fmtContract(c, filesByContract.get(c.id) ?? []))),
  }
}

// ── GET /api/services ──────────────────────────────────────────────────────────

router.get('/', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileRole, profileId } = req as AuthRequest

    let servicesQuery = tenantDb.selectFrom('services').selectAll('services')
    
    if (profileRole === 'STAFF') {
      servicesQuery = servicesQuery
        .innerJoin('service_staff_assignments as ssa', 'ssa.service_id', 'services.id')
        .where('ssa.profile_id', '=', profileId)
    }

    const services = await servicesQuery
      .orderBy('services.name', 'asc')
      .execute()

    const contracts = services.length > 0
      ? await tenantDb
        .selectFrom('service_contracts')
        .selectAll()
        .where('service_id', 'in', services.map(s => s.id))
        .orderBy('start_date', 'desc')
        .execute()
      : []

    const allContractIds = contracts.map(c => c.id)
    const docs = allContractIds.length > 0
      ? await tenantDb
        .selectFrom('document_access')
        .innerJoin('documents', 'documents.id', 'document_access.doc_id')
        .select([
          'documents.id',
          'documents.name',
          'documents.size',
          'documents.path',
          'documents.uploaded_at',
          'document_access.contract_id',
        ])
        .where('document_access.contract_id', 'in', allContractIds)
        .execute()
      : []

    const filesByContract = new Map<string, FileRow[]>(allContractIds.map(id => [id, []]))
    for (const d of docs) {
      if (d.contract_id) filesByContract.get(d.contract_id)?.push(d)
    }

    const contractsByService = new Map<string, typeof contracts>(services.map(s => [s.id, []]))
    for (const c of contracts) contractsByService.get(c.service_id)?.push(c)

    return res.json({
      profileId,
      profileRole,
      services: await Promise.all(services.map(s =>
        fmtService(s, contractsByService.get(s.id) ?? [], filesByContract),
      )),
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/services/staff ────────────────────────────────────────────────────

router.get('/staff', guard('read', 'Service'), async (req: Request, res, next) => {
  try {
    const { tenantDb, activeOrganizationId, profileRole, profileId } = req as AuthRequest
    const serviceId = req.query.serviceId as string | undefined

    let query = tenantDb
      .selectFrom('public.profiles as prof')
      .innerJoin('public.user as usr', 'usr.id', 'prof.user_id')
      .select([
        'prof.id',
        'prof.role',
        'usr.firstName',
        'usr.lastName',
        'usr.image'
      ])
      .where('prof.organization_id', '=', activeOrganizationId!)
      .where('prof.role', '=', 'STAFF')
      .where('prof.deleted_at', 'is', null)

    if (profileRole === 'STAFF') {
      query = query.where('prof.id', '=', profileId)
    }

    if (serviceId) {
      query = query
        .leftJoin('service_staff_assignments as ssa', (join) =>
          join.onRef('ssa.profile_id', '=', 'prof.id').on('ssa.service_id', '=', sql.lit(serviceId))
        )
        .select('ssa.assigned_at')
    }

    const staff = await query.execute()

    return res.json(staff.map(s => ({
      ...s,
      is_assigned: !!(s as any).assigned_at
    })))
  } catch (err) {
    next(err)
  }
})

// ── POST /api/services/:serviceId/assign/:profileId ──────────────────────────

router.post('/:serviceId/assign/:profileId', guard('manage', 'all'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    await tenantDb
      .insertInto('service_staff_assignments')
      .values({
        service_id: req.params.serviceId,
        profile_id: req.params.profileId
      })
      .onConflict((oc) => oc.doNothing())
      .execute()
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// ── DELETE /api/services/:serviceId/assign/:profileId ────────────────────────

router.delete('/:serviceId/assign/:profileId', guard('manage', 'all'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    await tenantDb
      .deleteFrom('service_staff_assignments')
      .where('service_id', '=', req.params.serviceId)
      .where('profile_id', '=', req.params.profileId)
      .execute()
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// ── POST /api/services/staff ───────────────────────────────────────────────────

router.post('/staff', guard('create', 'Service'), async (req: Request, res, next) => {
  try {
    const { tenantDb, activeOrganizationId } = req as AuthRequest
    const { firstName, lastName, email } = parseBody(CreateStaffSchema, req.body)
    const randomPassword = randomUUID()
    // Check if email already exists
    const existingUser = await tenantDb
      .selectFrom('public.user')
      .select('id')
      .where('email', '=', email.toLowerCase())
      .executeTakeFirst()



    const userId = existingUser?.id ?? randomUUID()
    const accountId = randomUUID()
    const profileId = randomUUID()
    const hashedPassword = await hashPassword(randomPassword)

    await tenantDb.transaction().execute(async (trx) => {
      // Create User


      if (existingUser) {
        // Create Profile for STAFF role in the org
        await trx
          .insertInto('public.profiles')
          .values({
            id: profileId,
            user_id: userId,
            organization_id: activeOrganizationId,
            role: 'STAFF',
            updated_at: new Date()
          })
          .execute()
        return
      }
      await trx
        .insertInto('public.user')
        .values({
          id: userId,
          name: `${firstName} ${lastName}`,
          firstName: firstName,
          lastName: lastName,
          email: email.toLowerCase(),
          emailVerified: false,
          platformRole: 'USER',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .execute()

      // Create Account with Password
      await trx
        .insertInto('public.account')
        .values({
          id: accountId,
          accountId: email.toLowerCase(),
          userId: userId,
          providerId: 'credential',
          password: hashedPassword,
          organizationId: activeOrganizationId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .execute()

      // Create Profile for STAFF role in the org
      await trx
        .insertInto('public.profiles')
        .values({
          id: profileId,
          user_id: userId,
          organization_id: activeOrganizationId,
          role: 'STAFF',
          updated_at: new Date()
        })
        .execute()
    })

    if (!existingUser) {
      // Send reset password email only for newly created users
      // Needs to be outside transaction so better-auth can find the committed user
      try {
        await auth.api.requestPasswordReset({
          body: {
            email: email.toLowerCase(),
          },
        })
      } catch (e) {
        console.error('Failed to trigger reset password:', e)
      }
    }

    return res.status(201).json({ id: profileId })
  } catch (err) {
    next(err)
  }
})

// ── DELETE /api/services/staff/:profileId ──────────────────────────────────────

router.delete('/staff/:profileId', guard('delete', 'Service'), async (req: Request, res, next) => {
  try {
    const { tenantDb, activeOrganizationId } = req as AuthRequest
    const profileId = req.params.profileId

    const profile = await tenantDb
      .selectFrom('public.profiles')
      .select(['user_id', 'role'])
      .where('id', '=', profileId)
      .where('organization_id', '=', activeOrganizationId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()

    if (!profile) throw new AppError(404, 'Staff not found')
    if (profile.role !== 'STAFF') throw new AppError(403, 'Cannot delete non-staff profiles from this endpoint')

    // Soft delete the profile instead of hard deleting
    // Also ban the user so they can no longer login
    await tenantDb.transaction().execute(async (trx) => {
      await trx
        .updateTable('public.profiles')
        .set({ deleted_at: new Date() })
        .where('id', '=', profileId)
        .execute()

      await trx
        .updateTable('public.user')
        .set({ banned: true, banReason: 'Staff profile deleted' })
        .where('id', '=', profile.user_id)
        .execute()
    })

    res.json({ success: true })
  } catch (e) { next(e) }
})

// ── POST /api/services ─────────────────────────────────────────────────────────

router.post('/', guard('create', 'Service'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const body = parseBody(CreateServiceSchema, req.body)
    const { name, type, contact_info } = body
    let slug = toSlug(name)

    const existing = await tenantDb
      .selectFrom('services').select('id').where('slug', '=', slug).executeTakeFirst()
    if (existing) slug = `${slug}-${randomUUID().slice(0, 6)}`

    const service = await tenantDb
      .insertInto('services')
      .values({ id: randomUUID(), name, slug, type: type ?? null, contact_info: contact_info ?? null })
      .returningAll()
      .executeTakeFirstOrThrow()

    return res.status(201).json(await fmtService(service, []))
  } catch (err) {
    next(err)
  }
})

// ── PATCH /api/services/:serviceId ────────────────────────────────────────────

router.patch('/:serviceId', guard('update', 'Service'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const body = parseBody(UpdateServiceSchema, req.body)
    const service = requireRow(
      await tenantDb.selectFrom('services').selectAll()
        .where('id', '=', req.params.serviceId).executeTakeFirst(),
      'Service',
    )

    const updates: { name?: string; type?: string | null; contact_info?: { phone?: string; email?: string } | null } = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.type !== undefined) updates.type = body.type
    if (body.contact_info !== undefined) updates.contact_info = body.contact_info

    if (Object.keys(updates).length === 0) {
      const contracts = await tenantDb.selectFrom('service_contracts')
        .selectAll().where('service_id', '=', service.id).execute()
      return res.json(await fmtService(service, contracts))
    }

    const updated = await tenantDb
      .updateTable('services').set(updates)
      .where('id', '=', req.params.serviceId)
      .returningAll().executeTakeFirstOrThrow()

    const contracts = await tenantDb.selectFrom('service_contracts')
      .selectAll().where('service_id', '=', updated.id).execute()

    return res.json(await fmtService(updated, contracts))
  } catch (err) {
    next(err)
  }
})

// ── DELETE /api/services/:serviceId ───────────────────────────────────────────

router.delete('/:serviceId', guard('delete', 'Service'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const service = requireRow(
      await tenantDb.selectFrom('services').select('id')
        .where('id', '=', req.params.serviceId).executeTakeFirst(),
      'Service',
    )

    await tenantDb.deleteFrom('service_check_in_out')
      .where('service_id', '=', service.id).execute()

    const contracts = await tenantDb.selectFrom('service_contracts').select('id')
      .where('service_id', '=', service.id).execute()

    if (contracts.length > 0) {
      await tenantDb.deleteFrom('service_residences')
        .where('service_contract_id', 'in', contracts.map(c => c.id)).execute()
    }

    await tenantDb.deleteFrom('service_contracts')
      .where('service_id', '=', service.id).execute()
    await tenantDb.deleteFrom('service_schedules')
      .where('service_id', '=', service.id).execute()
    await tenantDb.deleteFrom('services')
      .where('id', '=', service.id).execute()

    return res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// ── POST /api/services/:serviceId/contracts ────────────────────────────────────

router.post('/:serviceId/contracts', guard('create', 'ServiceContract'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const body = parseBody(CreateContractSchema, req.body)
    const service = requireRow(
      await tenantDb.selectFrom('services').select('id')
        .where('id', '=', req.params.serviceId).executeTakeFirst(),
      'Service',
    )

    const contract = await tenantDb
      .insertInto('service_contracts')
      .values({
        id: randomUUID(),
        service_id: service.id,
        name: body.name,
        description: body.description ?? null,
        amount: body.amount,
        amount_paid: 0,
        start_date: body.start_date ?? null,
        end_date: body.end_date ?? null,
        status: body.status ?? 'PENDING',
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    return res.status(201).json(await fmtContract(contract))
  } catch (err) {
    next(err)
  }
})

// ── PATCH /api/services/:serviceId/contracts/:contractId ──────────────────────

router.patch('/:serviceId/contracts/:contractId', guard('update', 'ServiceContract'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const body = parseBody(UpdateContractSchema, req.body)
    const contract = requireRow(
      await tenantDb.selectFrom('service_contracts').selectAll()
        .where('id', '=', req.params.contractId)
        .where('service_id', '=', req.params.serviceId)
        .executeTakeFirst(),
      'Contract',
    )

    const effectiveAmount = body.amount ?? Number(contract.amount)
    const effectivePaid = body.amount_paid ?? Number(contract.amount_paid)
    if (effectivePaid > effectiveAmount) {
      throw new AppError(409, 'conflict.paidExceedsAmount', 'CONFLICT')
    }

    const updates: { name?: string; description?: string | null; amount?: number; amount_paid?: number; start_date?: string; end_date?: string; status?: string } = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.amount !== undefined) updates.amount = body.amount
    if (body.amount_paid !== undefined) updates.amount_paid = body.amount_paid
    if (body.start_date !== undefined) updates.start_date = body.start_date
    if (body.end_date !== undefined) updates.end_date = body.end_date
    if (body.status !== undefined) updates.status = body.status

    if (Object.keys(updates).length === 0) return res.json(await fmtContract(contract))

    const updated = await tenantDb
      .updateTable('service_contracts').set(updates)
      .where('id', '=', req.params.contractId)
      .returningAll().executeTakeFirstOrThrow()

    return res.json(await fmtContract(updated))
  } catch (err) {
    next(err)
  }
})

// ── DELETE /api/services/:serviceId/contracts/:contractId ─────────────────────

router.delete('/:serviceId/contracts/:contractId', guard('delete', 'ServiceContract'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const contract = requireRow(
      await tenantDb.selectFrom('service_contracts').select('id')
        .where('id', '=', req.params.contractId)
        .where('service_id', '=', req.params.serviceId)
        .executeTakeFirst(),
      'Contract',
    )

    await tenantDb.deleteFrom('service_residences')
      .where('service_contract_id', '=', contract.id).execute()
    await tenantDb.deleteFrom('service_contracts')
      .where('id', '=', contract.id).execute()

    return res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// ── POST /api/services/:serviceId/contracts/:contractId/pay ───────────────────

router.post('/:serviceId/contracts/:contractId/pay', guard('update', 'ServiceContract'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const body = parseBody(RecordPaymentSchema, req.body)
    const contract = requireRow(
      await tenantDb.selectFrom('service_contracts').selectAll()
        .where('id', '=', req.params.contractId)
        .where('service_id', '=', req.params.serviceId)
        .executeTakeFirst(),
      'Contract',
    )

    const remaining = Number(contract.amount) - Number(contract.amount_paid)
    if (remaining <= 0) throw new AppError(409, 'conflict.alreadyFullyPaid', 'CONFLICT')

    const newPaid = Math.min(
      Number(contract.amount_paid) + body.amount,
      Number(contract.amount),
    )

    const updated = await tenantDb
      .updateTable('service_contracts')
      .set({ amount_paid: newPaid })
      .where('id', '=', contract.id)
      .returningAll().executeTakeFirstOrThrow()

    return res.json(await fmtContract(updated))
  } catch (err) {
    next(err)
  }
})

// ── POST /api/services/:serviceId/contracts/:contractId/files ─────────────────

router.post('/:serviceId/contracts/:contractId/files', guard('update', 'ServiceContract'), async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId } = req as AuthRequest
    const body = parseBody(AttachFileSchema, req.body)
    const contract = requireRow(
      await tenantDb.selectFrom('service_contracts').select('id')
        .where('id', '=', req.params.contractId)
        .where('service_id', '=', req.params.serviceId)
        .executeTakeFirst(),
      'Contract',
    )

    const docId = randomUUID()
    await tenantDb
      .insertInto('documents')
      .values({
        id: docId,
        type: 'FILE',
        parent_id: null,
        name: body.name,
        path: body.key,
        size: body.size ?? null,
        uploaded_by: profileId,
        updated_at: new Date(),
      })
      .execute()

    await tenantDb
      .insertInto('document_access')
      .values({
        id: randomUUID(),
        doc_id: docId,
        contract_id: contract.id,
        profile_id: null,
        residence_id: null,
        building_id: null,
        apartment_id: null,
        access_level: 'VIEW',
      })
      .execute()

    return res.status(201).json({
      id: docId,
      name: body.name,
      size: body.size ?? null,
      url: await presignedUrl(body.key),
      uploaded_at: new Date().toISOString(),
    })
  } catch (err) {
    next(err)
  }
})

// ── DELETE /api/services/:serviceId/contracts/:contractId/files/:docId ────────

router.delete('/:serviceId/contracts/:contractId/files/:docId', guard('update', 'ServiceContract'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest

    requireRow(
      await tenantDb.selectFrom('service_contracts').select('id')
        .where('id', '=', req.params.contractId)
        .where('service_id', '=', req.params.serviceId)
        .executeTakeFirst(),
      'Contract',
    )

    const doc = requireRow(
      await tenantDb
        .selectFrom('document_access')
        .innerJoin('documents', 'documents.id', 'document_access.doc_id')
        .select(['documents.id', 'documents.path'])
        .where('document_access.contract_id', '=', req.params.contractId)
        .where('documents.id', '=', req.params.docId)
        .executeTakeFirst(),
      'File',
    )

    if (doc.path) {
      await minioClient.removeObject(BUCKET, doc.path).catch(() => undefined)
    }

    await tenantDb.deleteFrom('documents').where('id', '=', doc.id).execute()

    return res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// ── GET /api/services/:serviceId/sessions ──────────────────────────────────────

router.get('/:serviceId/sessions', guard('read', 'ServiceSession'), async (req: Request, res, next) => {
  try {
    const { tenantDb, profileRole, profileId } = req as AuthRequest
    let query = tenantDb
      .selectFrom('service_check_in_out as sesh')
      .innerJoin('public.profiles as prof', 'prof.id', 'sesh.profile_id')
      .innerJoin('public.user as usr', 'usr.id', 'prof.user_id')
      .where('prof.deleted_at', 'is', null)
      .select([
        'sesh.id',
        'sesh.service_id',
        'sesh.profile_id',
        'sesh.check_in_at',
        'sesh.check_out_at',
        'usr.name as firstName',
        'usr.image'
      ])
      .where('sesh.service_id', '=', req.params.serviceId)

    if (profileRole === 'STAFF') {
      query = query.where('sesh.profile_id', '=', profileId)
    }

    const sessions = await query.orderBy('sesh.check_in_at', 'desc').execute()

    return res.json(sessions.map((s: any) => ({
      id: s.id,
      service_id: s.service_id,
      profile_id: s.profile_id,
      check_in_at: s.check_in_at ? (s.check_in_at instanceof Date ? s.check_in_at.toISOString() : String(s.check_in_at)) : null,
      check_out_at: s.check_out_at ? (s.check_out_at instanceof Date ? s.check_out_at.toISOString() : String(s.check_out_at)) : null,
      profile: {
        firstName: s.firstName,
        lastName: null,
        image: s.image
      }
    })))
  } catch (err) {
    next(err)
  }
})

// ── POST /api/services/:serviceId/sessions/check-in ────────────────────────────

router.post('/:serviceId/sessions/check-in', guard('create', 'ServiceSession'), async (req: Request, res, next) => {
  try {
    const { tenantDb, profileRole, profileId } = req as AuthRequest
    const body = parseBody(RecordCheckInSchema, req.body)
    
    const ability = defineServiceAbility(profileRole, profileId)
    if (ability.cannot('create', subject('ServiceSession', { profile_id: body.profileId }))) {
      throw new AppError(403, 'Staff can only check in for themselves', 'FORBIDDEN')
    }

    const service = requireRow(
      await tenantDb.selectFrom('services').select('id')
        .where('id', '=', req.params.serviceId).executeTakeFirst(),
      'Service'
    )

    const activeSession = await tenantDb
      .selectFrom('service_check_in_out')
      .select('id')
      .where('service_id', '=', service.id)
      .where('profile_id', '=', body.profileId)
      .where('check_out_at', 'is', null)
      .executeTakeFirst()

    if (activeSession) {
      throw new AppError(400, 'validation.session.alreadyCheckedIn', 'BAD_REQUEST')
    }

    const session = await tenantDb
      .insertInto('service_check_in_out')
      .values({
        id: randomUUID(),
        service_id: service.id,
        profile_id: body.profileId,
        check_in_at: new Date(),
        check_out_at: null
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    return res.status(201).json({
      id: session.id,
      service_id: session.service_id,
      profile_id: session.profile_id,
      check_in_at: session.check_in_at instanceof Date ? session.check_in_at.toISOString() : String(session.check_in_at),
      check_out_at: null
    })
  } catch (err) {
    next(err)
  }
})

// ── PATCH /api/services/:serviceId/sessions/:sessionId/check-out ────────────────

router.patch('/:serviceId/sessions/:sessionId/check-out', guard('update', 'ServiceSession'), async (req: Request, res, next) => {
  try {
    const { tenantDb, profileRole, profileId } = req as AuthRequest

    const session = requireRow(
      await tenantDb.selectFrom('service_check_in_out')
        .selectAll()
        .where('id', '=', req.params.sessionId)
        .where('service_id', '=', req.params.serviceId)
        .executeTakeFirst(),
      'Session'
    )

    const ability = defineServiceAbility(profileRole, profileId)
    if (ability.cannot('update', subject('ServiceSession', { profile_id: session.profile_id }))) {
      throw new AppError(403, 'Staff can only check out their own sessions', 'FORBIDDEN')
    }

    if (session.check_out_at) {
      throw new AppError(409, 'Session is already checked out', 'CONFLICT')
    }

    const updated = await tenantDb
      .updateTable('service_check_in_out')
      .set({ check_out_at: new Date() })
      .where('id', '=', session.id)
      .returningAll()
      .executeTakeFirstOrThrow()

    return res.json({
      id: updated.id,
      service_id: updated.service_id,
      profile_id: updated.profile_id,
      check_in_at: updated.check_in_at instanceof Date ? updated.check_in_at.toISOString() : String(updated.check_in_at),
      check_out_at: updated.check_out_at instanceof Date ? updated.check_out_at.toISOString() : String(updated.check_out_at),
    })
  } catch (err) {
    next(err)
  }
})

export default router
