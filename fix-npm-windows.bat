@echo off
echo 🔧 Windows npm Fix Script for Ninang Rhobby's Cookbook
echo ============================================================

echo 🔍 Checking current npm status...
npm --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ npm is working! Version:
    npm --version
    echo.
    echo 🚀 You can now run: npm start
    pause
    exit /b 0
)

echo ❌ npm not found in PATH. Attempting fixes...

echo.
echo 🔧 Method 1: Refreshing environment variables...
call refreshenv >nul 2>&1

npm --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Fixed! npm is now working.
    npm --version
    echo.
    echo 🚀 You can now run: npm start
    pause
    exit /b 0
)

echo.
echo 🔧 Method 2: Adding Node.js to PATH manually...
set "NODE_PATH=C:\Program Files\nodejs"
set "PATH=%PATH%;%NODE_PATH%"

npm --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Fixed! npm is now working.
    npm --version
    echo.
    echo 🚀 You can now run: npm start
    pause
    exit /b 0
)

echo.
echo 🔧 Method 3: Trying alternative npm locations...
if exist "C:\Program Files\nodejs\npm.cmd" (
    echo ✅ Found npm.cmd, testing...
    "C:\Program Files\nodejs\npm.cmd" --version
    echo.
    echo 💡 npm is installed but not in PATH properly.
    echo    Please add C:\Program Files\nodejs to your PATH.
    pause
    exit /b 0
)

echo.
echo ❌ All automatic fixes failed.
echo.
echo 💡 MANUAL STEPS NEEDED:
echo    1. Open Command Prompt as Administrator
echo    2. Run: where node
echo    3. Note the directory (e.g., C:\Program Files\nodejs)
echo    4. Add that directory to your PATH environment variable
echo    5. Restart your terminal and try: npm start
echo.
echo 🔗 Detailed guide: https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally
echo.
pause
