#!/bin/bash
# Dayliff 1000 Eyes — Quick Start Script
set -e

echo "============================================"
echo "  Dayliff 1000 Eyes — Starting Platform"
echo "============================================"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop."
    exit 1
fi

# Check .env
if [ ! -f ".env" ]; then
    echo "⚠️  .env not found. Copying from .env.example..."
    cp .env.example .env
    echo "   → Please edit .env with your GEMINI_API_KEY before proceeding."
fi

echo "🔨 Building and starting services..."
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be ready (30s)..."
sleep 30

echo ""
echo "🌱 Seeding database with synthetic data..."
docker exec dayliff_backend python -m app.seed.cli --count 200 --clear

echo ""
echo "============================================"
echo "✅ Dayliff 1000 Eyes is running!"
echo ""
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo "   Health:    http://localhost:8000/health"
echo "============================================"
