import { z } from 'zod'

export const CreateServiceSchema = z.object({
  name: z.string({
    required_error:     'validation.name.required',
    invalid_type_error: 'validation.name.required',
  }).min(1, { message: 'validation.name.required' }).max(100, { message: 'validation.name.tooLong' }),
  type: z.string({ invalid_type_error: 'validation.serviceType.tooLong' })
    .max(50, { message: 'validation.serviceType.tooLong' }).nullable().optional(),
  contact_info: z.object({
    phone: z.string().optional(),
    email: z.string().email({ message: 'validation.email.invalid' }).optional(),
  }).nullable().optional(),
})

export const UpdateServiceSchema = z.object({
  name: z.string({ invalid_type_error: 'validation.name.required' })
    .min(1, { message: 'validation.name.required' }).max(100, { message: 'validation.name.tooLong' }).optional(),
  type: z.string({ invalid_type_error: 'validation.serviceType.tooLong' })
    .max(50, { message: 'validation.serviceType.tooLong' }).nullable().optional(),
  contact_info: z.object({
    phone: z.string().optional(),
    email: z.string().email({ message: 'validation.email.invalid' }).optional(),
  }).nullable().optional(),
})

export const CreateContractSchema = z.object({
  name: z.string({
    required_error:     'validation.contractName.required',
    invalid_type_error: 'validation.contractName.required',
  }).min(1, { message: 'validation.contractName.required' }).max(200, { message: 'validation.contractName.tooLong' }),
  description: z.string({ invalid_type_error: 'validation.description.tooLong' })
    .max(1000, { message: 'validation.description.tooLong' }).nullable().optional(),
  amount: z.number({
    required_error:     'validation.amount.required',
    invalid_type_error: 'validation.amount.mustBeNumber',
  }).min(0, { message: 'validation.amount.negative' }),
  start_date: z.string({
    required_error:     'validation.date.required',
    invalid_type_error: 'validation.date.format',
  }).regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'validation.date.format' }),
  end_date: z.string({
    required_error:     'validation.date.required',
    invalid_type_error: 'validation.date.format',
  }).regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'validation.date.format' }),
  status: z.enum(['ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED'], {
    errorMap: () => ({ message: 'validation.status.invalid' }),
  }).optional(),
}).refine(
  data => data.end_date >= data.start_date,
  { message: 'validation.date.endBeforeStart', path: ['end_date'] },
)

export const UpdateContractSchema = z.object({
  name: z.string({ invalid_type_error: 'validation.contractName.required' })
    .min(1, { message: 'validation.contractName.required' }).max(200, { message: 'validation.contractName.tooLong' }).optional(),
  description: z.string({ invalid_type_error: 'validation.description.tooLong' })
    .max(1000, { message: 'validation.description.tooLong' }).nullable().optional(),
  amount: z.number({ invalid_type_error: 'validation.amount.mustBeNumber' })
    .min(0, { message: 'validation.amount.negative' }).optional(),
  amount_paid: z.number({ invalid_type_error: 'validation.amount.mustBeNumber' })
    .min(0, { message: 'validation.amount.negative' }).optional(),
  start_date: z.string({ invalid_type_error: 'validation.date.format' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'validation.date.format' }).optional(),
  end_date: z.string({ invalid_type_error: 'validation.date.format' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'validation.date.format' }).optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED'], {
    errorMap: () => ({ message: 'validation.status.invalid' }),
  }).optional(),
}).refine(
  data => !(data.start_date && data.end_date) || data.end_date >= data.start_date,
  { message: 'validation.date.endBeforeStart', path: ['end_date'] },
)

export const RecordPaymentSchema = z.object({
  amount: z.number({
    required_error:     'validation.amount.required',
    invalid_type_error: 'validation.amount.mustBeNumber',
  }).positive({ message: 'validation.amount.positive' }),
})

export const AttachFileSchema = z.object({
  name: z.string({
    required_error:     'validation.fileName.required',
    invalid_type_error: 'validation.fileName.required',
  }).min(1, { message: 'validation.fileName.required' }).max(255, { message: 'validation.fileName.tooLong' }),
  key: z.string({
    required_error:     'validation.fileKey.required',
    invalid_type_error: 'validation.fileKey.required',
  }).min(1, { message: 'validation.fileKey.required' }).max(500, { message: 'validation.fileKey.tooLong' }),
  size: z.number({ invalid_type_error: 'validation.fileSize.invalid' })
    .int({ message: 'validation.fileSize.invalid' }).min(0, { message: 'validation.fileSize.invalid' }).optional(),
})
