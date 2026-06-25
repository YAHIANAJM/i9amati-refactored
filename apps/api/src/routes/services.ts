import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import type { Selectable } from 'kysely'
import { authenticate } from '../middleware/auth'
import type { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { defineServiceAbility } from '@i9amati/shared'
import type { ServiceActions, ServiceSubjects } from '@i9amati/shared'
import type { ServiceContractTable, ServiceTable } from '../db/types'
import { minioClient, BUCKET, objectUrl } from '../lib/storage'

type ContractRow = Selectable<ServiceContractTable>
type ServiceRow  = Selectable<ServiceTable>

type FileRow = {
  id:          string
  name:        string
  size:        number | null
  path:        string | null
  uploaded_at: Date
}

const router = Router()
router.use(authenticate)

// ── Helpers ───────────────────────────────────────────────────────────────────

function guard(action: ServiceActions, subject: ServiceSubjects) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { profileRole } = req as AuthRequest
    next(defineServiceAbility(profileRole).cannot(action, subject)
      ? new AppError(403, 'Forbidden')
      : undefined)
  }
}

function parseBody<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const r = schema.safeParse(data)
  if (!r.success) {
    const msg = r.error.issues
      .map(i => `${i.path.join('.') || 'body'}: ${i.message}`)
      .join('; ')
    throw new AppError(400, msg)
  }
  return r.data
}

function requireRow<T>(row: T | undefined, resource: string): T {
  if (row === undefined) throw new AppError(404, `${resource} not found`)
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

function fmtContract(c: ContractRow, files: FileRow[] = []) {
  return {
    id:          c.id,
    service_id:  c.service_id,
    name:        c.name,
    description: c.description ?? null,
    amount:      Number(c.amount),
    amount_paid: Number(c.amount_paid),
    start_date:  c.start_date ?? null,
    end_date:    c.end_date ?? null,
    status:      c.status,
    files:       files.map(f => ({
      id:          f.id,
      name:        f.name,
      size:        f.size ?? null,
      url:         f.path ? objectUrl(f.path) : null,
      uploaded_at: f.uploaded_at instanceof Date
        ? f.uploaded_at.toISOString()
        : String(f.uploaded_at),
    })),
  }
}

function fmtService(
  s:               ServiceRow,
  contracts:       ContractRow[],
  filesByContract: Map<string, FileRow[]> = new Map(),
) {
  return {
    id:           s.id,
    name:         s.name,
    slug:         s.slug,
    type:         s.type ?? null,
    contact_info: (s.contact_info as { phone?: string; email?: string } | null) ?? null,
    contracts:    contracts.map(c => fmtContract(c, filesByContract.get(c.id) ?? [])),
  }
}

// ── GET /api/services ──────────────────────────────────────────────────────────

router.get('/', async (req: Request, res, next) => {
  try {
    const { tenantDb, profileRole, profileId } = req as AuthRequest

    const services = await tenantDb
      .selectFrom('services')
      .selectAll()
      .orderBy('name', 'asc')
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
      services: services.map(s =>
        fmtService(s, contractsByService.get(s.id) ?? [], filesByContract),
      ),
    })
  } catch (err) {
    next(err)
  }
})

// ── POST /api/services ─────────────────────────────────────────────────────────

const CreateServiceSchema = z.object({
  name:         z.string().min(1).max(100),
  type:         z.string().max(50).nullable().optional(),
  contact_info: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
  }).nullable().optional(),
})

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

    return res.status(201).json(fmtService(service, []))
  } catch (err) {
    next(err)
  }
})

// ── PATCH /api/services/:serviceId ────────────────────────────────────────────

const UpdateServiceSchema = z.object({
  name:         z.string().min(1).max(100).optional(),
  type:         z.string().max(50).nullable().optional(),
  contact_info: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
  }).nullable().optional(),
})

router.patch('/:serviceId', guard('update', 'Service'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const body    = parseBody(UpdateServiceSchema, req.body)
    const service = requireRow(
      await tenantDb.selectFrom('services').selectAll()
        .where('id', '=', req.params.serviceId).executeTakeFirst(),
      'Service',
    )

    const updates: { name?: string; type?: string | null; contact_info?: { phone?: string; email?: string } | null } = {}
    if (body.name         !== undefined) updates.name         = body.name
    if (body.type         !== undefined) updates.type         = body.type
    if (body.contact_info !== undefined) updates.contact_info = body.contact_info

    if (Object.keys(updates).length === 0) {
      const contracts = await tenantDb.selectFrom('service_contracts')
        .selectAll().where('service_id', '=', service.id).execute()
      return res.json(fmtService(service, contracts))
    }

    const updated = await tenantDb
      .updateTable('services').set(updates)
      .where('id', '=', req.params.serviceId)
      .returningAll().executeTakeFirstOrThrow()

    const contracts = await tenantDb.selectFrom('service_contracts')
      .selectAll().where('service_id', '=', updated.id).execute()

    return res.json(fmtService(updated, contracts))
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

const CreateContractSchema = z.object({
  name:        z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  amount:      z.number().min(0),
  start_date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  end_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  status:      z.enum(['ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED']).optional(),
})

router.post('/:serviceId/contracts', guard('create', 'ServiceContract'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const body    = parseBody(CreateContractSchema, req.body)
    const service = requireRow(
      await tenantDb.selectFrom('services').select('id')
        .where('id', '=', req.params.serviceId).executeTakeFirst(),
      'Service',
    )

    const contract = await tenantDb
      .insertInto('service_contracts')
      .values({
        id:          randomUUID(),
        service_id:  service.id,
        name:        body.name,
        description: body.description ?? null,
        amount:      body.amount,
        amount_paid: 0,
        start_date:  body.start_date ?? null,
        end_date:    body.end_date ?? null,
        status:      body.status ?? 'PENDING',
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    return res.status(201).json(fmtContract(contract))
  } catch (err) {
    next(err)
  }
})

// ── PATCH /api/services/:serviceId/contracts/:contractId ──────────────────────

const UpdateContractSchema = z.object({
  name:        z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  amount:      z.number().min(0).optional(),
  start_date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  end_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  status:      z.enum(['ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED']).optional(),
})

router.patch('/:serviceId/contracts/:contractId', guard('update', 'ServiceContract'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const body     = parseBody(UpdateContractSchema, req.body)
    const contract = requireRow(
      await tenantDb.selectFrom('service_contracts').selectAll()
        .where('id', '=', req.params.contractId)
        .where('service_id', '=', req.params.serviceId)
        .executeTakeFirst(),
      'Contract',
    )

    if (body.amount !== undefined && body.amount < Number(contract.amount_paid)) {
      throw new AppError(409,
        `Cannot reduce contract amount below amount already paid (${contract.amount_paid})`,
      )
    }

    const updates: { name?: string; description?: string | null; amount?: number; start_date?: string | null; end_date?: string | null; status?: string } = {}
    if (body.name        !== undefined) updates.name        = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.amount      !== undefined) updates.amount      = body.amount
    if (body.start_date  !== undefined) updates.start_date  = body.start_date
    if (body.end_date    !== undefined) updates.end_date    = body.end_date
    if (body.status      !== undefined) updates.status      = body.status

    if (Object.keys(updates).length === 0) return res.json(fmtContract(contract))

    const updated = await tenantDb
      .updateTable('service_contracts').set(updates)
      .where('id', '=', req.params.contractId)
      .returningAll().executeTakeFirstOrThrow()

    return res.json(fmtContract(updated))
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

const RecordPaymentSchema = z.object({
  amount: z.number().positive(),
})

router.post('/:serviceId/contracts/:contractId/pay', guard('update', 'ServiceContract'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest
    const body     = parseBody(RecordPaymentSchema, req.body)
    const contract = requireRow(
      await tenantDb.selectFrom('service_contracts').selectAll()
        .where('id', '=', req.params.contractId)
        .where('service_id', '=', req.params.serviceId)
        .executeTakeFirst(),
      'Contract',
    )

    const remaining = Number(contract.amount) - Number(contract.amount_paid)
    if (remaining <= 0) throw new AppError(409, 'Contract is already fully paid')

    const newPaid = Math.min(
      Number(contract.amount_paid) + body.amount,
      Number(contract.amount),
    )

    const updated = await tenantDb
      .updateTable('service_contracts')
      .set({ amount_paid: newPaid })
      .where('id', '=', contract.id)
      .returningAll().executeTakeFirstOrThrow()

    return res.json(fmtContract(updated))
  } catch (err) {
    next(err)
  }
})

// ── POST /api/services/:serviceId/contracts/:contractId/files ─────────────────

const AttachFileSchema = z.object({
  name: z.string().min(1).max(255),
  key:  z.string().min(1).max(500),
  size: z.number().int().min(0).optional(),
})

router.post('/:serviceId/contracts/:contractId/files', guard('update', 'ServiceContract'), async (req: Request, res, next) => {
  try {
    const { tenantDb, profileId } = req as AuthRequest
    const body     = parseBody(AttachFileSchema, req.body)
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
        id:          docId,
        type:        'FILE',
        parent_id:   null,
        name:        body.name,
        path:        body.key,
        size:        body.size ?? null,
        uploaded_by: profileId,
        updated_at:  new Date(),
      })
      .execute()

    await tenantDb
      .insertInto('document_access')
      .values({
        id:           randomUUID(),
        doc_id:       docId,
        contract_id:  contract.id,
        profile_id:   null,
        residence_id: null,
        building_id:  null,
        apartment_id: null,
        access_level: 'VIEW',
      })
      .execute()

    return res.status(201).json({
      id:          docId,
      name:        body.name,
      size:        body.size ?? null,
      url:         objectUrl(body.key),
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

export default router
