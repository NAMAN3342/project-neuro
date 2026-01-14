@echo off
echo Starting BioAmp Signal Processing Backend...
echo.
cd /d "%~dp0backend"
python server.py
pause
