
# METRICASUR-START.ps1
# Inicia el entorno local de MétricaSur de forma segura.

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$SupabaseApiPort = 54321
$DatabasePort = 54322
$StudioPort = 54323
$AppPort = 3000

function Test-LocalPort {
    param([int]$Port)

    return [bool](Test-NetConnection `
        -ComputerName "127.0.0.1" `
        -Port $Port `
        -InformationLevel Quiet `
        -WarningAction SilentlyContinue)
}

function Wait-ForPort {
    param(
        [int]$Port,
        [int]$TimeoutSeconds = 120
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $deadline) {
        if (Test-LocalPort -Port $Port) {
            return $true
        }

        Start-Sleep -Seconds 2
    }

    return $false
}

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "       METRICASUR - LOCAL START       " -ForegroundColor Cyan
Write-Host "======================================`n" -ForegroundColor Cyan

Set-Location -LiteralPath $ProjectRoot

# 1. Verificar dependencias
Write-Host "[1/6] Verificando dependencias..." -ForegroundColor Yellow

foreach ($command in @("node", "npm.cmd", "docker")) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        throw "No se encontró el comando requerido: $command"
    }
}

if (-not (Test-Path "node_modules")) {
    throw "No existe node_modules. Ejecutá npm.cmd install antes de continuar."
}

if (-not (Test-Path ".env.local")) {
    throw "No existe .env.local. No se iniciará la aplicación sin revisar su configuración."
}

Write-Host "Dependencias disponibles." -ForegroundColor Green

# 2. Verificar Docker
Write-Host "`n[2/6] Verificando Docker..." -ForegroundColor Yellow

docker info --format "{{.ServerVersion}}" | Out-Host

if ($LASTEXITCODE -ne 0) {
    throw "Docker Engine no está disponible. Iniciá Docker Desktop y volvé a ejecutar este script."
}

Write-Host "Docker Engine disponible." -ForegroundColor Green

# 3. Verificar Supabase local
Write-Host "`n[3/6] Verificando Supabase..." -ForegroundColor Yellow

$apiReady = Test-LocalPort -Port $SupabaseApiPort
$dbReady = Test-LocalPort -Port $DatabasePort
$studioReady = Test-LocalPort -Port $StudioPort

if (-not ($apiReady -and $dbReady -and $studioReady)) {
    Write-Host "Supabase no está completamente disponible. Intentando iniciar servicios..." -ForegroundColor Yellow

    npx.cmd supabase start

    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo iniciar Supabase local."
    }
}

if (-not (Wait-ForPort -Port $SupabaseApiPort)) {
    throw "La API de Supabase no respondió."
}

if (-not (Wait-ForPort -Port $DatabasePort)) {
    throw "PostgreSQL no respondió."
}

if (-not (Wait-ForPort -Port $StudioPort)) {
    throw "Supabase Studio no respondió."
}

Write-Host "Supabase API, PostgreSQL y Studio disponibles." -ForegroundColor Green

# 4. Iniciar Next.js
Write-Host "`n[4/6] Verificando Next.js..." -ForegroundColor Yellow

if (Test-LocalPort -Port $AppPort) {
    Write-Host "Ya hay un servicio escuchando en el puerto $AppPort. No se iniciará otro." -ForegroundColor Green
} else {
    Write-Host "Iniciando Next.js en una ventana independiente..." -ForegroundColor Yellow

    Start-Process `
        -FilePath "powershell.exe" `
        -WorkingDirectory $ProjectRoot `
        -ArgumentList @(
            "-NoExit",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            "npm.cmd run dev"
        )

    if (-not (Wait-ForPort -Port $AppPort -TimeoutSeconds 90)) {
        throw "Next.js no respondió en el puerto $AppPort dentro del tiempo esperado."
    }

    Write-Host "Next.js iniciado." -ForegroundColor Green
}

# 5. Abrir recursos
Write-Host "`n[5/6] Abriendo recursos..." -ForegroundColor Yellow

Start-Process "http://localhost:3000"
Start-Process "http://127.0.0.1:54323"
Start-Process "http://127.0.0.1:54324"

# 6. Resumen
Write-Host "`n[6/6] Entorno iniciado." -ForegroundColor Green

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "           METRICASUR READY           " -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan

Write-Host "Aplicación:       http://localhost:3000"
Write-Host "Supabase API:     http://127.0.0.1:54321"
Write-Host "PostgreSQL:       127.0.0.1:54322"
Write-Host "Supabase Studio:  http://127.0.0.1:54323"
Write-Host "Mailpit:          http://127.0.0.1:54324"

Write-Host "`nNo se modificaron las credenciales ni los datos de la base local." -ForegroundColor Green
