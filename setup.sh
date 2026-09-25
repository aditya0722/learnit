#!/bin/bash
set -e

echo "=== Learnit Backend Setup ==="
echo ""

# 1. Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "[1/4] Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "Docker installed. You may need to log out and back in for group changes to take effect."
else
    echo "[1/4] Docker found: $(docker --version)"
fi

# 2. Check if Docker Compose plugin is available
if ! docker compose version &> /dev/null; then
    echo "[2/4] Docker Compose plugin not found. Installing..."
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin
else
    echo "[2/4] Docker Compose found: $(docker compose version --short)"
fi

# 3. Pull code runner images
echo "[3/4] Pulling code runner images (this may take a few minutes)..."
docker pull node:20-alpine
docker pull python:3.12-alpine
docker pull eclipse-temurin:21-jdk-alpine
docker pull gcc:latest
echo "All code runner images pulled."

# 4. Build and start the backend
echo "[4/4] Building and starting backend..."
docker compose up -d --build

echo ""
echo "=== Setup Complete ==="
echo "Backend running on: http://localhost:5000"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f     - View logs"
echo "  docker compose down        - Stop server"
echo "  docker compose up -d       - Start server"
echo "  docker compose up -d --build - Rebuild and start"
