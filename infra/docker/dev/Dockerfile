# Development Dockerfile
# Supports hot reloading with volume mounts

FROM node:20-alpine

# Install useful development tools
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code (will be overwritten by volume mount in docker-compose)
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start with hot reloading
CMD ["npm", "run", "dev"]
