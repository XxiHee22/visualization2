@echo off
echo Opening COVID-19 Visualization in browser...
start http://localhost:8000
echo.
echo If the page doesn't load, make sure the HTTP server is running.
echo You can start it with: python -m http.server 8000
pause
