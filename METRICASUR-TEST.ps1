
param(
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$LogDirectory = Join-Path $ProjectRoot "logs"
$LogPath = Join-Path $LogDirectory "test-$Timestamp.log"
$ReportPath = Join-Path $LogDirectory "test-$Timestamp.csv"

New-Item -ItemType Directory -Force -Path $LogDirectory | Out-Null
Set-Location -LiteralPath $ProjectRoot

$Results = [System.Collections.Generic.List[object]]::new()

function Invoke-ProjectCheck {
    param(
        [string]$Name,
        [string]$Command,
        [string[]]$Arguments
    )

    Write-Host "`n======================================" -ForegroundColor Cyan
    Write-Host "TEST: $Name" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan

    $StartTime = Get-Date

    try {
        & $Command @Arguments
        $ExitCode = $LASTEXITCODE

        if ($null -eq $ExitCode) {
            $ExitCode = 0
        }

        $Status = if ($ExitCode -eq 0) { "PASS" } else { "FAIL" }
    }
    catch {
        Write-Host $_ -ForegroundColor Red
        $ExitCode = 1
        $Status = "FAIL"
    }

    $Duration = [math]::Round(((Get-Date) - $StartTime).TotalSeconds, 2)

    $Results.Add([PSCustomObject]@{
        Test = $Name
        Status = $Status
        ExitCode = $ExitCode
        DurationSeconds = $Duration
    })

    if ($Status -eq "PASS") {
        Write-Host "`n[PASS] $Name ($Duration s)" -ForegroundColor Green
    }
    else {
        Write-Host "`n[FAIL] $Name (exit code $ExitCode)" -ForegroundColor Red
    }
}

try {
    Start-Transcript -Path $LogPath -Force | Out-Null

    Write-Host "`n======================================" -ForegroundColor Cyan
    Write-Host "       METRICASUR - TEST RUNNER       " -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan

    # 1. Preflight
    Write-Host "`n[1/5] Verificando entorno..." -ForegroundColor Yellow

    if (-not (Test-Path "package.json")) {
        throw "No se encontró package.json."
    }

    if (-not (Test-Path "node_modules")) {
        throw "No existe node_modules. Ejecutá npm.cmd install."
    }

    if (-not (Test-Path "supabase/config.toml")) {
        throw "No se encontró supabase/config.toml."
    }

    if (-not (Get-Command "npm.cmd" -ErrorAction SilentlyContinue)) {
        throw "No se encontró npm.cmd."
    }

    Write-Host "Entorno y archivos principales disponibles." -ForegroundColor Green

    # 2. ESLint
    Invoke-ProjectCheck `
        -Name "ESLint" `
        -Command "npm.cmd" `
        -Arguments @("run", "lint")

    # 3. TypeScript
    Invoke-ProjectCheck `
        -Name "TypeScript" `
        -Command "npm.cmd" `
        -Arguments @("run", "typecheck")

    # 4. Vitest
    Invoke-ProjectCheck `
        -Name "Unit and integration tests (Vitest)" `
        -Command "npm.cmd" `
        -Arguments @("run", "test")

    # 5. Production build
    if (-not $SkipBuild) {
        Invoke-ProjectCheck `
            -Name "Next.js production build" `
            -Command "npm.cmd" `
            -Arguments @("run", "build")
    }
    else {
        Write-Host "`nBuild omitido por parámetro -SkipBuild." -ForegroundColor Yellow

        $Results.Add([PSCustomObject]@{
            Test = "Next.js production build"
            Status = "SKIPPED"
            ExitCode = 0
            DurationSeconds = 0
        })
    }
}
catch {
    Write-Host "`nERROR GENERAL: $_" -ForegroundColor Red
}
finally {
    if ($Results.Count -gt 0) {
        $Results |
            Export-Csv -Path $ReportPath -NoTypeInformation -Encoding UTF8

        Write-Host "`n======================================" -ForegroundColor Cyan
        Write-Host "             TEST SUMMARY             " -ForegroundColor Cyan
        Write-Host "======================================" -ForegroundColor Cyan

        $Results | Format-Table -AutoSize

        $Passed = @($Results | Where-Object Status -eq "PASS").Count
        $Failed = @($Results | Where-Object Status -eq "FAIL").Count
        $Skipped = @($Results | Where-Object Status -eq "SKIPPED").Count

        Write-Host "PASS: $Passed" -ForegroundColor Green
        Write-Host "FAIL: $Failed" -ForegroundColor Red
        Write-Host "SKIPPED: $Skipped" -ForegroundColor Yellow

        if ($Failed -gt 0) {
            Write-Host "`nRESULTADO: HAY ERRORES." -ForegroundColor Red
        }
        else {
            Write-Host "`nRESULTADO: TODAS LAS PRUEBAS EJECUTADAS PASARON." -ForegroundColor Green
        }

        Write-Host "`nInforme CSV: $ReportPath"
    }

    try {
        Stop-Transcript | Out-Null
    }
    catch {
        # El transcript puede no haberse iniciado.
    }
}

if (@($Results | Where-Object Status -eq "FAIL").Count -gt 0) {
    exit 1
}

if ($Results.Count -eq 0) {
    exit 1
}

exit 0
