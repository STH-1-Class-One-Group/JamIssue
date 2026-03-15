param(
    [ValidateSet("Setup", "Start", "Stop", "Status")]
    [string]$Action = "Start"
)

$ErrorActionPreference = "Stop"

# 프로젝트 폴더 안에서만 동작하는 portable MySQL 제어 스크립트다.
# 시스템 서비스 등록 없이 데이터 디렉터리와 로그를 .runtime/mysql 아래에 유지한다.

$root = Split-Path -Parent $PSScriptRoot
$runtimeRoot = Join-Path $root ".runtime/mysql"
$version = "8.4.8"
$mysqlHome = Join-Path $runtimeRoot "mysql-$version-winx64"
$localRoot = Join-Path $runtimeRoot "local"
$dataDir = Join-Path $localRoot "data"
$logsDir = Join-Path $localRoot "logs"
$tmpDir = Join-Path $localRoot "tmp"
$configPath = Join-Path $localRoot "my.ini"
$initializedMarker = Join-Path $localRoot ".initialized"
$mysqldExe = Join-Path $mysqlHome "bin/mysqld.exe"
$mysqlExe = Join-Path $mysqlHome "bin/mysql.exe"
$mysqlAdminExe = Join-Path $mysqlHome "bin/mysqladmin.exe"
$schemaPath = Join-Path $root "backend/sql/schema.sql"
$stdoutPath = Join-Path $logsDir "mysqld.stdout.log"
$stderrPath = Join-Path $logsDir "mysqld.stderr.log"
$port = 3306
$bindHost = "127.0.0.1"

function Normalize-Path {
    param([Parameter(Mandatory = $true)][string]$Path)
    return $Path.Replace("\", "/")
}

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

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-TcpPort -TargetHost $TargetHost -Port $Port) {
            return
        }

        Start-Sleep -Milliseconds 500
    }

    throw "MySQL 포트 $Port 가 제시간 안에 열리지 않았습니다."
}

function Get-LocalMySqlProcess {
    Get-Process mysqld -ErrorAction SilentlyContinue | Sort-Object StartTime -Descending
}

function Start-HiddenProcess {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$ArgumentList,
        [Parameter(Mandatory = $true)][string]$WorkingDirectory,
        [Parameter(Mandatory = $true)][string]$StdOut,
        [Parameter(Mandatory = $true)][string]$StdErr
    )

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

function Write-MySqlConfig {
    foreach ($dir in @($localRoot, $dataDir, $logsDir, $tmpDir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }

    $myIni = @"
[mysqld]
basedir=$(Normalize-Path -Path $mysqlHome)
datadir=$(Normalize-Path -Path $dataDir)
port=$port
bind-address=$bindHost
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
default-time-zone=+09:00
mysqlx=0
tmpdir=$(Normalize-Path -Path $tmpDir)
log-error=$(Normalize-Path -Path (Join-Path $logsDir "mysqld.err.log"))

[client]
port=$port
default-character-set=utf8mb4
"@

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($configPath, $myIni, $utf8NoBom)
}

function Invoke-MySqlQuery {
    param(
        [Parameter(Mandatory = $true)][string]$Query,
        [string]$Database
    )

    $arguments = @(
        "--protocol=tcp",
        "--host=$bindHost",
        "--port=$port",
        "-u",
        "root",
        "--default-character-set=utf8mb4"
    )

    if ($Database) {
        $arguments += $Database
    }

    $arguments += @("-e", $Query)
    & $mysqlExe @arguments
    if ($LASTEXITCODE -ne 0) {
        throw "MySQL 쿼리 실행에 실패했습니다: $Query"
    }
}

function Import-MySqlSchema {
    $schemaContent = Get-Content -Path $schemaPath -Raw
    $schemaContent | & $mysqlExe `
        --protocol=tcp `
        --host=$bindHost `
        --port=$port `
        -u root `
        --default-character-set=utf8mb4 `
        jamissue

    if ($LASTEXITCODE -ne 0) {
        throw "schema.sql 적용에 실패했습니다."
    }
}

function Start-MySqlProcess {
    if (-not (Test-Path $mysqldExe)) {
        throw "local MySQL 바이너리가 없습니다. scripts/install-local-mysql.ps1 을 먼저 실행해 주세요."
    }

    if (Test-TcpPort -TargetHost $bindHost -Port $port) {
        $process = Get-LocalMySqlProcess | Select-Object -First 1
        if ($null -eq $process) {
            throw "포트 $port 를 다른 프로세스가 사용 중입니다."
        }

        return [int]$process.Id
    }

    $process = Start-HiddenProcess `
        -FilePath $mysqldExe `
        -ArgumentList @("--defaults-file=$configPath") `
        -WorkingDirectory (Split-Path $mysqldExe) `
        -StdOut $stdoutPath `
        -StdErr $stderrPath

    Wait-TcpPort -TargetHost $bindHost -Port $port
    return [int]$process.Id
}

function Stop-MySqlProcess {
    if (-not (Test-TcpPort -TargetHost $bindHost -Port $port)) {
        return
    }

    if (Test-Path $mysqlAdminExe) {
        & $mysqlAdminExe `
            --protocol=tcp `
            --host=$bindHost `
            --port=$port `
            -u root `
            shutdown | Out-Null

        if ($LASTEXITCODE -eq 0) {
            return
        }
    }

    foreach ($process in @(Get-LocalMySqlProcess)) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
}

function Initialize-MySql {
    Write-MySqlConfig

    if (Test-Path $initializedMarker) {
        return
    }

    if (Test-TcpPort -TargetHost $bindHost -Port $port) {
        throw "초기화 전에 포트 $port 를 비워야 합니다."
    }

    foreach ($dir in @($dataDir, $logsDir, $tmpDir)) {
        if (Test-Path $dir) {
            Get-ChildItem -Path $dir -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        }
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }

    & $mysqldExe "--defaults-file=$configPath" "--initialize-insecure" "--console"
    if ($LASTEXITCODE -ne 0) {
        throw "MySQL 데이터 디렉터리 초기화에 실패했습니다."
    }

    $null = Start-MySqlProcess
    try {
        Invoke-MySqlQuery -Query "CREATE DATABASE IF NOT EXISTS jamissue CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
        Invoke-MySqlQuery -Query "CREATE USER IF NOT EXISTS 'jamissue'@'127.0.0.1' IDENTIFIED BY 'jamissue';"
        Invoke-MySqlQuery -Query "CREATE USER IF NOT EXISTS 'jamissue'@'localhost' IDENTIFIED BY 'jamissue';"
        Invoke-MySqlQuery -Query "GRANT ALL PRIVILEGES ON jamissue.* TO 'jamissue'@'127.0.0.1';"
        Invoke-MySqlQuery -Query "GRANT ALL PRIVILEGES ON jamissue.* TO 'jamissue'@'localhost';"
        Invoke-MySqlQuery -Query "FLUSH PRIVILEGES;"
        Import-MySqlSchema
        Set-Content -Path $initializedMarker -Value (Get-Date -Format o) -Encoding utf8
    } finally {
        Stop-MySqlProcess
        Start-Sleep -Seconds 2
    }
}

function Get-StatusPayload {
    [ordered]@{
        installed = Test-Path $mysqldExe
        initialized = Test-Path $initializedMarker
        running = Test-TcpPort -TargetHost $bindHost -Port $port
        port = $port
        dataDir = $dataDir
        configPath = $configPath
        stdoutLog = $stdoutPath
        stderrLog = $stderrPath
    } | ConvertTo-Json -Compress
}

switch ($Action) {
    "Setup" {
        Initialize-MySql
        Get-StatusPayload
    }
    "Start" {
        Initialize-MySql
        $mysqlPid = Start-MySqlProcess
        [ordered]@{
            pid = $mysqlPid
            host = $bindHost
            port = $port
            dataDir = $dataDir
            stdoutLog = $stdoutPath
            stderrLog = $stderrPath
        } | ConvertTo-Json -Compress
    }
    "Stop" {
        Stop-MySqlProcess
        Get-StatusPayload
    }
    "Status" {
        Get-StatusPayload
    }
}