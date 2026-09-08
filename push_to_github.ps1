param (
    [string]$RepoUrl = ""
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  EM EM WELLNESS - DEPLOY GITHUB & VERCEL  " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check git remote
$ExistingRemote = git remote get-url origin 2>$null

if (-not $ExistingRemote) {
    if (-not $RepoUrl) {
        Write-Host "Chưa cấu hình Git Remote origin!" -ForegroundColor Yellow
        $RepoUrl = Read-Host "Nhập link GitHub repository của bạn (VD: https://github.com/username/em-em-wellness.git)"
    }
    
    if ($RepoUrl) {
        git remote add origin $RepoUrl
        Write-Host "Đã thêm remote origin: $RepoUrl" -ForegroundColor Green
    } else {
        Write-Host "Lỗi: Bạn chưa cung cấp link GitHub Repo." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Đang kết nối tới remote: $ExistingRemote" -ForegroundColor Green
}

Write-Host "`nĐang chuẩn bị code và đẩy lên GitHub (nhánh main)..." -ForegroundColor Yellow

git branch -M main
git add .
$status = git status --porcelain
if ($status) {
    git commit -m "chore: update website source for Vercel auto-deploy"
}

git push -u origin main

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "  THÀNH CÔNG! Code đã được đẩy lên GitHub  " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Vercel sẽ tự động kích hoạt tiến trình CI/CD để build và publish web." -ForegroundColor Cyan
Write-Host "Theo dõi quá trình deploy tại Dashboard của Vercel." -ForegroundColor Cyan
