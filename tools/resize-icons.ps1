# 品牌图标压缩：统一缩到 240px 宽（原文件可从 git 历史找回）
# 用法：powershell -ExecutionPolicy Bypass -File tools\resize-icons.ps1
Add-Type -AssemblyName System.Drawing
$dir = Join-Path $PSScriptRoot "..\assets\icons"
Get-ChildItem -Path $dir -Filter *.png | ForEach-Object {
  $img = [System.Drawing.Image]::FromFile($_.FullName)
  $w = 240
  $h = [int]([math]::Round($img.Height * $w / $img.Width))
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, 0, 0, $w, $h)
  $g.Dispose()
  $img.Dispose()
  $bmp.Save($_.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host ("{0} -> {1}x{2} {3} KB" -f $_.Name, $w, $h, [int]((Get-Item $_.FullName).Length / 1KB))
}
