@echo off
REM Launch `next dev` with the project as CWD and Node on PATH.
REM Used by ../.claude/launch.json for the in-app browser preview.
cd /d "%~dp0.."
set "PATH=C:\Program Files\nodejs;%PATH%"
"C:\Program Files\nodejs\node.exe" "%~dp0..\node_modules\next\dist\bin\next" dev
