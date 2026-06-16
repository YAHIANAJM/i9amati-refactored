import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, organization, twoFactor, emailOTP, magicLink } from 'better-auth/plugins';
import { prisma } from './prisma/client';
import { ac, organizationRoles } from '@i9amati/shared';
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
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
      sendMagicLink: async ({ email, token, url }, request) => {
        // Implement Magic Link email sending logic here
        console.log(`Sending Magic Link to ${email}: ${url}`);
      }
    })
  ]
});
