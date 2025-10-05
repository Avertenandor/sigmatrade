# Simple Icon Generator using .NET
Add-Type -AssemblyName System.Drawing

$output = "C:\Users\konfu\Desktop\sigmatrade.org"

Write-Host "Creating icons..." -ForegroundColor Cyan

function New-Icon {
    param($w, $h, $file)
    
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    # Background
    $g.FillRectangle(
        (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(10, 10, 10))),
        0, 0, $w, $h
    )
    
    # Sigma symbol - simple version
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(0, 212, 255), [Math]::Max(2, $w/20))
    $m = $w * 0.25
    $s = $w * 0.5
    
    # Top line
    $g.FillRectangle(
        (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 212, 255))),
        $m, $m, $s, [Math]::Max(2, $w/20)
    )
    
    # Diagonal down
    $g.DrawLine($pen, $m+$s, $m, $m+$s*0.2, $m+$s*0.5)
    
    # Diagonal up  
    $g.DrawLine($pen, $m+$s*0.2, $m+$s*0.5, $m+$s, $m+$s)
    
    # Bottom line
    $g.FillRectangle(
        (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(124, 58, 237))),
        $m, $m+$s, $s, [Math]::Max(2, $w/20)
    )
    
    $g.Dispose()
    $pen.Dispose()
    
    $path = Join-Path $output $file
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    
    Write-Host "OK: $file" -ForegroundColor Green
}

# Create all icons
New-Icon -w 16 -h 16 -file "favicon-16x16.png"
New-Icon -w 32 -h 32 -file "favicon-32x32.png"
New-Icon -w 180 -h 180 -file "apple-touch-icon.png"
New-Icon -w 192 -h 192 -file "icon-192x192.png"
New-Icon -w 512 -h 512 -file "icon-512x512.png"

# OG Image
$og = New-Object System.Drawing.Bitmap(1200, 630)
$g = [System.Drawing.Graphics]::FromImage($og)
$g.FillRectangle(
    (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(10, 10, 10))),
    0, 0, 1200, 630
)
$font = New-Object System.Drawing.Font("Arial", 72, [System.Drawing.FontStyle]::Bold)
$g.DrawString("SigmaTrade", $font, 
    (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)), 400, 200)
$font2 = New-Object System.Drawing.Font("Arial", 32)
$g.DrawString("Real-time Blockchain Monitoring", $font2,
    (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 212, 255))), 400, 320)
$g.Dispose()
$og.Save((Join-Path $output "og-image.jpg"), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$og.Dispose()

Write-Host "OK: og-image.jpg" -ForegroundColor Green
Write-Host ""
Write-Host "DONE! All 6 files created in: $output" -ForegroundColor Green
