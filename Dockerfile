# Stage 1: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency specifications and install dependencies
COPY package*.json ./
RUN npm ci

# Copy full source and compile build targets (Vite client + Server bundle)
COPY . .
RUN npm run build

# Stage 2: Final minimal production environment
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled resources from builder stage
COPY --from=builder /app/dist ./dist

# Expose standard port and set run target
EXPOSE 8080
CMD ["npm", "run", "start"]
