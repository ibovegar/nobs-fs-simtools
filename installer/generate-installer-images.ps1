# Regenerates the NSIS header/sidebar bitmaps from installer/assets/icon.png.
# Ported from nobs-fs-app (scripts/generate-installer-images.ps1) so both Nobs
# installers share one look. Run: pnpm installer:images

Add-Type -AssemblyName System.Drawing

function New-InstallerImage {
    param(
        [string]$SourcePng,
        [string]$OutPath,
        [int]$Width,
        [int]$Height,
        [string]$BgHex,
        [double]$LogoScale
    )

    $bg = [System.Drawing.ColorTranslator]::FromHtml($BgHex)
    $canvas = New-Object System.Drawing.Bitmap $Width, $Height
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.Clear($bg)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $src = [System.Drawing.Image]::FromFile($SourcePng)
    $logoH = [Math]::Floor([Math]::Min($Width, $Height) * $LogoScale)
    $logoW = [Math]::Floor($logoH * ($src.Width / $src.Height))
    $x = [Math]::Floor(($Width - $logoW) / 2)
    $y = [Math]::Floor(($Height - $logoH) / 2)
    $g.DrawImage($src, $x, $y, $logoW, $logoH)
    $src.Dispose()

    $canvas.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Bmp)
    $g.Dispose()
    $canvas.Dispose()
    Write-Host "Wrote $OutPath ($Width x $Height)"
}

$assets = Join-Path $PSScriptRoot "assets"
$src = Join-Path $assets "icon.png"
$bg = "#171F24" # --bg (palette.background.default)

# Header (top of every page except welcome/finish)
New-InstallerImage -SourcePng $src -OutPath (Join-Path $assets "header.bmp") -Width 150 -Height 57 -BgHex $bg -LogoScale 0.72

# Sidebar (welcome + finish pages)
New-InstallerImage -SourcePng $src -OutPath (Join-Path $assets "sidebar.bmp") -Width 164 -Height 314 -BgHex $bg -LogoScale 0.45
