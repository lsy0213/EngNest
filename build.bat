@echo off
chcp 65001 >nul
rem 打包 EngNest：
rem   dist\EngNest\EngNest.exe          直接运行的文件夹版（onedir）
rem   dist\EngNest-<版本>-portable.zip  绿色版压缩包
rem   dist\EngNest-Setup-<版本>.exe     安装包（装了 Inno Setup 6 时才生成：https://jrsoftware.org/isdl.php）
rem 需要先创建 conda 环境：conda create -n engnest python=3.11 -y
rem 然后安装依赖：conda run -n engnest pip install -r requirements-dev.txt
rem 可选：设置环境变量 ENGNEST_SIGN_PFX（代码签名证书 .pfx 路径）和 ENGNEST_SIGN_PASS，会用 signtool 给 exe 签名

cd /d "%~dp0"

if not exist assets\icon.ico (
    echo [1/5] 生成图标...
    conda run -n engnest python tools\make_icon.py || goto :error
)

if not exist assets\ecdict.db (
    echo [1/5] 生成内置词典...
    conda run -n engnest python tools\build_dict.py || goto :error
)

echo [2/5] 运行测试...
conda run --no-capture-output -n engnest python -m pytest -q tests || goto :error

echo [3/5] 生成版本信息...
for /f %%v in ('conda run -n engnest python tools\make_version_info.py') do set VERSION=%%v
if "%VERSION%"=="" goto :error
echo 版本 %VERSION%

echo [4/5] 开始打包，大约需要 1-2 分钟...
conda run --no-capture-output -n engnest python -m PyInstaller --noconfirm --clean EngNest.spec || goto :error

if defined ENGNEST_SIGN_PFX (
    echo 代码签名...
    signtool sign /f "%ENGNEST_SIGN_PFX%" /p "%ENGNEST_SIGN_PASS%" /fd sha256 /tr http://timestamp.digicert.com /td sha256 dist\EngNest\EngNest.exe || goto :error
)

echo [5/5] 生成绿色版压缩包和安装包...
powershell -NoProfile -Command "Compress-Archive -Path 'dist\EngNest' -DestinationPath 'dist\EngNest-%VERSION%-portable.zip' -Force" || goto :error

set ISCC=
for %%p in ("%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe" "%ProgramFiles%\Inno Setup 6\ISCC.exe" "%LocalAppData%\Programs\Inno Setup 6\ISCC.exe") do if exist %%p set ISCC=%%p
if defined ISCC (
    %ISCC% /Q /DAppVersion=%VERSION% installer\EngNest.iss || goto :error
    if defined ENGNEST_SIGN_PFX signtool sign /f "%ENGNEST_SIGN_PFX%" /p "%ENGNEST_SIGN_PASS%" /fd sha256 /tr http://timestamp.digicert.com /td sha256 dist\EngNest-Setup-%VERSION%.exe
) else (
    echo 没有找到 Inno Setup 6，跳过安装包（绿色版压缩包已经生成）。
)

echo.
echo 打包完成：
echo   %~dp0dist\EngNest\EngNest.exe
echo   %~dp0dist\EngNest-%VERSION%-portable.zip
if defined ISCC echo   %~dp0dist\EngNest-Setup-%VERSION%.exe
pause
exit /b 0

:error
echo.
echo 打包失败，请查看上面的错误信息。
pause
exit /b 1
