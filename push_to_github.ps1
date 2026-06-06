# KinderTrack - Push to GitHub
Set-Location $PSScriptRoot

# Remove stale lock file
$lock = Join-Path $PSScriptRoot ".git\index.lock"
if (Test-Path $lock) {
    Remove-Item -Force $lock
    Write-Host "Removed stale index.lock" -ForegroundColor Yellow
}

git add -A
git commit -m "feat: teacher profile - show username readonly + student list for teacher class"
git push origin main

Write-Host "Done!" -ForegroundColor Green
Read-Host "Press Enter to close"
