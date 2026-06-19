FROM node:18-alpine

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace package.json files so npm install can resolve workspaces
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm ci

# Copy the rest of the monorepo source code
COPY . .

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build the API
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]
