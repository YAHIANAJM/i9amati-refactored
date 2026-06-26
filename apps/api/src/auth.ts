import { betterAuth } from 'better-auth'
import { admin, twoFactor, emailOTP, magicLink } from 'better-auth/plugins'
import { db } from './db/db'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') ?? [],

  database: {
    db,
    type: 'postgres',
  },

  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      // Recommendation: Avoid awaiting the email sending to prevent timing attacks
      console.log(`Sending reset password to ${user.email}: ${url} : ${token}`)
    }
  },

  user: {
    additionalFields: {
      firstName: { type: 'string', required: false, defaultValue: '' },
      lastName: { type: 'string', required: false, defaultValue: '' },
      phone: { type: 'string', required: false },
      platformRole: { type: 'string', required: false, defaultValue: 'USER' },
      verifiedAt: { type: 'date', required: false },
    },
  },

  session: {
    additionalFields: {
      activeOrganizationId: { type: 'string', required: false },
      profileId: { type: 'string', required: false },
    },
  },

  // Auto-populate activeOrganizationId + profileId on every new session so
  // the tenant middleware works immediately after login without a second round-trip.
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const profile = await db
            .selectFrom('public.profiles')
            .select(['id', 'organization_id'])
            .where('user_id', '=', session.userId)
            .where('deleted_at', 'is', null)
            .executeTakeFirst()

          if (!profile) return

          return {
            data: {
              ...session,
              activeOrganizationId: profile.organization_id,
              profileId: profile.id,
            },
          }
        },
      },
    },
  },

  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID ? {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    } : {}),
    ...(process.env.FACEBOOK_APP_ID ? {
      facebook: {
        clientId: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET!,
      },
    } : {}),
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
