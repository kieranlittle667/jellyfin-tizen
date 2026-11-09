param([string]$WebSourcePath = '')
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$webCommit = '0a580ce8df89282dfd120b6d5efb8e106da23bd5'
if (-not $WebSourcePath) { $WebSourcePath = Join-Path $repoRoot '.web-source' }
$patchPath = Join-Path $repoRoot 'patches/jellyfin-web-12.4-accessibility.patch'
function Assert-Command { if ($LASTEXITCODE -ne 0) { throw "Command failed with exit code $LASTEXITCODE" } }
if (-not (Test-Path -LiteralPath $WebSourcePath)) {
    & git clone --depth 1 --branch v12.4 https://github.com/jellyfin/jellyfin-web.git $WebSourcePath
    Assert-Command
}
$actualCommit = & git -C $WebSourcePath rev-parse HEAD
Assert-Command
if ($actualCommit.Trim() -ne $webCommit) { throw 'Web source does not match the pinned release' }
& git -C $WebSourcePath apply --reverse --check $patchPath 2>$null
if ($LASTEXITCODE -ne 0) {
    & git -C $WebSourcePath apply --check $patchPath
    Assert-Command
    & git -C $WebSourcePath apply $patchPath
    Assert-Command
}
Push-Location $WebSourcePath
try {
    & npm.cmd ci --no-audit --no-fund
    Assert-Command
    & npm.cmd test -- src/components/tizenAccessibility.test.js src/components/accessibleItemName.test.js
    Assert-Command
    $priorFonts = $env:USE_SYSTEM_FONTS
    try {
        $env:USE_SYSTEM_FONTS = '1'
        & npm.cmd run build:production
        Assert-Command
    } finally { $env:USE_SYSTEM_FONTS = $priorFonts }
} finally { Pop-Location }
Push-Location $repoRoot
try {
    & node --test (Join-Path $PSScriptRoot 'tizen-profile.test.cjs') (Join-Path $PSScriptRoot 'tizen-navigation.test.cjs')
    Assert-Command
    & npm.cmd ci --ignore-scripts --no-audit --no-fund
    Assert-Command
    $priorWebDir = $env:JELLYFIN_WEB_DIR
    try {
        $env:JELLYFIN_WEB_DIR = Join-Path $WebSourcePath 'dist'
        & npm.cmd run build
        Assert-Command
    } finally { $env:JELLYFIN_WEB_DIR = $priorWebDir }
    & python (Join-Path $PSScriptRoot 'package.py')
    Assert-Command
} finally { Pop-Location }
