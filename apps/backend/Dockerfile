FROM node:20-alpine

WORKDIR /app

# Install all dependencies (including dev for build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Prune to production only
RUN npm prune --production

# Copy built assets
COPY dist ./dist

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "dist/index.js"]
