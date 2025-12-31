FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built files
COPY dist/ ./dist/
COPY package.json ./

# Expose the port Cloud Run will use
EXPOSE 8080

# Set environment variable for Cloud Run
ENV PORT=8080
ENV NODE_ENV=production

# Run the HTTP server
CMD ["node", "dist/server.js"]
