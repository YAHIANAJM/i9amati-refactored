import { betterAuth } from 'better-auth'
import { admin, twoFactor, emailOTP, magicLink } from 'better-auth/plugins'
import { db } from './db/db'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') ?? [],

  // Pass the Kysely instance directly — Better Auth uses it with its built-in
  // Kysely adapter, which handles migrations via the BA CLI.
  database: {
    db,
    type: 'postgres',
  },

  emailAndPassword: {
    enabled: true,
  },

  user: {
    additionalFields: {
      firstName:    { type: 'string',  required: false, defaultValue: '' },
      lastName:     { type: 'string',  required: false, defaultValue: '' },
      phone:        { type: 'string',  required: false },
      platformRole: { type: 'string',  required: false, defaultValue: 'USER' },
      verifiedAt:   { type: 'date',    required: false },
    },
  },

  session: {
    additionalFields: {
      activeOrganizationId: { type: 'string', required: false },
      profileId:            { type: 'string', required: false },
    },
  },

  plugins: [
    admin(),
    twoFactor(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        console.log(`Sending ${type} OTP to ${email}: ${otp}`)
      },
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        console.log(`Sending magic link to ${email}: ${url}`)
      },
    }),
  ],
})
