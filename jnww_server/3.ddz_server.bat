set MAIN_JS=%~dp0\ddz_server\app.js
set CONFIG=%~dp0\configs_local.js
call node.exe %MAIN_JS% %CONFIG%
pause