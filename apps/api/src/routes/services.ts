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

type ContractRow = Selectable<ServiceContractTable>
type ServiceRow  = Selectable<ServiceTable>

const router = Router()
router.use(authenticate)

// ── Permission guard ──────────────────────────────────────────────────────────

function guard(action: ServiceActions, subject: ServiceSubjects) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { profileRole } = req as AuthRequest
    const ability = defineServiceAbility(profileRole)
    next(ability.cannot(action, subject) ? new AppError(403, 'ERROR_FORBIDDEN') : undefined)
  }
}

// ── Formatters ────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function fmtContract(c: ContractRow) {
  return {
    id:           c.id,
    service_id:   c.service_id,
    name:         c.name,
    description:  c.description ?? null,
    amount:       Number(c.amount),
    amount_paid:  Number(c.amount_paid),
    start_date:   c.start_date ?? null,
    end_date:     c.end_date ?? null,
    status:       c.status,
  }
}

function fmtService(s: ServiceRow, contracts: ContractRow[]) {
  return {
    id:           s.id,
    name:         s.name,
    slug:         s.slug,
    type:         s.type ?? null,
    contact_info: (s.contact_info as { phone?: string; email?: string } | null) ?? null,
    contracts:    contracts.map(fmtContract),
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

    const contractsByService = new Map<string, typeof contracts>(services.map(s => [s.id, []]))
    for (const c of contracts) contractsByService.get(c.service_id)?.push(c)

    return res.json({
      profileId,
      profileRole,
      services: services.map(s => fmtService(s, contractsByService.get(s.id) ?? [])),
    })
  } catch (err) {
    next(err)
  }
})

// ── POST /api/services ─────────────────────────────────────────────────────────

const CreateServiceSchema = z.object({
  name:         z.string().min(1).max(100),
  type:         z.string().max(50).optional(),
  contact_info: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
  }).optional(),
})

router.post('/', guard('create', 'Service'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest

    const body = CreateServiceSchema.safeParse(req.body)
    if (!body.success) throw new AppError(400, 'VALIDATION_ERROR')

    const { name, type, contact_info } = body.data
    let slug = toSlug(name)

    const existing = await tenantDb
      .selectFrom('services')
      .select('id')
      .where('slug', '=', slug)
      .executeTakeFirst()
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

    const body = UpdateServiceSchema.safeParse(req.body)
    if (!body.success) throw new AppError(400, 'VALIDATION_ERROR')

    const service = await tenantDb
      .selectFrom('services')
      .selectAll()
      .where('id', '=', req.params.serviceId)
      .executeTakeFirst()
    if (!service) throw new AppError(404, 'NOT_FOUND')

    const updates: { name?: string; type?: string | null; contact_info?: { phone?: string; email?: string } | null } = {}
    if (body.data.name !== undefined)         updates.name         = body.data.name
    if (body.data.type !== undefined)         updates.type         = body.data.type
    if (body.data.contact_info !== undefined) updates.contact_info = body.data.contact_info

    if (Object.keys(updates).length === 0) {
      const contracts = await tenantDb
        .selectFrom('service_contracts')
        .selectAll()
        .where('service_id', '=', service.id)
        .execute()
      return res.json(fmtService(service, contracts))
    }

    const updated = await tenantDb
      .updateTable('services')
      .set(updates)
      .where('id', '=', req.params.serviceId)
      .returningAll()
      .executeTakeFirstOrThrow()

    const contracts = await tenantDb
      .selectFrom('service_contracts')
      .selectAll()
      .where('service_id', '=', updated.id)
      .execute()

    return res.json(fmtService(updated, contracts))
  } catch (err) {
    next(err)
  }
})

// ── DELETE /api/services/:serviceId ───────────────────────────────────────────

router.delete('/:serviceId', guard('delete', 'Service'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest

    const service = await tenantDb
      .selectFrom('services')
      .select('id')
      .where('id', '=', req.params.serviceId)
      .executeTakeFirst()
    if (!service) throw new AppError(404, 'NOT_FOUND')

    await tenantDb.deleteFrom('service_check_in_out').where('service_id', '=', service.id).execute()
    const contracts = await tenantDb
      .selectFrom('service_contracts')
      .select('id')
      .where('service_id', '=', service.id)
      .execute()
    if (contracts.length > 0) {
      await tenantDb
        .deleteFrom('service_residences')
        .where('service_contract_id', 'in', contracts.map(c => c.id))
        .execute()
    }
    await tenantDb.deleteFrom('service_contracts').where('service_id', '=', service.id).execute()
    await tenantDb.deleteFrom('service_schedules').where('service_id', '=', service.id).execute()
    await tenantDb.deleteFrom('services').where('id', '=', service.id).execute()

    return res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// ── POST /api/services/:serviceId/contracts ────────────────────────────────────

const CreateContractSchema = z.object({
  name:        z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  amount:      z.number().min(0),
  start_date:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status:      z.enum(['ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED']).optional(),
})

router.post('/:serviceId/contracts', guard('create', 'ServiceContract'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest

    const body = CreateContractSchema.safeParse(req.body)
    if (!body.success) throw new AppError(400, 'VALIDATION_ERROR')

    const service = await tenantDb
      .selectFrom('services')
      .select('id')
      .where('id', '=', req.params.serviceId)
      .executeTakeFirst()
    if (!service) throw new AppError(404, 'NOT_FOUND')

    const { name, description, amount, start_date, end_date, status } = body.data

    const contract = await tenantDb
      .insertInto('service_contracts')
      .values({
        id:          randomUUID(),
        service_id:  service.id,
        name,
        description: description ?? null,
        amount,
        amount_paid: 0,
        start_date:  start_date ?? null,
        end_date:    end_date ?? null,
        status:      status ?? 'PENDING',
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

    const body = UpdateContractSchema.safeParse(req.body)
    if (!body.success) throw new AppError(400, 'VALIDATION_ERROR')

    const contract = await tenantDb
      .selectFrom('service_contracts')
      .selectAll()
      .where('id', '=', req.params.contractId)
      .where('service_id', '=', req.params.serviceId)
      .executeTakeFirst()
    if (!contract) throw new AppError(404, 'NOT_FOUND')

    const updates: { name?: string; description?: string | null; amount?: number; start_date?: string | null; end_date?: string | null; status?: string } = {}
    if (body.data.name        !== undefined) updates.name        = body.data.name
    if (body.data.description !== undefined) updates.description = body.data.description
    if (body.data.amount      !== undefined) updates.amount      = body.data.amount
    if (body.data.start_date  !== undefined) updates.start_date  = body.data.start_date
    if (body.data.end_date    !== undefined) updates.end_date    = body.data.end_date
    if (body.data.status      !== undefined) updates.status      = body.data.status

    if (Object.keys(updates).length === 0) return res.json(fmtContract(contract))

    const updated = await tenantDb
      .updateTable('service_contracts')
      .set(updates)
      .where('id', '=', req.params.contractId)
      .returningAll()
      .executeTakeFirstOrThrow()

    return res.json(fmtContract(updated))
  } catch (err) {
    next(err)
  }
})

// ── DELETE /api/services/:serviceId/contracts/:contractId ─────────────────────

router.delete('/:serviceId/contracts/:contractId', guard('delete', 'ServiceContract'), async (req: Request, res, next) => {
  try {
    const { tenantDb } = req as AuthRequest

    const contract = await tenantDb
      .selectFrom('service_contracts')
      .select('id')
      .where('id', '=', req.params.contractId)
      .where('service_id', '=', req.params.serviceId)
      .executeTakeFirst()
    if (!contract) throw new AppError(404, 'NOT_FOUND')

    await tenantDb
      .deleteFrom('service_residences')
      .where('service_contract_id', '=', contract.id)
      .execute()
    await tenantDb
      .deleteFrom('service_contracts')
      .where('id', '=', contract.id)
      .execute()

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

    const body = RecordPaymentSchema.safeParse(req.body)
    if (!body.success) throw new AppError(400, 'VALIDATION_ERROR')

    const contract = await tenantDb
      .selectFrom('service_contracts')
      .selectAll()
      .where('id', '=', req.params.contractId)
      .where('service_id', '=', req.params.serviceId)
      .executeTakeFirst()
    if (!contract) throw new AppError(404, 'NOT_FOUND')

    const newPaid = Math.min(
      Number(contract.amount_paid) + body.data.amount,
      Number(contract.amount),
    )

    const updated = await tenantDb
      .updateTable('service_contracts')
      .set({ amount_paid: newPaid })
      .where('id', '=', contract.id)
      .returningAll()
      .executeTakeFirstOrThrow()

    return res.json(fmtContract(updated))
  } catch (err) {
    next(err)
  }
})

export default router
