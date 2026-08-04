param(
  [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path -Parent $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($OutputPath)) {
  $OutputPath = Join-Path $repoRoot "apps\battle-demo\assets\og-card.png"
}
$outputFullPath = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = Split-Path -Parent $outputFullPath
[System.IO.Directory]::CreateDirectory($outputDirectory) | Out-Null

$width = 1200
$height = 630
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

try {
  $canvas = New-Object System.Drawing.Rectangle(0, 0, $width, $height)
  $background = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $canvas,
    [System.Drawing.Color]::FromArgb(255, 8, 10, 14),
    [System.Drawing.Color]::FromArgb(255, 18, 23, 32),
    22
  )
  $graphics.FillRectangle($background, $canvas)
  $background.Dispose()

  $redBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(88, 240, 75, 75))
  $blueBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(82, 75, 200, 240))
  $redPoints = [System.Drawing.Point[]]@(
    (New-Object System.Drawing.Point(0, 140)),
    (New-Object System.Drawing.Point(395, 630)),
    (New-Object System.Drawing.Point(0, 630))
  )
  $bluePoints = [System.Drawing.Point[]]@(
    (New-Object System.Drawing.Point(1200, 90)),
    (New-Object System.Drawing.Point(790, 630)),
    (New-Object System.Drawing.Point(1200, 630))
  )
  $graphics.FillPolygon($redBrush, $redPoints)
  $graphics.FillPolygon($blueBrush, $bluePoints)
  $redBrush.Dispose()
  $blueBrush.Dispose()

  $gold = [System.Drawing.Color]::FromArgb(255, 238, 194, 84)
  $goldDim = [System.Drawing.Color]::FromArgb(128, 238, 194, 84)
  $white = [System.Drawing.Color]::FromArgb(255, 244, 241, 232)
  $muted = [System.Drawing.Color]::FromArgb(255, 164, 172, 186)
  $line = [System.Drawing.Color]::FromArgb(80, 255, 255, 255)

  $goldPen = New-Object System.Drawing.Pen($gold, 4)
  $goldDimPen = New-Object System.Drawing.Pen($goldDim, 2)
  $linePen = New-Object System.Drawing.Pen($line, 2)
  $graphics.DrawLine($goldPen, 72, 74, 1128, 74)
  $graphics.DrawLine($goldDimPen, 72, 88, 760, 88)

  $brandFont = New-Object System.Drawing.Font("Arial Narrow", 30, ([System.Drawing.FontStyle]::Bold))
  $titleFont = New-Object System.Drawing.Font("Yu Gothic UI", 73, ([System.Drawing.FontStyle]::Bold))
  $subFont = New-Object System.Drawing.Font("Yu Gothic UI", 21, ([System.Drawing.FontStyle]::Regular))
  $chipFont = New-Object System.Drawing.Font("Arial", 12, ([System.Drawing.FontStyle]::Bold))
  $vsFont = New-Object System.Drawing.Font("Arial Narrow", 74, ([System.Drawing.FontStyle]::Bold -bor [System.Drawing.FontStyle]::Italic))
  $brandBrush = New-Object System.Drawing.SolidBrush($gold)
  $whiteBrush = New-Object System.Drawing.SolidBrush($white)
  $mutedBrush = New-Object System.Drawing.SolidBrush($muted)
  $darkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 9, 11, 16))

  $graphics.DrawString("Wrestle-Manager", $brandFont, $brandBrush, 72, 110)
  $graphics.DrawString("無料バトルデモ", $titleFont, $whiteBrush, 66, 162)
  $graphics.DrawString("選手を選んで、ブラウザですぐに1試合。", $subFont, $mutedBrush, 72, 282)

  $chipY = 348
  $chips = @(
    @{ X = 72; W = 176; Text = "NO DOWNLOAD" },
    @{ X = 262; W = 156; Text = "NO LOGIN" },
    @{ X = 432; W = 164; Text = "1 MATCH" }
  )
  foreach ($chip in $chips) {
    $rect = New-Object System.Drawing.Rectangle($chip.X, $chipY, $chip.W, 42)
    $graphics.FillRectangle($darkBrush, $rect)
    $graphics.DrawRectangle($linePen, $rect)
    $textSize = $graphics.MeasureString($chip.Text, $chipFont)
    $textX = $chip.X + (($chip.W - $textSize.Width) / 2)
    $textY = $chipY + (($rect.Height - $textSize.Height) / 2)
    $graphics.DrawString($chip.Text, $chipFont, $mutedBrush, $textX, $textY)
  }

  $faceTiles = @(
    @{ Path = (Join-Path $repoRoot "image\face_tachibana_r.png"); X = 674; Y = 104; S = 136 },
    @{ Path = (Join-Path $repoRoot "image\face_izawa_h.png"); X = 838; Y = 104; S = 136 },
    @{ Path = (Join-Path $repoRoot "image\face_yoneyama_a.png"); X = 1002; Y = 104; S = 136 },
    @{ Path = (Join-Path $repoRoot "image\face_udagawa_r.png"); X = 674; Y = 270; S = 136 },
    @{ Path = (Join-Path $repoRoot "image\face_kikuchi_r.png"); X = 838; Y = 270; S = 136 },
    @{ Path = (Join-Path $repoRoot "image\face_omagoe_y.png"); X = 1002; Y = 270; S = 136 }
  )
  foreach ($tile in $faceTiles) {
    $faceImage = [System.Drawing.Image]::FromFile($tile.Path)
    try {
      $graphics.FillRectangle($darkBrush, $tile.X - 7, $tile.Y - 7, $tile.S + 14, $tile.S + 14)
      $graphics.DrawImage($faceImage, $tile.X, $tile.Y, $tile.S, $tile.S)
      $graphics.DrawRectangle($goldDimPen, $tile.X - 7, $tile.Y - 7, $tile.S + 14, $tile.S + 14)
    }
    finally {
      $faceImage.Dispose()
    }
  }

  $ropePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(190, 225, 229, 235), 3)
  $graphics.DrawLine($ropePen, 0, 468, 1200, 468)
  $graphics.DrawLine($ropePen, 0, 518, 1200, 518)
  $graphics.DrawLine($ropePen, 0, 568, 1200, 568)
  $graphics.FillRectangle($darkBrush, 510, 430, 180, 170)
  $graphics.DrawRectangle($goldPen, 510, 430, 180, 170)
  $vsSize = $graphics.MeasureString("VS", $vsFont)
  $graphics.DrawString("VS", $vsFont, $brandBrush, 600 - ($vsSize.Width / 2), 505 - ($vsSize.Height / 2))

  $graphics.DrawString("ONE MATCH BATTLE / WEB DEMO", $chipFont, $mutedBrush, 72, 594)

  $brandFont.Dispose()
  $titleFont.Dispose()
  $subFont.Dispose()
  $chipFont.Dispose()
  $vsFont.Dispose()
  $brandBrush.Dispose()
  $whiteBrush.Dispose()
  $mutedBrush.Dispose()
  $darkBrush.Dispose()
  $goldPen.Dispose()
  $goldDimPen.Dispose()
  $linePen.Dispose()
  $ropePen.Dispose()

  $bitmap.Save($outputFullPath, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output "Generated: $outputFullPath"
}
finally {
  $graphics.Dispose()
  $bitmap.Dispose()
}
