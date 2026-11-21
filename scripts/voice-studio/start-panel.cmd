@echo off
title SentenceStep Voice Studio
cd /d C:\Looma
echo Starting the panel... (close this window to stop it)
rem Open the browser as soon as the panel answers (waits up to 60 s)
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 60;$i++){ try { Invoke-WebRequest -UseBasicParsing http://127.0.0.1:4410/api/status -TimeoutSec 2 | Out-Null; Start-Process 'http://127.0.0.1:4410'; break } catch { Start-Sleep -Seconds 1 } }"
call npm run voice:panel
pause
