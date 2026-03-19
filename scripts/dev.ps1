param(
    [ValidateSet("start", "stop", "status", "logs", "build")]
    [string]$Action = "status",
    [switch]$SkipBuild,
    [int]$Lines = 40
)

$ErrorActionPreference = "Stop"

# 로컬 개발 환경 제어 스크립트: MySQL(3306) + FastAPI(8001) + nginx(8000)를 동시 실행
# start  : 필요시 프론트 빌드 후, MySQL, FastAPI, nginx를 백그라운드로 실행
# stop   : 백그라운드 프로세스와 서비스를 종료
# status : 현재 서비스, PID, 로그 파일 정보를 보여줌
# logs   : 주요 로그를 마지막 N줄에서 모아 보여줌 (기본 40줄)
# build  : 프론트엔드 번들만 재빌드

$root = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $root "backend"
$nginxHome = Join-Path $root "infra/nginx"
$nginxExe = Join-Path $root "infra/nginx/dist/nginx-1.29.6/nginx.exe"
$mysqlHome = Join-Path $root ".runtime/mysql/mysql-8.4.8-winx64"
$mysqldExe = Join-Path $mysqlHome "bin/mysqld.exe"
$mysqlConfig = Join-Path $root ".runtime/mysql/local/my.ini"
$statePath = Join-Path $root ".runtime/dev-state.json"
$venvConfig = Join-Path $backendDir ".venv/pyvenv.cfg"
$backendRunner = Join-Path $backendDir "run_appserver.py"
$mysqlStdOut = Join-Path $root ".runtime/mysql/local/logs/mysqld.stdout.log"
$mysqlStdErr = Join-Path $root ".runtime/mysql/local/logs/mysqld.stderr.log"
$backendStdOut = Join-Path $backendDir "uvicorn-8001.out.log"
$backendStdErr = Join-Path $backendDir "uvicorn-8001.err.log"
$nginxStdOut = Join-Path $nginxHome "logs/nginx.stdout.log"
$nginxStdErr = Join-Path $nginxHome "logs/nginx.stderr.log"
$frontendIndex = Join-Path $root "infra/nginx/site/index.html"
$buildScript = Join-Path $PSScriptRoot "build-frontend.ps1"
$mysqlScript = Join-Path $PSScriptRoot "mysql-local.ps1"

function Test-TcpPort {
    param(
        [Parameter(Mandatory = $true)][string]$TargetHost,
        [Parameter(Mandatory = $true)][int]$Port
    )

    $client = $null
    try {
        $client = [System.Net.Sockets.TcpClient]::new()
        $task = $client.ConnectAsync($TargetHost, $Port)
        if (-not $task.Wait(1000)) {
            return $false
        }

        return $client.Connected
    } catch {
        return $false
    } finally {
        if ($null -ne $client) {
            $client.Dispose()
        }
    }
}

function Wait-TcpPort {
    param(
        [Parameter(Mandatory = $true)][string]$TargetHost,
        [Parameter(Mandatory = $true)][int]$Port,
        [int]$TimeoutSeconds = 20
    )

    # 포트 바인딩 확인: 서비스가 정상 시작되었는지 검증 (MySQL 3306, FastAPI 8001, nginx 8000)    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-TcpPort -TargetHost $TargetHost -Port $Port) {
            return
        }

        Start-Sleep -Milliseconds 500
    }

    throw "?ы듃 $Port 媛 ?쒖떆媛??덉뿉 ?대━吏 ?딆븯?듬땲??"
}

function Start-HiddenProcess {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$ArgumentList,
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [Parameter(Mandatory = $true)][string]$StdOut,
        [Parameter(Mandatory = $true)][string]$StdErr
    )

    # 백그라운드 프로세스로 시작 (콘솔 창 보이지 않음, stdout/stderr를 로그 파일에 저장)
    foreach ($path in @($StdOut, $StdErr)) {
        if (Test-Path $path) {
            Remove-Item $path -Force
        }
    }

    if (Test-Path Env:PATH) {
        $env:Path = $env:PATH
        Remove-Item Env:PATH
    }

    Start-Process -FilePath $FilePath `
        -ArgumentList $ArgumentList `
        -WorkingDirectory $WorkingDirectory `
        -RedirectStandardOutput $StdOut `
        -RedirectStandardError $StdErr `
        -WindowStyle Hidden `
        -PassThru
}

function Get-PythonExecutable {
    if (-not (Test-Path $venvConfig)) {
        throw "backend/.venv/pyvenv.cfg 瑜?李얠쓣 ???놁뒿?덈떎. 諛깆뿏??媛?곹솚寃쎌쓣 癒쇱? 以鍮꾪빐 二쇱꽭??"
    }

    $value = Get-Content $venvConfig |
        Where-Object { $_ -like 'executable = *' } |
        ForEach-Object { $_.Split('=', 2)[1].Trim() } |
        Select-Object -First 1

    if (-not $value) {
        throw "pyvenv.cfg ?먯꽌 Python ?ㅽ뻾 寃쎈줈瑜??쎌? 紐삵뻽?듬땲??"
    }

    return $value
}

function Read-State {
    if (-not (Test-Path $statePath)) {
        return $null
    }

    return Get-Content $statePath -Raw | ConvertFrom-Json
}

function Write-State {
    param([Parameter(Mandatory = $true)][object]$State)

    $stateDir = Split-Path -Parent $statePath
    New-Item -ItemType Directory -Force -Path $stateDir | Out-Null
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($statePath, ($State | ConvertTo-Json -Depth 6), $utf8NoBom)
}

function Remove-State {
    if (Test-Path $statePath) {
        Remove-Item $statePath -Force
    }
}

function Test-ProcessId {
    param([int]$ProcessId)

    if (-not $ProcessId) {
        return $false
    }

    return $null -ne (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)
}

function Stop-PortProcess {
    param([Parameter(Mandatory = $true)][int]$Port)

    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
        foreach ($connection in $connections) {
            Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    } catch {
    }
}

function Get-StatusObject {
    $state = Read-State

    return [pscustomobject][ordered]@{
        entrypoint = "http://127.0.0.1:8000"
        stateFile = $statePath
        stateExists = Test-Path $statePath
        builtSiteExists = Test-Path $frontendIndex
        mysql = [ordered]@{
            port = 3306
            running = Test-TcpPort -TargetHost "127.0.0.1" -Port 3306
            pid = if ($state) { $state.mysql.pid } else { $null }
            pidAlive = if ($state) { Test-ProcessId -ProcessId $state.mysql.pid } else { $false }
            stdoutLog = $mysqlStdOut
            stderrLog = $mysqlStdErr
        }
        backend = [ordered]@{
            port = 8001
            running = Test-TcpPort -TargetHost "127.0.0.1" -Port 8001
            pid = if ($state) { $state.backend.pid } else { $null }
            pidAlive = if ($state) { Test-ProcessId -ProcessId $state.backend.pid } else { $false }
            stdoutLog = $backendStdOut
            stderrLog = $backendStdErr
        }
        nginx = [ordered]@{
            port = 8000
            running = Test-TcpPort -TargetHost "127.0.0.1" -Port 8000
            pid = if ($state) { $state.nginx.pid } else { $null }
            pidAlive = if ($state) { Test-ProcessId -ProcessId $state.nginx.pid } else { $false }
            stdoutLog = $nginxStdOut
            stderrLog = $nginxStdErr
        }
    }
}

function Build-Frontend {
    & $buildScript
    if ($LASTEXITCODE -ne 0) {
        throw "?꾨줎???뺤쟻 鍮뚮뱶???ㅽ뙣?덉뒿?덈떎."
    }
}

function Start-Stack {
    $status = Get-StatusObject
    if ($status.mysql.running -or $status.backend.running -or $status.nginx.running) {
        throw "?대? ?쇰? ?꾨줈?몄뒪媛 ?ㅽ뻾 以묒엯?덈떎. 癒쇱? scripts/dev.ps1 stop ???ㅽ뻾??二쇱꽭??"
    }

    if (-not $SkipBuild) {
        Build-Frontend
    }

    & $mysqlScript -Action Setup | Out-Null

    $mysql = Start-HiddenProcess `
        -FilePath $mysqldExe `
        -ArgumentList @("--defaults-file=$mysqlConfig") `
        -WorkingDirectory (Split-Path $mysqldExe) `
        -StdOut $mysqlStdOut `
        -StdErr $mysqlStdErr
    Wait-TcpPort -TargetHost "127.0.0.1" -Port 3306

    $pythonExecutable = Get-PythonExecutable
    $backend = Start-HiddenProcess `
        -FilePath $pythonExecutable `
        -ArgumentList @($backendRunner) `
        -WorkingDirectory $backendDir `
        -StdOut $backendStdOut `
        -StdErr $backendStdErr
    Wait-TcpPort -TargetHost "127.0.0.1" -Port 8001

    $nginx = Start-HiddenProcess `
        -FilePath $nginxExe `
        -ArgumentList @('-p', "$nginxHome/", '-c', "$nginxHome/nginx.conf") `
        -WorkingDirectory $nginxHome `
        -StdOut $nginxStdOut `
        -StdErr $nginxStdErr
    Wait-TcpPort -TargetHost "127.0.0.1" -Port 8000

    Write-State -State ([ordered]@{
        startedAt = (Get-Date).ToString("o")
        mysql = [ordered]@{ pid = $mysql.Id; stdoutLog = $mysqlStdOut; stderrLog = $mysqlStdErr }
        backend = [ordered]@{ pid = $backend.Id; stdoutLog = $backendStdOut; stderrLog = $backendStdErr }
        nginx = [ordered]@{ pid = $nginx.Id; stdoutLog = $nginxStdOut; stderrLog = $nginxStdErr }
    })

    Get-StatusObject | ConvertTo-Json -Depth 6
}

function Stop-Stack {
    $state = Read-State

    if (Test-Path $nginxExe) {
        & $nginxExe -p "$nginxHome/" -c "$nginxHome/nginx.conf" -s stop | Out-Null
    }

    foreach ($processId in @(
        if ($state) { $state.nginx.pid }
        if ($state) { $state.backend.pid }
        if ($state) { $state.mysql.pid }
    )) {
        if ($processId -and (Test-ProcessId -ProcessId $processId)) {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
    }

    Stop-PortProcess -Port 8000
    Stop-PortProcess -Port 8001
    & $mysqlScript -Action Stop | Out-Null

    Remove-State
    Get-StatusObject | ConvertTo-Json -Depth 6
}

function Show-LogSection {
    param(
        [Parameter(Mandatory = $true)][string]$Title,
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][int]$TailLines
    )

    Write-Output ""
    Write-Output "===== $Title ====="
    Write-Output $Path
    if (Test-Path $Path) {
        Get-Content $Path -Tail $TailLines
    } else {
        Write-Output "濡쒓렇 ?뚯씪???꾩쭅 ?놁뒿?덈떎."
    }
}

function Show-Logs {
    Show-LogSection -Title "MySQL stdout" -Path $mysqlStdOut -TailLines $Lines
    Show-LogSection -Title "MySQL stderr" -Path $mysqlStdErr -TailLines $Lines
    Show-LogSection -Title "Backend stdout" -Path $backendStdOut -TailLines $Lines
    Show-LogSection -Title "Backend stderr" -Path $backendStdErr -TailLines $Lines
    Show-LogSection -Title "Nginx stdout" -Path $nginxStdOut -TailLines $Lines
    Show-LogSection -Title "Nginx stderr" -Path $nginxStdErr -TailLines $Lines
}

switch ($Action) {
    "build" {
        Build-Frontend
    }
    "start" {
        Start-Stack
    }
    "stop" {
        Stop-Stack
    }
    "status" {
        Get-StatusObject | ConvertTo-Json -Depth 6
    }
    "logs" {
        Show-Logs
    }
}