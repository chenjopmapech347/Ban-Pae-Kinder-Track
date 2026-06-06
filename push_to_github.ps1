# KinderTrack — Push to GitHub
Set-Location $PSScriptRoot

# ลบ stale lock file ถ้ามี
$lock = Join-Path $PSScriptRoot ".git\index.lock"
if (Test-Path $lock) {
    Remove-Item -Force $lock
    Write-Host "Removed stale index.lock" -ForegroundColor Yellow
}

# Stage ทุกไฟล์
git add -A

# Commit
git commit -m "feat: TeachersTab username/PIN columns, teacher self-change PIN, student parentPin editor"

# Push
git push origin main

Write-Host "`nDone! Press any key to close." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
