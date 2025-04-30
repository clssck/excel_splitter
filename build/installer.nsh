; Modern NSIS configuration for ExcelChopper
Unicode true

; Include necessary NSIS libraries
!include "LogicLib.nsh"
!include "MUI2.nsh"
!include "Sections.nsh"
!include "FileFunc.nsh"
!include "x64.nsh"
!include "WinVer.nsh"

; Define constants
!ifndef STARTMENU_FOLDER
  !define STARTMENU_FOLDER "ExcelChopper"
!endif

!ifndef APP_FILENAME
  !define APP_FILENAME "ExcelChopper.exe"
!endif

!ifndef APP_REGKEY
  !define APP_REGKEY "Software\ExcelChopper"
!endif

!ifndef CONTEXT_VERB
  !define CONTEXT_VERB "SplitWithExcelChopper"
!endif

!ifndef CONTEXT_DISPLAY
  !define CONTEXT_DISPLAY "Split with ExcelChopper"
!endif

; Define shell notification constants
!ifndef SHCNE_ASSOCCHANGED
  !define SHCNE_ASSOCCHANGED 0x08000000
!endif

!ifndef SHCNF_IDLIST
  !define SHCNF_IDLIST 0x0000
!endif

; Define custom macros
!macro CustomRefreshShellIcons
  System::Call 'Shell32::SHChangeNotify(i ${SHCNE_ASSOCCHANGED}, i ${SHCNF_IDLIST}, i 0, i 0)'
!macroend

; Define installer settings
Name "ExcelChopper"
OutFile "Setup.exe"
InstallDir "$PROGRAMFILES\ExcelChopper"
RequestExecutionLevel admin

; MUI Settings
!define MUI_ABORTWARNING

; Define pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Set language
!insertmacro MUI_LANGUAGE "English"

; Custom installation macro
!macro customInstall
  Section "Application Files" SEC_FILES
    SetOutPath "$INSTDIR"

    ; Create Uninstaller
    WriteUninstaller "$INSTDIR\Uninstall.exe"

    ; Create Start Menu Shortcuts
    CreateDirectory "$SMPROGRAMS\${STARTMENU_FOLDER}"
    CreateShortCut "$SMPROGRAMS\${STARTMENU_FOLDER}\ExcelChopper.lnk" "$INSTDIR\${APP_FILENAME}"
    CreateShortCut "$SMPROGRAMS\${STARTMENU_FOLDER}\Uninstall ExcelChopper.lnk" "$INSTDIR\Uninstall.exe"
  SectionEnd
!macroend

; Custom uninstallation macro
!macro customUnInstall
  ; Remove Start Menu Shortcuts
  Delete "$SMPROGRAMS\${STARTMENU_FOLDER}\ExcelChopper.lnk"
  Delete "$SMPROGRAMS\${STARTMENU_FOLDER}\Uninstall ExcelChopper.lnk"
  RMDir "$SMPROGRAMS\${STARTMENU_FOLDER}" ; Remove folder if empty

  ; Remove Context Menu Verb
  DeleteRegKey HKCR "SystemFileAssociations\.xlsx\Shell\${CONTEXT_VERB}"

  ; Refresh shell icons
  !insertmacro CustomRefreshShellIcons

  ; Remove files and main directory
  Delete "$INSTDIR\${APP_FILENAME}"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR" ; Remove installation directory
!macroend
