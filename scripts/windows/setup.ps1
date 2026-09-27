<#
.SYNOPSIS
  Installs or updates SEO Daily in C:\cloude\seodaily and runs it with Docker.

.DESCRIPTION
  - Clones the repository (first run) or pulls the latest commit.
  - Creates .env with random secrets on the first run and prints the admin login.
  - Builds and starts the containers, waits until the site is healthy and opens it.
  - With -AutoUpdate, registers a scheduled task that repeats this every 15 minutes
    (it only rebuilds when a new commit arrived).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File C:\cloude\seodaily\scripts\windows\setup.ps1

.EXAMPLE
  # Docker Hub blocked? Use a mirror for the base images (saved into .env):
  powershell -ExecutionPolicy Bypass -File .\scripts\windows\setup.ps1 -Mirror docker.arvancloud.ir
#>
[CmdletBinding()]
param(
    [string]$Path = "C:\cloude\seodaily",
    [string]$Repo = "https://github.com/irancss/seodaily.git",
    [string]$Branch = "main",
    [int]$Port = 3000,
    # Registry host that mirrors Docker Hub, e.g. docker.arvancloud.ir
    [string]$Mirror = "",
    # Register a scheduled task that keeps the local copy up to date.
    [switch]$AutoUpdate,
    # Used by the scheduled task: stay quiet and skip the rebuild when nothing changed.
    [switch]$Quiet
)

# Native tools (git, docker) report failures through $LASTEXITCODE, which is
# checked after each call. "Stop" would turn their stderr progress output into
# terminating errors on Windows PowerShell 5.1.
$ErrorActionPreference = "Continue"

function Say([string]$Text, [string]$Color = "Gray") {
    if (-not $Quiet) { Write-Host $Text -ForegroundColor $Color }
}

function Require([string]$Command, [string]$Hint) {
    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        throw "$Command was not found. $Hint"
    }
}

function New-RandomString([int]$Length, [string]$Alphabet) {
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $rng.Dispose()
    return -join ($bytes | ForEach-Object { $Alphabet[$_ % $Alphabet.Length] })
}

function Set-EnvValue([string]$File, [string]$Key, [string]$Value) {
    $lines = @()
    if (Test-Path $File) { $lines = @(Get-Content $File) }
    $found = $false
    $lines = @($lines | ForEach-Object {
        if ($_ -match "^\s*$Key=") { $found = $true; "$Key=$Value" } else { $_ }
    })
    if (-not $found) { $lines += "$Key=$Value" }
    [System.IO.File]::WriteAllLines($File, [string[]]$lines, (New-Object System.Text.UTF8Encoding $false))
}

function Get-EnvValue([string]$File, [string]$Key) {
    $line = Get-Content $File | Where-Object { $_ -match "^\s*$Key=" } | Select-Object -First 1
    if ($line) { return ($line -split "=", 2)[1].Trim() }
    return $null
}

function Test-PortFree([int]$Number) {
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Number)
        $listener.Start()
        $listener.Stop()
        return $true
    } catch {
        return $false
    }
}

Require git "Install Git for Windows: https://git-scm.com/download/win"
Require docker "Install Docker Desktop: https://www.docker.com/products/docker-desktop/"

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    if ($Quiet) { exit 0 }  # scheduled run while Docker Desktop is closed
    throw "Docker Desktop is not running. Start it and run this script again."
}

# ---------------------------------------------------------------- source code
$changed = $true
if (Test-Path (Join-Path $Path ".git")) {
    Say "Updating $Path ..." Cyan
    $before = (git -C $Path rev-parse HEAD).Trim()
    git -C $Path fetch --quiet origin $Branch
    if ($LASTEXITCODE -ne 0) { throw "git fetch failed" }
    git -C $Path merge --ff-only --quiet "origin/$Branch"
    if ($LASTEXITCODE -ne 0) { throw "git pull failed (local changes in $Path?)" }
    $after = (git -C $Path rev-parse HEAD).Trim()
    $changed = $before -ne $after
} else {
    Say "Cloning into $Path ..." Cyan
    New-Item -ItemType Directory -Force -Path (Split-Path $Path -Parent) -ErrorAction Stop | Out-Null
    git clone --config core.autocrlf=false --branch $Branch $Repo $Path
    if ($LASTEXITCODE -ne 0) { throw "git clone failed" }
}
Set-Location $Path

# ---------------------------------------------------------------- .env
$envFile = Join-Path $Path ".env"
$newCredentials = $null
$project = if ($env:COMPOSE_PROJECT_NAME) { $env:COMPOSE_PROJECT_NAME } else { "seodaily" }
if (-not (Test-Path $envFile)) {
    # A new random database password would not match an existing database.
    $existing = docker volume ls -q --filter "name=^${project}_pgdata$"
    if ($existing) {
        throw @"
.env is missing but the database volume '${project}_pgdata' already exists.
Restore your previous .env into $Path, or delete the old data and start fresh with:
  docker compose -p $project down -v
"@
    }
    $alnum = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
    $adminPassword = New-RandomString 14 $alnum
    $content = @(
        "POSTGRES_DB=seodaily",
        "POSTGRES_USER=seodaily",
        "POSTGRES_PASSWORD=$(New-RandomString 24 $alnum)",
        "SESSION_SECRET=$(New-RandomString 48 $alnum)",
        "ADMIN_EMAIL=admin@seodaily.ir",
        "ADMIN_PASSWORD=$adminPassword",
        "SITE_URL=http://localhost:$Port",
        "COOKIE_SECURE=false",
        "APP_PORT=$Port"
    )
    [System.IO.File]::WriteAllLines($envFile, [string[]]$content, (New-Object System.Text.UTF8Encoding $false))
    $newCredentials = @{ Email = "admin@seodaily.ir"; Password = $adminPassword }
    Say "Created .env with random secrets." Green
}

if ($Mirror) {
    $m = $Mirror.TrimEnd("/")
    Set-EnvValue $envFile "NODE_IMAGE" "$m/node:22-alpine"
    Set-EnvValue $envFile "POSTGRES_IMAGE" "$m/postgres:16-alpine"
    Say "Using base images from $m (saved in .env)." Green
    $changed = $true
}

# ---------------------------------------------------------------- port
$running = (docker compose ps --status running --services 2>$null) -join ","
if ($PSBoundParameters.ContainsKey("Port")) {
    Set-EnvValue $envFile "APP_PORT" "$Port"
    $changed = $true
}
$appPort = [int]((Get-EnvValue $envFile "APP_PORT") -replace "^.*:", "")
if (-not $appPort) { $appPort = 3000 }
# Our own running container holds its port; anything else on it means "busy".
if ($running -notmatch "app" -and -not (Test-PortFree $appPort)) {
    $old = $appPort
    $appPort = 0
    for ($candidate = 3001; $candidate -le 3099; $candidate++) {
        if (Test-PortFree $candidate) { $appPort = $candidate; break }
    }
    if (-not $appPort) {
        $probe = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, 0)
        $probe.Start(); $appPort = $probe.LocalEndpoint.Port; $probe.Stop()
    }
    Set-EnvValue $envFile "APP_PORT" "$appPort"
    $siteUrl = Get-EnvValue $envFile "SITE_URL"
    if (-not $siteUrl -or $siteUrl -match "^http://localhost(:\d+)?/?$") {
        Set-EnvValue $envFile "SITE_URL" "http://localhost:$appPort"
    }
    Say "Port $old is in use; using free port $appPort (saved in .env)." Yellow
    $changed = $true
}

# ---------------------------------------------------------------- containers
if ($changed -or $running -notmatch "app") {
    Say "Building and starting containers (the first build takes a few minutes) ..." Cyan
    docker compose up -d --build
    if ($LASTEXITCODE -ne 0) {
        throw "docker compose failed (see the output above). If images could not be downloaded, run again with -Mirror docker.arvancloud.ir; if the port is busy, pass -Port with a free port; if a network or subnet clashes, set DOCKER_SUBNET in .env."
    }
} else {
    Say "Already up to date and running." Green
}

$url = "http://localhost:$appPort"

$healthy = $false
for ($i = 0; $i -lt 60; $i++) {
    try {
        $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 "$url/api/health"
        if ($r.StatusCode -eq 200) { $healthy = $true; break }
    } catch { }
    Start-Sleep -Seconds 2
}
if (-not $healthy) {
    docker compose logs --tail 60 app
    throw "The site did not become healthy. See the logs above."
}

# ---------------------------------------------------------------- auto update
if ($AutoUpdate) {
    $taskName = "SEO Daily auto update"
    $script = Join-Path $Path "scripts\windows\setup.ps1"
    $action = New-ScheduledTaskAction -Execute "powershell.exe" `
        -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`" -Path `"$Path`" -Quiet"
    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
        -RepetitionInterval (New-TimeSpan -Minutes 15)
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Force -ErrorAction Stop | Out-Null
    Say "Scheduled task '$taskName' checks for updates every 15 minutes." Green
}

if ($Quiet) { exit 0 }

Write-Host ""
Write-Host "SEO Daily is running:" -ForegroundColor Green
Write-Host "  Site:   $url"
Write-Host "  Admin:  $url/admin"
if ($newCredentials) {
    Write-Host "  Email:    $($newCredentials.Email)" -ForegroundColor Yellow
    Write-Host "  Password: $($newCredentials.Password)" -ForegroundColor Yellow
    Write-Host "  (also stored in $envFile - change it in the admin panel under Account)"
} else {
    Write-Host "  Login: ADMIN_EMAIL / ADMIN_PASSWORD from $envFile (only used when the first admin was created)"
}
Start-Process $url
