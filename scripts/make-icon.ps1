# Build a proper 256x256 ICO from the SVG using only .NET (no extra tools)
# We'll render the SVG concept as a bitmap using GDI+

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$iconSizes = @(256, 128, 64, 48, 32, 16)
$bitmaps = @()

foreach ($size in $iconSizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.Clear([System.Drawing.Color]::Transparent)

    # Background: rounded square, teal gradient
    $radius = [int]($size * 0.18)
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath

    # Draw rounded rectangle path
    $d = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
    $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
    $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
    $path.CloseFigure()

    # Teal background fill (solid, since gradients are complex here)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 20, 184, 166))
    $g.FillPath($brush, $path)

    # Slightly darker teal border
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 0, 0, 0), [float]($size * 0.02))
    $g.DrawPath($pen, $path)

    # Draw the "Z" letter (TeleBridge logo) in white
    $fontSize = [float]($size * 0.55)
    $font = New-Object System.Drawing.Font("Segoe UI", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString("Z", $font, $whiteBrush, [System.Drawing.RectangleF]::FromLTRB(0, 0, $size, $size), $sf)

    $g.Dispose()
    $bitmaps += $bmp
}

# Save as ICO (multi-size)
$icoPath = "C:\Users\Bizcochito\Downloads\TeleBridge\build\icon.ico"
New-Item -ItemType Directory -Force -Path (Split-Path $icoPath) | Out-Null

# Write ICO manually (ICO format)
$ms = New-Object System.IO.MemoryStream
$streams = @()
foreach ($bmp in $bitmaps) {
    $s = New-Object System.IO.MemoryStream
    $bmp.Save($s, [System.Drawing.Imaging.ImageFormat]::Png)
    $streams += $s
}

$writer = New-Object System.IO.BinaryWriter([System.IO.File]::Create($icoPath))
# ICO header
$writer.Write([uint16]0)      # reserved
$writer.Write([uint16]1)      # type: icon
$writer.Write([uint16]$bitmaps.Count)  # count

# Calculate data offset: header(6) + dir_entries(16 * count)
$dataOffset = 6 + (16 * $bitmaps.Count)
$sizes = $iconSizes

for ($i = 0; $i -lt $bitmaps.Count; $i++) {
    $s = $streams[$i]
    $w = $sizes[$i]
    $h = $sizes[$i]
    $writer.Write([byte]$(if ($w -ge 256) { 0 } else { $w }))  # width
    $writer.Write([byte]$(if ($h -ge 256) { 0 } else { $h }))  # height
    $writer.Write([byte]0)     # color count
    $writer.Write([byte]0)     # reserved
    $writer.Write([uint16]1)   # color planes
    $writer.Write([uint16]32)  # bits per pixel
    $writer.Write([uint32]$s.Length)    # size of image data
    $writer.Write([uint32]$dataOffset)  # offset
    $dataOffset += $s.Length
}

foreach ($s in $streams) {
    $writer.Write($s.ToArray())
}
$writer.Close()

Write-Host "ICO created: $icoPath"
