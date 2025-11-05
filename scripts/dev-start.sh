#!/bin/bash
set -e

echo "Starting Backend Development Environment..."

# Detect docker compose command
if command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

# Start databases
echo "Starting databases..."
$DOCKER_COMPOSE up -d

# Wait for databases
echo "Waiting for databases to initialize..."
sleep 15

# Install dependencies
npm run install-all

# Start services
echo "Starting backend services..."
npm run dev-all
