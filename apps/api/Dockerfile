FROM node:22-alpine

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
RUN npm install --workspaces --include-workspace-root

# Copy the rest of the monorepo source code
COPY . .

# Build shared package first so runtime imports resolve to compiled JS.
WORKDIR /app/packages/shared
RUN npm run build

# Build the API
WORKDIR /app/apps/api
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]
