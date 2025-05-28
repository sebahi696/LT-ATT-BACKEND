@echo off
cd /d %~dp0\client
ngrok http 3000
pause 