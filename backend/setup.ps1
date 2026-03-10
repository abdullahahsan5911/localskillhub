# Quick Start Script for Windows

Write-Host "🚀 LocalSkillHub Backend Setup" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (!(Test-Path ".env")) {
    Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created. Please update it with your credentials." -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "🗄️  Database Setup Options:" -ForegroundColor Cyan
Write-Host "1. Use Docker (Recommended for quick start)"
Write-Host "2. Use MongoDB Atlas (Cloud)"
Write-Host "3. Use Local MongoDB"
Write-Host ""

$choice = Read-Host "Select an option (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🐳 Starting MongoDB with Docker..." -ForegroundColor Yellow
        
        # Check if Docker is installed
        $dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
        
        if ($dockerInstalled) {
            docker-compose up -d
            Write-Host "✅ MongoDB and Redis started in Docker" -ForegroundColor Green
            Write-Host "   MongoDB: mongodb://admin:password123@localhost:27017/localskillhub?authSource=admin" -ForegroundColor Gray
            Write-Host "   Redis: localhost:6379" -ForegroundColor Gray
        } else {
            Write-Host "❌ Docker not found. Please install Docker Desktop:" -ForegroundColor Red
            Write-Host "   https://www.docker.com/products/docker-desktop" -ForegroundColor Gray
        }
    }
    "2" {
        Write-Host ""
        Write-Host "☁️  MongoDB Atlas Setup:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://www.mongodb.com/cloud/atlas" -ForegroundColor Gray
        Write-Host "2. Create a free cluster" -ForegroundColor Gray
        Write-Host "3. Get connection string" -ForegroundColor Gray
        Write-Host "4. Update MONGODB_URI in .env file" -ForegroundColor Gray
    }
    "3" {
        Write-Host ""
        Write-Host "💻 Local MongoDB:" -ForegroundColor Yellow
        Write-Host "1. Download from: https://www.mongodb.com/try/download/community" -ForegroundColor Gray
        Write-Host "2. Install and start MongoDB" -ForegroundColor Gray
        Write-Host "3. Update .env: MONGODB_URI=mongodb://localhost:27017/localskillhub" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "▶️  To start the server, run:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
