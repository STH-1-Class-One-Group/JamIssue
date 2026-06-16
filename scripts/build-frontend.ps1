$ErrorActionPreference = "Stop"

# Windows에서 esbuild.exe를 직접 호출해 정적 프론트 번들을 만든다.
# node 기반 빌드 서비스 spawn에 의존하지 않아 PowerShell 실행에서 더 안정적이다.

$root = Split-Path -Parent $PSScriptRoot
$siteDir = Join-Path $root "infra/nginx/site"
$assetsDir = Join-Path $siteDir "assets"
$iconsDir = Join-Path $siteDir "icons"
$esbuildExe = Join-Path $root "node_modules/@esbuild/win32-x64/esbuild.exe"
$iconSourceRelativePath = "src/assets/jamissue-logo.png"
$iconSourcePath = Join-Path $root $iconSourceRelativePath
$iconOutputs = @(
    "jamissue-icon-1024.png",
    "jamissue-maskable-1024.png",
    "apple-touch-icon.png",
    "favicon.png"
)

$appName = "대전잼있슈"
$appShortName = "잼있슈"
$appDescription = "대전을 한 입에 고르는 모바일 여행 앱"
$mapWarning = "PUBLIC_NAVER_MAP_CLIENT_ID 값이 비어 있어 지도 영역은 안내 상태로 표시됩니다."

function Read-PublicEnv {
    $values = @{}
    foreach ($envPath in @((Join-Path $root ".env.example"), (Join-Path $root ".env"))) {
        if (-not (Test-Path $envPath)) {
            continue
        }

        foreach ($line in Get-Content $envPath) {
            $trimmed = $line.Trim()
            if (-not $trimmed -or $trimmed.StartsWith("#") -or -not $trimmed.Contains("=")) {
                continue
            }

            $separatorIndex = $trimmed.IndexOf("=")
            $key = $trimmed.Substring(0, $separatorIndex).Trim()
            $value = $trimmed.Substring($separatorIndex + 1).Trim()
            $values[$key] = $value
        }
    }

    $mapKey = ""
    if ($values.ContainsKey("PUBLIC_NAVER_MAP_CLIENT_ID") -and $values["PUBLIC_NAVER_MAP_CLIENT_ID"] -and $values["PUBLIC_NAVER_MAP_CLIENT_ID"] -ne "YOUR_NAVER_MAP_CLIENT_ID") {
        $mapKey = $values["PUBLIC_NAVER_MAP_CLIENT_ID"]
    } elseif ($values.ContainsKey("NAVER_MAP_CLIENT_ID") -and $values["NAVER_MAP_CLIENT_ID"]) {
        $mapKey = $values["NAVER_MAP_CLIENT_ID"]
    }

    return [ordered]@{
        apiBaseUrl = if ($values.ContainsKey("PUBLIC_APP_BASE_URL")) { $values["PUBLIC_APP_BASE_URL"] } elseif ($values.ContainsKey("APP_BASE_URL")) { $values["APP_BASE_URL"] } else { "" }
        naverMapClientId = $mapKey
    }
}

function Write-Utf8NoBom {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Content
    )

    $directory = Split-Path -Parent $Path
    if ($directory) {
        New-Item -ItemType Directory -Force -Path $directory | Out-Null
    }

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

if (-not (Test-Path $esbuildExe)) {
    throw "esbuild.exe 를 찾을 수 없습니다. 먼저 npm.cmd install 을 실행해 주세요."
}

$publicConfig = Read-PublicEnv
if (-not $publicConfig.naverMapClientId) {
    Write-Warning $mapWarning
}

if (Test-Path $siteDir) {
    Remove-Item $siteDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null
New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null

& $esbuildExe `
    (Join-Path $root "src/main.tsx") `
    "--bundle" `
    "--outdir=$assetsDir" `
    "--public-path=/assets" `
    "--entry-names=main" `
    "--format=esm" `
    "--target=es2020,chrome110,safari16" `
    "--jsx=automatic" `
    "--loader:.css=css" `
    "--loader:.png=file" `
    "--minify" `
    "--log-level=info"

if ($LASTEXITCODE -ne 0) {
    throw "esbuild 정적 번들 생성에 실패했습니다."
}

$manifest = @"
{
  "name": "$appName",
  "short_name": "$appShortName",
  "description": "$appDescription",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fff8fb",
  "theme_color": "#ff7fa8",
  "lang": "ko",
  "icons": [
    {
      "src": "/icons/jamissue-icon-1024.png",
      "sizes": "1024x1024",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/jamissue-maskable-1024.png",
      "sizes": "1024x1024",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
"@

$pagesHeaders = @"
/index.html
  Cache-Control: no-store, no-cache, must-revalidate

/app-config.js
  Cache-Control: no-store, no-cache, must-revalidate

/manifest.webmanifest
  Cache-Control: no-store, no-cache, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/icons/*
  Cache-Control: public, max-age=31536000, immutable
"@

$indexHtml = @"
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>$appName</title>
    <meta name="description" content="$appDescription" />
    <meta name="theme-color" content="#ff7fa8" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <link rel="icon" href="/icons/favicon.png" type="image/png" />
    <link rel="stylesheet" href="/assets/main.css" />
    <script defer src="/app-config.js"></script>
    <script type="module" defer src="/assets/main.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
"@

$appConfig = "window.__JAMISSUE_CONFIG__ = " + ($publicConfig | ConvertTo-Json -Depth 3) + ";`n"

Write-Utf8NoBom -Path (Join-Path $siteDir "index.html") -Content $indexHtml
Write-Utf8NoBom -Path (Join-Path $siteDir "_headers") -Content $pagesHeaders
Write-Utf8NoBom -Path (Join-Path $siteDir "manifest.webmanifest") -Content $manifest
foreach ($iconOutput in $iconOutputs) {
    Copy-Item -Path $iconSourcePath -Destination (Join-Path $iconsDir $iconOutput) -Force
}
Write-Utf8NoBom -Path (Join-Path $siteDir "app-config.js") -Content $appConfig

Write-Output "Built mobile web bundle to $siteDir"
