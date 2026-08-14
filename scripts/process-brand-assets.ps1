param(
  [string]$SourceRoot = (Join-Path $PSScriptRoot '..\data\uploads'),
  [string]$OutputRoot = (Join-Path $PSScriptRoot '..\apps\web\public\assets\brand')
)

Add-Type -AssemblyName System.Drawing
$sourceRootPath = [System.IO.Path]::GetFullPath($SourceRoot)
$outputRootPath = [System.IO.Path]::GetFullPath($OutputRoot)
[System.IO.Directory]::CreateDirectory($outputRootPath) | Out-Null

function Get-AlphaBounds([System.Drawing.Bitmap]$bitmap) {
  $minX = $bitmap.Width
  $minY = $bitmap.Height
  $maxX = -1
  $maxY = -1
  for ($y = 0; $y -lt $bitmap.Height; $y++) {
    for ($x = 0; $x -lt $bitmap.Width; $x++) {
      if ($bitmap.GetPixel($x, $y).A -gt 8) {
        if ($x -lt $minX) { $minX = $x }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  if ($maxX -lt 0) { throw 'The source image is fully transparent.' }
  return [System.Drawing.Rectangle]::new($minX, $minY, $maxX - $minX + 1, $maxY - $minY + 1)
}

function Copy-Cropped([string]$source, [string]$target, [int]$maxWidth, [System.Drawing.Rectangle]$verifiedBounds) {
  $bitmap = [System.Drawing.Bitmap]::FromFile($source)
  try {
    $bounds = $verifiedBounds
    $scale = [Math]::Min(1.0, [double]$maxWidth / $bounds.Width)
    $width = [Math]::Max(1, [Math]::Round($bounds.Width * $scale))
    $height = [Math]::Max(1, [Math]::Round($bounds.Height * $scale))
    $result = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($result)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $graphics.DrawImage($bitmap, [System.Drawing.Rectangle]::new(0, 0, $width, $height), $bounds, [System.Drawing.GraphicsUnit]::Pixel)
      } finally { $graphics.Dispose() }
      $result.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $result.Dispose() }
  } finally { $bitmap.Dispose() }
}

function Convert-PixelLogo([string]$source, [string]$target, [System.Drawing.Rectangle]$verifiedBounds) {
  $bitmap = [System.Drawing.Bitmap]::FromFile($source)
  try {
    $bounds = $verifiedBounds
    $sampleWidth = 240
    $sampleHeight = [Math]::Max(1, [Math]::Round($bounds.Height * ($sampleWidth / $bounds.Width)))
    $sample = [System.Drawing.Bitmap]::new($sampleWidth, $sampleHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($sample)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
        $graphics.DrawImage($bitmap, [System.Drawing.Rectangle]::new(0, 0, $sampleWidth, $sampleHeight), $bounds, [System.Drawing.GraphicsUnit]::Pixel)
      } finally { $graphics.Dispose() }

      for ($y = 0; $y -lt $sample.Height; $y++) {
        for ($x = 0; $x -lt $sample.Width; $x++) {
          $pixel = $sample.GetPixel($x, $y)
          if ($pixel.A -le 12) { $sample.SetPixel($x, $y, [System.Drawing.Color]::Transparent); continue }
          $r = [Math]::Min(255, [Math]::Round($pixel.R / 32) * 32)
          $g = [Math]::Min(255, [Math]::Round($pixel.G / 32) * 32)
          $b = [Math]::Min(255, [Math]::Round($pixel.B / 32) * 32)
          $a = if ($pixel.A -gt 190) { 255 } elseif ($pixel.A -gt 70) { 180 } else { 0 }
          $sample.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, $r, $g, $b))
        }
      }

      $outputWidth = 720
      $outputHeight = $sampleHeight * 3
      $result = [System.Drawing.Bitmap]::new($outputWidth, $outputHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
      try {
        $outputGraphics = [System.Drawing.Graphics]::FromImage($result)
        try {
          $outputGraphics.Clear([System.Drawing.Color]::Transparent)
          $outputGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
          $outputGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
          $outputGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
          $outputGraphics.DrawImage($sample, 0, 0, $outputWidth, $outputHeight)
        } finally { $outputGraphics.Dispose() }
        $result.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
      } finally { $result.Dispose() }
    } finally { $sample.Dispose() }
  } finally { $bitmap.Dispose() }
}

$sources = Get-ChildItem -LiteralPath $sourceRootPath -Filter '*.png'
$mascotSource = $sources | Where-Object Length -LT 100000 | Select-Object -First 1
$logoSource = $sources | Where-Object Length -GT 100000 | Select-Object -First 1
if (-not $mascotSource -or -not $logoSource) { throw 'Expected one compact mascot PNG and one larger club logo PNG.' }

Copy-Cropped $mascotSource.FullName (Join-Path $outputRootPath 'youzi-mascot.png') 720 ([System.Drawing.Rectangle]::new(180, 270, 1440, 1380))
Convert-PixelLogo $logoSource.FullName (Join-Path $outputRootPath 'zuoyou-logo-pixel.png') ([System.Drawing.Rectangle]::new(317, 508, 1588, 598))

Write-Output "Brand assets written to $outputRootPath"
