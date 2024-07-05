# Use the official Node.js image for ARM64 architecture as the base image
FROM arm64v8/node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on (if applicable)
EXPOSE 3000

# Command to run the application
CMD ["node", "src/main/index.js"]
