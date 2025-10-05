# Быстрый скрипт перемещения иконок

$files = @(
    "favicon-16x16.png",
    "favicon-32x32.png",
    "apple-touch-icon.png",
    "icon-192x192.png",
    "icon-512x512.png",
    "og-image.jpg"
)

$source = "$env:USERPROFILE\Downloads"
$dest = "C:\Users\konfu\Desktop\sigmatrade.org"

Write-Host "Перемещение иконок..." -ForegroundColor Cyan

$moved = 0
foreach ($file in $files) {
    $src = Join-Path $source $file
    if (Test-Path $src) {
        Move-Item $src $dest -Force
        Write-Host "OK: $file" -ForegroundColor Green
        $moved++
    } else {
        Write-Host "NOT FOUND: $file" -ForegroundColor Red
    }
}

Write-Host "`nПеремещено: $moved из 6" -ForegroundColor Yellow
