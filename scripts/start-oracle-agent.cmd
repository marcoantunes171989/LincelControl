@echo off
setlocal

rem LicenControl Oracle Agent — inicia a API local (server/) que fala com o
rem Oracle da rede do cliente via node-oracledb Thin Mode.
rem Nao guarda senha em nenhum lugar: a senha Oracle so existe em memoria
rem enquanto este processo estiver rodando (tela de Oracle Logon).

cd /d "%~dp0.."

where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado no PATH.
  echo Instale o Node.js 18+ ^(recomendado 20 LTS^) e tente novamente.
  echo https://nodejs.org/
  pause
  exit /b 1
)

if not exist "server\node_modules" (
  echo [INFO] Instalando dependencias do agente ^(server\^)...
  call npm install --prefix server
  if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias do agente.
    pause
    exit /b 1
  )
)

echo.
echo ============================================================
echo  LicenControl Oracle Agent
echo  API local (nao expoe a rede do cliente para a internet)
echo  Padrao: http://127.0.0.1:8787
echo ============================================================
echo.

call npm run dev --prefix server
set EXITCODE=%ERRORLEVEL%

if not "%EXITCODE%"=="0" (
  echo.
  echo [ERRO] O agente encerrou com codigo %EXITCODE%.
  echo Verifique a mensagem acima ^(porta em uso, dependencia faltando, etc^).
  pause
  exit /b %EXITCODE%
)

pause
