# Quick Deployment Script

Write-Host "🚀 Speed Test App - Deployment Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "📦 Initializing Git repository..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Initial commit: Speed Test App"
    Write-Host "✅ Git initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git already initialized" -ForegroundColor Green
}

Write-Host ""
Write-Host "Choose deployment platform:" -ForegroundColor Cyan
Write-Host "1. Railway (Recommended - Free)" -ForegroundColor White
Write-Host "2. Vercel (Best for frontend)" -ForegroundColor White
Write-Host "3. Render (Good alternative)" -ForegroundColor White
Write-Host "4. Manual deployment instructions" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚂 Railway Deployment" -ForegroundColor Magenta
        Write-Host "=====================" -ForegroundColor Magenta
        Write-Host ""
        Write-Host "Step 1: Install Railway CLI" -ForegroundColor Yellow
        Write-Host "Run: npm install -g railway" -ForegroundColor White
        Write-Host ""
        Write-Host "Step 2: Login to Railway" -ForegroundColor Yellow
        Write-Host "Run: railway login" -ForegroundColor White
        Write-Host ""
        Write-Host "Step 3: Deploy Backend" -ForegroundColor Yellow
        Write-Host "cd server" -ForegroundColor White
        Write-Host "railway init" -ForegroundColor White
        Write-Host "railway up" -ForegroundColor White
        Write-Host ""
        Write-Host "Step 4: Deploy Frontend" -ForegroundColor Yellow
        Write-Host "cd ../client" -ForegroundColor White
        Write-Host "railway init" -ForegroundColor White
        Write-Host "railway up" -ForegroundColor White
        Write-Host ""
        Write-Host "✨ After deployment, update the backend URL in client/vite.config.ts" -ForegroundColor Green
    }
    
    "2" {
        Write-Host ""
        Write-Host "▲ Vercel Deployment" -ForegroundColor Magenta
        Write-Host "===================" -ForegroundColor Magenta
        Write-Host ""
        Write-Host "Step 1: Install Vercel CLI" -ForegroundColor Yellow
        Write-Host "Run: npm install -g vercel" -ForegroundColor White
        Write-Host ""
        Write-Host "Step 2: Deploy Backend" -ForegroundColor Yellow
        Write-Host "cd server" -ForegroundColor White
        Write-Host "vercel --prod" -ForegroundColor White
        Write-Host ""
        Write-Host "Step 3: Deploy Frontend" -ForegroundColor Yellow
        Write-Host "cd ../client" -ForegroundColor White
        Write-Host "vercel --prod" -ForegroundColor White
        Write-Host ""
        Write-Host "✨ Update backend URL in client/vite.config.ts with Vercel backend URL" -ForegroundColor Green
    }
    
    "3" {
        Write-Host ""
        Write-Host "🎨 Render Deployment" -ForegroundColor Magenta
        Write-Host "====================" -ForegroundColor Magenta
        Write-Host ""
        Write-Host "1. Go to https://render.com" -ForegroundColor White
        Write-Host "2. Sign up / Login" -ForegroundColor White
        Write-Host "3. New > Web Service" -ForegroundColor White
        Write-Host "4. Connect GitHub repository" -ForegroundColor White
        Write-Host "5. Create two services:" -ForegroundColor White
        Write-Host "   - Backend: Root = server, Build = npm install && npm run build, Start = npm start" -ForegroundColor Gray
        Write-Host "   - Frontend: Root = client, Build = npm install && npm run build, Start = npm run preview" -ForegroundColor Gray
        Write-Host ""
        Write-Host "✨ Update backend URL in client/vite.config.ts" -ForegroundColor Green
    }
    
    "4" {
        Write-Host ""
        Write-Host "📖 Manual Deployment Instructions" -ForegroundColor Magenta
        Write-Host "=================================" -ForegroundColor Magenta
        Write-Host ""
        Write-Host "Full guide available in DEPLOYMENT.md" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Quick steps:" -ForegroundColor White
        Write-Host "1. Push code to GitHub" -ForegroundColor Gray
        Write-Host "2. Deploy backend to Railway/Render/Vercel" -ForegroundColor Gray
        Write-Host "3. Get backend URL (https://your-app.railway.app)" -ForegroundColor Gray
        Write-Host "4. Update client/vite.config.ts with backend URL" -ForegroundColor Gray
        Write-Host "5. Deploy frontend to Vercel/Netlify" -ForegroundColor Gray
        Write-Host "6. Update sitemap.xml with your domain" -ForegroundColor Gray
        Write-Host "7. Submit to Google Search Console" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Read DEPLOYMENT.md for detailed instructions!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "- DEPLOYMENT.md - Full deployment guide" -ForegroundColor White
Write-Host "- README.md - Project overview" -ForegroundColor White
Write-Host "- IMPROVEMENTS.md - Technical details" -ForegroundColor White
Write-Host ""
Write-Host "✨ Good luck with your deployment!" -ForegroundColor Green
