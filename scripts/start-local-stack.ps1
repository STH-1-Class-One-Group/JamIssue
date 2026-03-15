param(
    [switch]$SkipBuild
)

& (Join-Path $PSScriptRoot "dev.ps1") start -SkipBuild:$SkipBuild