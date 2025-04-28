; Modern NSIS configuration
Unicode true
!include "LogicLib.nsh"
!include "MUI2.nsh"
!include "Sections.nsh"  ; Required for section handling
!insertmacro MUI_PAGE_COMPONENTS

;--------------------------------
; Installation Section
;--------------------------------
!include "x64.nsh"
!include "WinVer.nsh"

; Define Start Menu Folder
!ifndef STARTMENU_FOLDER
  !define STARTMENU_FOLDER "ExcelChopper"
!endif

!macro customInstall
  Section "Application Files" SEC_FILES ; Renamed section for clarity
    SetOutPath "$INSTDIR"
    ; Assume files are packaged here by Electron Builder
    ; Commenting out this line - Electron Builder handles main app file packaging
    ; File /r "./dist/win-unpacked/*.*" ; Adjust path as needed

    ; Create Uninstaller
    WriteUninstaller "$INSTDIR\Uninstall.exe"

    ; Create Start Menu Shortcuts
    CreateDirectory "$SMPROGRAMS\${STARTMENU_FOLDER}"
    CreateShortCut "$SMPROGRAMS\${STARTMENU_FOLDER}\ExcelChopper.lnk" "$INSTDIR\${APP_FILENAME}"
    CreateShortCut "$SMPROGRAMS\${STARTMENU_FOLDER}\Uninstall ExcelChopper.lnk" "$INSTDIR\Uninstall.exe"

  SectionEnd

  /* Temporarily Commented Out Context Menu Section
  Section "Add 'Split with...' to Excel Context Menu (Optional)" SEC_ASSOC
    ; --- Add Context Menu Verb without changing default ---
    ; Verb name (internal)
    !ifndef CONTEXT_VERB
      !define CONTEXT_VERB "SplitWithExcelChopper"
    !endif
    ; Display name (shown in context menu)
    !ifndef CONTEXT_DISPLAY
      !define CONTEXT_DISPLAY "Split with ExcelChopper"
    !endif

    ; Write the registry keys for the context menu item
    WriteRegStr HKCR "SystemFileAssociations\.xlsx\Shell\${CONTEXT_VERB}" "" "${CONTEXT_DISPLAY}"
    WriteRegStr HKCR "SystemFileAssociations\.xlsx\Shell\${CONTEXT_VERB}" "Icon" "$INSTDIR\resources\app.ico"
    WriteRegStr HKCR "SystemFileAssociations\.xlsx\Shell\${CONTEXT_VERB}\command" "" '"$INSTDIR\${APP_FILENAME}" "%1"'

    ; Refresh Shell Icons after association change
    ${RefreshShellIcons}
  SectionEnd
  SectionSetText ${SEC_ASSOC} "Add '${CONTEXT_DISPLAY}' to Excel file context menu" ; Moved definition here
  */

!macroend

!macro RefreshShellIcons
  System::Call 'Shell32::SHChangeNotify(i ${SHCNE_ASSOCCHANGED}, i ${SHCNF_IDLIST}, i 0, i 0)'
!macroend

!macro customUnInstall
  ; Remove Start Menu Shortcuts
  Delete "$SMPROGRAMS\${STARTMENU_FOLDER}\ExcelChopper.lnk"
  Delete "$SMPROGRAMS\${STARTMENU_FOLDER}\Uninstall ExcelChopper.lnk"
  RMDir "$SMPROGRAMS\${STARTMENU_FOLDER}" ; Remove folder if empty

  ; --- Remove Context Menu Verb ---
  !ifndef CONTEXT_VERB
    !define CONTEXT_VERB "SplitWithExcelChopper"
  !endif
  DeleteRegKey HKCR "SystemFileAssociations\.xlsx\Shell\${CONTEXT_VERB}"

  ; Remove App Path registration (If it was ever added - potentially remove this if not needed)
  ; DeleteRegKey SHCTX "Software\Microsoft\Windows\CurrentVersion\App Paths\${APP_FILENAME}"

  ; Refresh shell icons
  ${RefreshShellIcons}

  ; Remove files and main directory
  Delete "$INSTDIR\${APP_FILENAME}"
  Delete "$INSTDIR\Uninstall.exe"
  ; Add other files/folders created during install if needed
  RMDir /r "$INSTDIR" ; Remove installation directory
!macroend

; User-selectable File Associations - Combined into a single optional section
; SectionGroup /e "File Associations" GRP_ASSOC
; Section "Excel Files" SEC_ASSOC
;   ; Modern association using AppAssocReg
;   AppAssocReg::SetAppAsDefaultAll "${APP_FILENAME}" ".xlsx" "ExcelProjectBatchSplitter Document" \
;     "" "$INSTDIR\resources\app.ico" "Split with ExcelProjectBatchSplitter"
; ; This section is controlled by the checkbox
; SectionIn 1 2  # Show in both install types
; SectionSetText ${SEC_ASSOC} "Associate .xlsx files with ExcelProjectBatchSplitter"
; SectionEnd
; SectionGroupEnd

;--------------------------------
; Pages
;--------------------------------
!insertmacro MUI_PAGE_WELCOME
; !insertmacro MUI_PAGE_LICENSE "path/to/LICENSE.md" ; Uncomment if you have a license file
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

;--------------------------------
; Languages
;--------------------------------
!insertmacro MUI_LANGUAGE "English"

;--------------------------------
; Installer Attributes
;--------------------------------
; Global Definitions
!ifndef APP_FILENAME
  !define APP_FILENAME "ExcelChopper.exe"
!endif
!ifndef APP_REGKEY
  !define APP_REGKEY "Software\ExcelChopper"
!endif
; Commented out as it may not be available in all NSIS installations
; !include "AppAssocReg.nsh"  ; Modern file association handling
Name "ExcelChopper"
OutFile "Setup.exe"
InstallDir "$PROGRAMFILES\ExcelChopper"
RequestExecutionLevel admin

; User-selectable Context Menu - Keep the optional section logic
; Commenting out as section is disabled
; SectionSetText ${SEC_ASSOC} "Add '${CONTEXT_DISPLAY}' to Excel file context menu" ; Removed from here
