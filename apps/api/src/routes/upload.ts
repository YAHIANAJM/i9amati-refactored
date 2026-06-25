import { Router, Request } from 'express'
import multer from 'multer'
import { authenticate } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { minioClient, BUCKET, objectUrl } from '../lib/storage'
import { UPLOAD_ALL_MIME, UPLOAD_MAX_SIZE_BYTES } from '@i9amati/shared'

const router = Router()
router.use(authenticate)

const ALLOWED_MIME = new Set<string>(UPLOAD_ALL_MIME)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) cb(null, true)
    else cb(new AppError(415, `File type not allowed: ${file.mimetype}`))
  },
})

// POST /api/upload?scope=feed|profile|documents|residences
// Body: multipart/form-data, field name "file"
// Returns: { url, key }
router.post('/', upload.single('file'), async (req: Request, res, next) => {
  try {
    if (!req.file) throw new AppError(400, 'No file provided')

    const ext   = (req.file.originalname.split('.').pop() ?? 'bin').toLowerCase()
    const scope = ((req.query.scope as string) ?? 'general').replace(/[^a-z0-9_-]/g, '')
    const key   = `${scope}/${crypto.randomUUID()}.${ext}`

    await minioClient.putObject(
      BUCKET,
      key,
      req.file.buffer,
      req.file.size,
      { 'Content-Type': req.file.mimetype },
    )

    res.status(201).json({ url: objectUrl(key), key })
  } catch (err) { next(err) }
})

export default router
