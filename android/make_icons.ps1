# Dessine l'icone (blason + repere d'impact) dans toutes les tailles Android, et icon-192.png pour la page.
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
Set-Location $PSScriptRoot

function New-Icon([int]$size, [string]$path) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = "AntiAlias"
    $g.Clear([System.Drawing.ColorTranslator]::FromHtml("#1d3b2a"))
    $c = $size / 2
    $rings = @(@(0.44, "#f7f7f7"), @(0.36, "#222222"), @(0.28, "#2a9de1"), @(0.19, "#e0352b"), @(0.10, "#f5c518"))
    foreach ($r in $rings) {
        $rad = $size * $r[0]
        $b = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($r[1]))
        $g.FillEllipse($b, [single]($c - $rad), [single]($c - $rad), [single](2 * $rad), [single](2 * $rad))
        $b.Dispose()
    }
    # repere d'impact magenta
    $pen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml("#ff2fb0")), ([single]($size * 0.035))
    $x = $c + $size * 0.07; $y = $c - $size * 0.05; $m = $size * 0.07
    $g.DrawEllipse($pen, [single]($x - $m), [single]($y - $m), [single](2 * $m), [single](2 * $m))
    $g.DrawLine($pen, [single]($x - 1.8 * $m), [single]$y, [single]($x + 1.8 * $m), [single]$y)
    $g.DrawLine($pen, [single]$x, [single]($y - 1.8 * $m), [single]$x, [single]($y + 1.8 * $m))
    $pen.Dispose(); $g.Dispose()
    New-Item -ItemType Directory -Force (Split-Path $path) | Out-Null
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$sizes = @{ mdpi = 48; hdpi = 72; xhdpi = 96; xxhdpi = 144; xxxhdpi = 192 }
foreach ($k in $sizes.Keys) { New-Icon $sizes[$k] "$PSScriptRoot\res\mipmap-$k\ic_launcher.png" }
New-Icon 192 "$PSScriptRoot\..\icon-192.png"
New-Icon 512 "$PSScriptRoot\..\icon-512.png"
Write-Host "Icones generees"
