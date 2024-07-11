# Use the official Node.js image as the base
FROM node:lts-bookworm-slim

# Install pm2
RUN npm install -g pm2

# Install Avahi dependencies, Python, pip, and build tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        libavahi-compat-libdnssd-dev \
        build-essential \
        avahi-daemon \
        libavahi-common3 \
        libavahi-core7 \
        libc6 \
        libcap2 \
        libdaemon0 \
        libdbus-1-3 \
        libexpat1 \
        adduser \
        dbus \
        lsb-base \
        bind9-host \
        libnss-mdns \
        avahi-autoipd \
    && rm -rf /var/lib/apt/lists/*

# Set environment variable to use native Avahi API
ENV MDNS_USE_NATIVE_AVAHI true

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --unsafe-perm

# Copy the app source code to the container
COPY . .

# Expose the port the app will run on
EXPOSE 4000

# Add a health check (optional)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:4000/health || exit 1

# Start the app using PM2 runtime
CMD ["pm2-runtime", "start", "npm", "--", "start"]
