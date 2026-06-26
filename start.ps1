# Dayliff 1000 Eyes — Quick Start (PowerShell)
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Dayliff 1000 Eyes — Starting Platform" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env not found. Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "   Edit .env with your GEMINI_API_KEY before running." -ForegroundColor Yellow
}

Write-Host "🔨 Building and starting all services..." -ForegroundColor Green
docker-compose up --build -d

Write-Host ""
Write-Host "⏳ Waiting 30s for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "🌱 Seeding database with 200 synthetic requests..." -ForegroundColor Green
docker exec dayliff_backend python -m app.seed.cli --count 200 --clear

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "✅ Dayliff 1000 Eyes is live!" -ForegroundColor Green
Write-Host ""
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "   API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "   Health:    http://localhost:8000/health" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Green
