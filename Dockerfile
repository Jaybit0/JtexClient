FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

# Install core utilities and TeX Live
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    software-properties-common \
    lsb-release \
    ca-certificates \
    sudo \
    build-essential \
    # Option 1: Install TeX Live full (very large image, but complete)
    texlive-full

# Install Node.js (LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs

# Clean up apt caches to reduce image size
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Set working directory for your application
WORKDIR /app

COPY package.json ./

# Install Node.js dependencies
RUN npm install

COPY . .

RUN chmod +x ./install-docker.sh && ./install-docker.sh