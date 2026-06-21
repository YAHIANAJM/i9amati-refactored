import { createAuthClient } from 'better-auth/react'
import { twoFactorClient, magicLinkClient, inferAdditionalFields } from 'better-auth/client/plugins'
import { PlatformRole } from '@i9amati/shared'

const defaultAuthBaseUrl =
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || defaultAuthBaseUrl,
  plugins: [
    inferAdditionalFields({
      user: {
        firstName:    { type: 'string', required: false },
        lastName:     { type: 'string', required: false },
        phone:        { type: 'string', required: false },
        platformRole: { type: 'string', required: false },
        verifiedAt:   { type: 'string', required: false },
      },
    }),
    twoFactorClient(),
    magicLinkClient(),
  ],
})


