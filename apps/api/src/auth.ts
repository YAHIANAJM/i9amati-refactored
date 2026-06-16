import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, organization, twoFactor, emailOTP, magicLink } from 'better-auth/plugins';
import { prisma } from './prisma/client';
import { ac, organizationRoles } from '@i9amati/shared';
export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',') : [],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      firstName: { type: 'string', required: false, defaultValue: '' },
      lastName: { type: 'string', required: false, defaultValue: '' },
      phone: { type: 'string', required: false },
    },
  },
  plugins: [
    organization({
      ac: ac,
      roles: organizationRoles,
      defaultRole: 'tenant',
    }),
    admin(),
    twoFactor(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Implement OTP email sending logic here
        console.log(`Sending ${type} OTP to ${email}: ${otp}`);
      }
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        console.log(`Sending Magic Link to ${email}: ${url}`);
      },
    })
  ]
});
