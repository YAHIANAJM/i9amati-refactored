FROM node:20-alpine

WORKDIR /app

# Install openssl for native crypto/runtime requirements
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

# Build the API
WORKDIR /app/apps/api
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]
