; EngNest 安装包（Inno Setup 6）。build.bat 会自动调用：
;     ISCC /DAppVersion=0.4.0 installer\EngNest.iss
; 输出 dist\EngNest-Setup-<版本>.exe。按用户安装，不需要管理员权限。

#ifndef AppVersion
  #define AppVersion "0.0.0"
#endif

[Setup]
AppId={{6F2C1B7E-9A43-4E1B-8C55-2E8B4D0E7A11}
AppName=EngNest 英语小窝
AppVersion={#AppVersion}
AppPublisher=EngNest
AppPublisherURL=https://github.com/lsy0213/EngNest
DefaultDirName={localappdata}\Programs\EngNest
DefaultGroupName=EngNest
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
OutputDir=..\dist
OutputBaseFilename=EngNest-Setup-{#AppVersion}
SetupIconFile=..\assets\icon.ico
UninstallDisplayIcon={app}\EngNest.exe
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
DisableProgramGroupPage=yes
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
; 简体中文界面：ChineseSimplified.isl 来自 kira-96/Inno-Setup-Chinese-Simplified-Translation（MIT 协议），
; Inno Setup 官方安装包里没有带，所以放在这个文件夹里
Name: "chs"; MessagesFile: "ChineseSimplified.isl"
Name: "en"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "创建桌面快捷方式"; GroupDescription: "快捷方式:"

[Files]
Source: "..\dist\EngNest\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\EngNest 英语小窝"; Filename: "{app}\EngNest.exe"
Name: "{group}\卸载 EngNest"; Filename: "{uninstallexe}"
Name: "{userdesktop}\EngNest 英语小窝"; Filename: "{app}\EngNest.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\EngNest.exe"; Description: "现在打开 EngNest"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
Type: files; Name: "{app}\data_location.txt"

[Code]
var
  DataPage: TInputDirWizardPage;

procedure InitializeWizard;
begin
  { 选择学习数据放在哪里：学习进度、设置、下载的模型和语音缓存。不想放 C 盘就选别的盘 }
  DataPage := CreateInputDirPage(wpSelectDir, '学习数据放在哪里', '学习进度、设置、导入的读物、下载的语音识别模型和语音缓存会放在这个文件夹。',
    '想把数据放在 C 盘以外（比如 E:\AppData\EngNest），在这里改。卸载 EngNest 不会删除这个文件夹里的学习数据。', False, 'EngNest');
  DataPage.Add('');
  DataPage.Values[0] := ExpandConstant('{userappdata}\EngNest');
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
    SaveStringToFile(ExpandConstant('{app}\data_location.txt'), DataPage.Values[0] + #13#10, False);
end;
