# Build Stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
# npm ci is faster and more reliable than npm install for builds
RUN npm ci

# Copy source code
COPY . .

RUN npm install

EXPOSE 8000

CMD ["npm", "run", "start:dev"]