# Скрипт для автоматического перемещения иконок из папки загрузок

Write-Host "🎨 Перемещение иконок SigmaTrade..." -ForegroundColor Cyan
Write-Host ""

$downloadsPath = "$env:USERPROFILE\Downloads"
$projectPath = "C:\Users\konfu\Desktop\sigmatrade.org"

$files = @(
    "favicon-16x16.png",
    "favicon-32x32.png",
    "apple-touch-icon.png",
    "icon-192x192.png",
    "icon-512x512.png",
    "og-image.jpg"
)

$movedCount = 0
$notFoundCount = 0

foreach ($file in $files) {
    $sourcePath = Join-Path $downloadsPath $file
    $destPath = Join-Path $projectPath $file
    
    if (Test-Path $sourcePath) {
        Move-Item -Path $sourcePath -Destination $destPath -Force
        Write-Host "✅ Перемещен: $file" -ForegroundColor Green
        $movedCount++
    } else {
        Write-Host "❌ Не найден: $file" -ForegroundColor Red
        $notFoundCount++
    }
}

Write-Host ""
Write-Host "📊 Итого:" -ForegroundColor Yellow
Write-Host "   Перемещено: $movedCount файлов" -ForegroundColor Green
Write-Host "   Не найдено: $notFoundCount файлов" -ForegroundColor Red
Write-Host ""

if ($movedCount -eq 6) {
    Write-Host "🎉 Все иконки успешно перемещены!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Следующий шаг:" -ForegroundColor Cyan
    Write-Host "   1. Удалить папку icons-generator (опционально)" -ForegroundColor White
    Write-Host "   2. Выполнить: git add ." -ForegroundColor White
    Write-Host "   3. Выполнить: git commit -m 'assets: add all required icons and og-image'" -ForegroundColor White
    Write-Host "   4. Выполнить: git push origin main" -ForegroundColor White
} else {
    Write-Host "⚠️  Не все файлы найдены. Проверьте:" -ForegroundColor Yellow
    Write-Host "   1. Скачали ли вы все иконки из генераторов?" -ForegroundColor White
    Write-Host "   2. Находятся ли они в папке Загрузки?" -ForegroundColor White
    Write-Host "   3. Правильные ли у них имена?" -ForegroundColor White
}

Write-Host ""
Write-Host "Нажмите любую клавишу для выхода..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
