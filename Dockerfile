FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install core utilities, TeX Live and Git (required for npm git dependencies)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    curl \
    git \
    gnupg \
    lsb-release \
    software-properties-common \
    texlive-full \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js (LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

# Set working directory for the build
WORKDIR /app

COPY package.json package-lock.json ./

# Install Node.js dependencies
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN chmod +x ./container-setup.sh && ./container-setup.sh

# Default working directory when running the container will be mounted at runtime
WORKDIR /workspace

ENTRYPOINT ["jtex"]
CMD ["help"]
