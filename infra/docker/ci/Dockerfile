# CI Dockerfile
# Used for running tests and builds in CI environment

FROM node:20-alpine

# Install git for potential git operations in CI
RUN apk add --no-cache git

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for testing)
RUN npm ci

# Copy all source files
COPY . .

# Run type checking
RUN npm run type-check

# Run linting
RUN npm run lint

# Run tests with coverage
RUN npm run test:coverage

# Build the application
RUN npm run build

# Verify the build succeeded
RUN test -d dist && echo "Build successful"
