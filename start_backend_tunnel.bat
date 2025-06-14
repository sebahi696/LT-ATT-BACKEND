@echo off
cd /d %~dp0
ngrok http 5001
pause 