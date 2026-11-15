$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
try {
    if (-not (Get-Command node.exe -ErrorAction SilentlyContinue)) { throw 'Instala Node.js para continuar.' }
    Write-Host 'Veterinaria - Inicio local' -ForegroundColor Cyan
    Write-Host 'Usa el usuario root de MySQL local. La clave no se muestra ni se guarda en archivos.'
    $secret = Read-Host 'Contrasena de MySQL (la que elegiste al instalarlo)' -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    try { $env:DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    $env:DB_HOST='127.0.0.1'
    $env:DB_PORT='3306'
    $env:DB_USER='root'
    $env:DB_NAME='veterinaria_db'
    $env:PORT='3000'
    $env:FRONTEND_URL='http://localhost:5173'
    $env:VITE_API_URL='http://localhost:3000/api'
    if (-not (Test-Path 'node_modules\vite\bin\vite.js')) {
        & npm.cmd ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias del frontend.' }
    }
    if (-not (Test-Path 'Backend\node_modules\mysql2\index.js')) {
        & npm.cmd --prefix Backend ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar las dependencias del backend.' }
    }
    & node.exe Backend/scripts/setup-db.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Revisa la contrasena de MySQL y vuelve a abrir INICIAR.cmd.' }
    & npm.cmd --prefix Backend run build
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo compilar el backend.' }
    & node.exe scripts/run-local.mjs
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar la aplicacion. Revisa el mensaje anterior.' }
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
} finally {
    Remove-Item Env:DB_PASSWORD -ErrorAction SilentlyContinue
}
