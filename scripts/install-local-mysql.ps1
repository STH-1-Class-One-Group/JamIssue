$ErrorActionPreference = "Stop"

# MySQL을 시스템에 설치하지 않고, 프로젝트 폴더 안에서만 쓰기 위한 다운로드 스크립트다.
# 바이너리와 압축 파일은 모두 .runtime/mysql 아래에만 생성된다.

$root = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $root ".runtime/mysql"
$version = "8.4.8"
$archiveName = "mysql-$version-winx64.zip"
$downloadUrl = "https://cdn.mysql.com//Downloads/MySQL-8.4/$archiveName"
$zipPath = Join-Path $runtimeDir $archiveName
$distPath = Join-Path $runtimeDir "mysql-$version-winx64"

New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

if (-not (Test-Path $zipPath)) {
    Invoke-WebRequest -UseBasicParsing $downloadUrl -OutFile $zipPath
}

if (-not (Test-Path $distPath)) {
    Expand-Archive -Path $zipPath -DestinationPath $runtimeDir -Force
}

Write-Output "Installed local MySQL runtime to $distPath"