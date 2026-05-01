FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets
COPY dist ./dist
COPY package*.json ./

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "dist/index.js"]
