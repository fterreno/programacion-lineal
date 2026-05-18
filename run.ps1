# run.ps1 - crea/usa entorno virtual, instala dependencias y arranca la app (PowerShell)
$ErrorActionPreference = "Stop"
$venvDir = "$PWD\.venv"
$pythonPath = Join-Path $venvDir "Scripts\python.exe"

if (-not (Test-Path $pythonPath)) {
    Write-Host "Virtual environment no encontrado - creando .venv..."
    python -m venv .venv
    $pythonPath = Join-Path $venvDir "Scripts\python.exe"
}

Write-Host "Instalando/actualizando pip y dependencias desde Docs\requirements.txt..."
& $pythonPath -m pip install --upgrade pip
& $pythonPath -m pip install -r documentacion/requirements.txt

Write-Host "Iniciando la aplicacion (Flask)..."
& $pythonPath main.py
