# Build Stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production Stage
FROM node:20-alpine AS production

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies to keep image small
RUN npm ci --only=production && npm cache clean --force

# Copy built assets from builder stage
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 8000

CMD ["node", "dist/main"]