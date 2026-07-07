@echo off
setlocal

set "ROOT=%~dp0"

echo Starting AgriConnect backend and frontend...

start "AgriConnect Backend" cmd /k "cd /d "%ROOT%backend" && call mvnw.cmd spring-boot:run"
start "AgriConnect Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run dev"

echo.
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:5173
echo Swagger AI documentation: http://localhost:8080/swagger-ui/index.html#/
echo.
echo Close the opened windows to stop the apps.

endlocal