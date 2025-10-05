# Создание простейших placeholder иконок для быстрого старта
# Эти иконки можно заменить позже на более качественные

Write-Host "🎨 Создание временных иконок для быстрого старта..." -ForegroundColor Cyan
Write-Host ""

$output = "C:\Users\konfu\Desktop\sigmatrade.org"

# Создаем простейшие одноцветные PNG используя .NET
Add-Type -AssemblyName System.Drawing

function Create-SimpleIcon {
    param (
        [int]$width,
        [int]$height,
        [string]$filename
    )
    
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Заливка темным фоном
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(10, 10, 10))
    $graphics.FillRectangle($bgBrush, 0, 0, $width, $height)
    
    # Рисуем простой символ Σ
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(0, 212, 255), [Math]::Max(2, $width / 40))
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    
    $margin = $width * 0.25
    $size = $width * 0.5
    $lineHeight = $width * 0.05
    
    # Верхняя линия
    $graphics.FillRectangle(
        (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 212, 255))),
        $margin, $margin, $size, $lineHeight
    )
    
    # Диагональ вниз
    $graphics.DrawLine($pen, 
        $margin + $size, $margin + $lineHeight,
        $margin + $size * 0.2, $margin + $size * 0.5
    )
    
    # Диагональ вверх
    $graphics.DrawLine($pen,
        $margin + $size * 0.2, $margin + $size * 0.5,
        $margin + $size, $margin + $size - $lineHeight
    )
    
    # Нижняя линия
    $graphics.FillRectangle(
        (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(124, 58, 237))),
        $margin, $margin + $size - $lineHeight, $size, $lineHeight
    )
    
    $graphics.Dispose()
    
    $path = Join-Path $output $filename
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    
    Write-Host "✅ Создан: $filename ($width x $height)" -ForegroundColor Green
}

# Создаем все иконки
Create-SimpleIcon -width 16 -height 16 -filename "favicon-16x16.png"
Create-SimpleIcon -width 32 -height 32 -filename "favicon-32x32.png"
Create-SimpleIcon -width 180 -height 180 -filename "apple-touch-icon.png"
Create-SimpleIcon -width 192 -height 192 -filename "icon-192x192.png"
Create-SimpleIcon -width 512 -height 512 -filename "icon-512x512.png"

# Для OG image создаем больший файл
$ogWidth = 1200
$ogHeight = 630
$ogBmp = New-Object System.Drawing.Bitmap($ogWidth, $ogHeight)
$ogGraphics = [System.Drawing.Graphics]::FromImage($ogBmp)

# Фон
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(10, 10, 10))
$ogGraphics.FillRectangle($bgBrush, 0, 0, $ogWidth, $ogHeight)

# Текст
$font = New-Object System.Drawing.Font("Arial", 72, [System.Drawing.FontStyle]::Bold)
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$ogGraphics.DrawString("SigmaTrade", $font, $textBrush, 400, 200)

$smallFont = New-Object System.Drawing.Font("Arial", 32)
$cyanBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 212, 255))
$ogGraphics.DrawString("Real-time Blockchain Monitoring", $smallFont, $cyanBrush, 400, 320)

$ogGraphics.Dispose()
$font.Dispose()
$smallFont.Dispose()

$ogPath = Join-Path $output "og-image.jpg"
$ogBmp.Save($ogPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$ogBmp.Dispose()

Write-Host "✅ Создан: og-image.jpg (1200 x 630)" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 ВСЕ ИКОНКИ СОЗДАНЫ!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Файлы находятся в:" -ForegroundColor Yellow
Write-Host "   $output" -ForegroundColor White
Write-Host ""
Write-Host "📋 Следующий шаг:" -ForegroundColor Yellow
Write-Host "   cd .." -ForegroundColor Cyan
Write-Host "   dir *.png, *.jpg" -ForegroundColor Cyan
Write-Host ""
