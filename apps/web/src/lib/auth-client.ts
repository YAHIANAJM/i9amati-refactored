import { createAuthClient } from 'better-auth/react'
import { twoFactorClient, magicLinkClient, inferAdditionalFields } from 'better-auth/client/plugins'
import { PlatformRole } from '@i9amati/shared'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  plugins: [
    inferAdditionalFields({
      user: {
        firstName:    { type: 'string', required: false },
        lastName:     { type: 'string', required: false },
        phone:        { type: 'string', required: false },
        platformRole: { type: 'string', required: false },
      },
    }),
    twoFactorClient(),
    magicLinkClient(),
  ],
})


