$ErrorActionPreference = "Stop"

# 팀 저장소 안에만 nginx Windows 바이너리를 받아서 사용합니다.
# 시스템 전역 설치를 건드리지 않기 때문에 로컬 개발 환경을 덜 오염시킵니다.

$root = Split-Path -Parent $PSScriptRoot
$nginxDir = Join-Path $root "infra/nginx"
$zipPath = Join-Path $nginxDir "nginx-1.29.6.zip"
$distPath = Join-Path $nginxDir "dist"

New-Item -ItemType Directory -Force -Path $nginxDir | Out-Null

Invoke-WebRequest -UseBasicParsing "https://nginx.org/download/nginx-1.29.6.zip" -OutFile $zipPath
Expand-Archive -Path $zipPath -DestinationPath $distPath -Force

New-Item -ItemType Directory -Force -Path (Join-Path $nginxDir "conf") | Out-Null
Copy-Item (Join-Path $distPath "nginx-1.29.6/conf/mime.types") (Join-Path $nginxDir "conf/mime.types") -Force

foreach ($dir in "client_body_temp", "proxy_temp", "fastcgi_temp", "uwsgi_temp", "scgi_temp") {
    New-Item -ItemType Directory -Force -Path (Join-Path $nginxDir "temp/$dir") | Out-Null
}

Write-Output "Installed local nginx to $distPath"