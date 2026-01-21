# =========================
# Stage 1: Base
# =========================
FROM ubuntu:22.04 AS base

ENV DEBIAN_FRONTEND=noninteractive
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    ca-certificates \
    build-essential \
    python3 \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Add non-root user
RUN groupadd -r appuser && useradd -r -g appuser -s /bin/bash -d /app appuser

# =========================
# Stage 2: Development
# =========================
FROM base AS development

# Install dev tools
RUN apt-get update && apt-get install -y \
    vim \
    nano \
    htop \
    procps \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY --chown=appuser:appuser package.json pnpm-lock.yaml* ./

# Install all dependencies
RUN pnpm install

# Copy source code
COPY --chown=appuser:appuser . .

# Switch to app user
USER appuser

EXPOSE 5000 9229

# Start in development mode
CMD ["pnpm", "run", "start:dev"]

# =========================
# Stage 3: Production
# =========================
FROM base AS production

ENV NODE_ENV=production
ENV HUSKY=0

# Copy package files and install all deps (needed for build)
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy app files and build
COPY . .
RUN pnpm run build

# Remove dev dependencies, source, and cache
# Use --ignore-scripts to skip prepare script (husky) during production install
RUN pnpm install --frozen-lockfile --prod --ignore-scripts && \
    rm -rf src node_modules/.cache .husky && \
    pnpm store prune

# Adjust permissions
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 5000

# Health check for container
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Start in production mode
CMD ["pnpm", "start"]
