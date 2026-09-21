@echo off

:: Change to project root
cd /d "C:\PROGRAMAÇÃO\StudyAi"

:: ---- Backend (FastAPI) ----
rem Open a new CMD window, activate the virtual env and run uvicorn
start "Backend" cmd /k "cd backend && call venv\\Scripts\\activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: ---- Frontend (Next.js) ----
rem Open a new CMD window, install deps (if needed) and start Next dev server
start "Frontend" cmd /k "cd frontend && npm install && npm run dev"

:: Keep this window open so you can see logs
pause
