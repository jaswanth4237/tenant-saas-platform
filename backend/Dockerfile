# ---------------------------------------
# Stage 1: Builder (Install all deps)
# ---------------------------------------
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build if needed)
RUN npm install

# Copy source code
COPY . .

# ---------------------------------------
# Stage 2: Production Runner (Lean image)
# ---------------------------------------
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package files again
COPY package*.json ./

# Install ONLY production dependencies to keep image small
RUN npm ci --only=production

# Copy application code from the builder stage
COPY --from=builder /usr/src/app .

# Expose the API port
EXPOSE 5000

# MANDATORY: Run migrations -> Seed -> Start Server
CMD ["sh", "-c", "npm run migrate && npm run seed && npm start"]