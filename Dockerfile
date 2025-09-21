# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Compile TypeScript
RUN npm run compile

# Expose port for development server (if needed)
EXPOSE 3000

# Default command
CMD ["npm", "run", "watch"]
