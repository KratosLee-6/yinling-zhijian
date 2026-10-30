# Generate assets/og-banner.png (1200x630) for WeChat/social share cards.
# Must be saved as UTF-8 WITH BOM, otherwise Chinese literals misread as GBK.
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "assets\og-banner.png"

$w = 1200; $h = 630
$bmp = [System.Drawing.Bitmap]::new($w, $h)
$g = [System.Drawing.Graphics]::fromImage($bmp)
$g.SmoothingMode = "AntiAlias"
$g.TextRenderingHint = "AntiAlias"

# background: brand orange with a soft bottom band
$bg = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 107, 53))
$g.FillRectangle($bg, 0, 0, $w, $h)
$band = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(28, 255, 255, 255))
$g.FillRectangle($band, 0, 430, $w, 200)

$white = [System.Drawing.Brushes]::White
$fTitle = [System.Drawing.Font]::new("Microsoft YaHei", 130, [System.Drawing.FontStyle]::Bold)
$fSub = [System.Drawing.Font]::new("Microsoft YaHei", 52, [System.Drawing.FontStyle]::Regular)
$fFoot = [System.Drawing.Font]::new("Microsoft YaHei", 34, [System.Drawing.FontStyle]::Regular)

$sf = [System.Drawing.StringFormat]::new()
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

$g.DrawString("银龄指尖", $fTitle, $white, [System.Drawing.RectangleF]::new(0, 120, $w, 220), $sf)
$g.DrawString("让爸妈跟上时代", $fSub, $white, [System.Drawing.RectangleF]::new(0, 350, $w, 90), $sf)
$gray = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(235, 255, 255, 255))
$g.DrawString("61 条分步图解教程 · 字大 · 能朗读 · 免费无广告", $fFoot, $gray, [System.Drawing.RectangleF]::new(0, 480, $w, 70), $sf)

# heart badge
$fHeart = [System.Drawing.Font]::new("Segoe UI Emoji", 60)
$g.DrawString("❤", $fHeart, $white, [System.Drawing.RectangleF]::new(0, 20, $w, 100), $sf)

$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output ("saved " + $out + " size=" + (Get-Item $out).Length)
