# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy bot script and environment variables
COPY . .

# Run the sniping bot
CMD ["node", "snipe.js"]
