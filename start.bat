@echo off
setlocal
cd /d "%~dp0"

REM Port freimachen
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1

REM Dev-Server im Hintergrund (eigenes Fenster minimiert)
start "tradeanalyse" /min cmd /c "npm run dev"

REM Warten bis Server erreichbar (max 60s)
powershell -NoProfile -Command "$ok=$false; for($i=0;$i -lt 30;$i++){ try{ $r=Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -eq 200){$ok=$true;break} }catch{}; Start-Sleep -s 2 }; if(-not $ok){ Write-Host 'Server Timeout' }"

start "" "http://localhost:3000/dashboard"
echo.
echo tradeanalyse laeuft: http://localhost:3000
echo.
echo Fenster kann geschlossen werden. Server laeuft im Hintergrund weiter.
echo Zum Stoppen: stop.bat
pause
