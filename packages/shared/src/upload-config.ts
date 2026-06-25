export const UPLOAD_IMAGE_MIME    = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
export const UPLOAD_VIDEO_MIME    = ['video/mp4', 'video/quicktime'] as const
export const UPLOAD_DOCUMENT_MIME = ['application/pdf'] as const
export const UPLOAD_MEDIA_MIME    = [...UPLOAD_IMAGE_MIME, ...UPLOAD_VIDEO_MIME] as const
export const UPLOAD_ALL_MIME      = [...UPLOAD_MEDIA_MIME, ...UPLOAD_DOCUMENT_MIME] as const

export const UPLOAD_MAX_SIZE_BYTES = 20 * 1024 * 1024
export const UPLOAD_MAX_SIZE_LABEL = '20 MB'

export type UploadMediaType = 'image' | 'video'

export function mimeToMediaType(mime: string): UploadMediaType {
  return mime.startsWith('image/') ? 'image' : 'video'
}
