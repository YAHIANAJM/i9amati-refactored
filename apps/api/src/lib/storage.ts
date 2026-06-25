import { Client } from 'minio'

export const minioClient = new Client({
  endPoint:  process.env.MINIO_ENDPOINT  ?? 'localhost',
  port:      Number(process.env.MINIO_PORT) || 9000,
  useSSL:    process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
})

export const BUCKET     = process.env.MINIO_BUCKET     ?? 'i9amati'
export const PUBLIC_URL = process.env.MINIO_PUBLIC_URL ?? 'http://localhost:9000'

export function objectUrl(key: string): string {
  return `${PUBLIC_URL}/${BUCKET}/${key}`
}
