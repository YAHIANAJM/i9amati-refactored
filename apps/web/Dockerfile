FROM node:18-alpine

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace package.json files
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm ci

# Copy the rest of the monorepo source code
COPY . .

# Build the web app
WORKDIR /app/apps/web
RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "preview"]
