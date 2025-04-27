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

!macro customInstall
  Section "Custom Install" SEC_ARCH
    ; Architecture-specific registry configuration
    ; Register file association only if selected
    ${If} ${SectionIsSelected} ${SEC_ASSOC}  ; Fixed section reference
      AppAssocReg::SetAppAsDefaultAll "${APP_FILENAME}" ".xlsx" "ExcelProjectBatchSplitter Document" \
        "" "$INSTDIR\resources\app.ico" "Split with ExcelProjectBatchSplitter"
    ${EndIf}

    # Application registration
    ; Modern application registration with explicit architecture context
    ; Modern application registration handled by AppAssocReg

    # Universal shell refresh
    ${RefreshShellIcons}
  SectionEnd
!macroend

!macro RefreshShellIcons
  System::Call 'Shell32::SHChangeNotify(i ${SHCNE_ASSOCCHANGED}, i ${SHCNF_IDLIST}, i 0, i 0)'
!macroend

!macro customUnInstall
  ${AppAssocReg::UnregisterExtension} "xlsx" "ExcelProjectBatchSplitter.xlsx"
  DeleteRegKey SHCTX "Software\Microsoft\Windows\CurrentVersion\App Paths\${APP_FILENAME}"
  ${RefreshShellIcons}
!macroend

; User-selectable File Associations
SectionGroup /e "File Associations" GRP_ASSOC
  Section "Excel Files" SEC_ASSOC
    ; Modern association using AppAssocReg
    AppAssocReg::SetAppAsDefaultAll "${APP_FILENAME}" ".xlsx" "ExcelProjectBatchSplitter Document" \
      "" "$INSTDIR\resources\app.ico" "Split with ExcelProjectBatchSplitter"
  ; This section is controlled by the checkbox
  SectionIn 1 2  # Show in both install types
  SectionSetText ${SEC_ASSOC} "Associate .xlsx files with ExcelProjectBatchSplitter"
SectionEnd
SectionGroupEnd

;--------------------------------
; Installer Attributes
;--------------------------------
; Global Definitions
!define APP_FILENAME "ExcelProjectBatchSplitter.exe"
!define APP_REGKEY "Software\ExcelProjectBatchSplitter"
!include "AppAssocReg.nsh"  ; Modern file association handling
Name "ExcelProjectBatchSplitter"
OutFile "Setup.exe"
InstallDir "$PROGRAMFILES\ExcelProjectBatchSplitter"
RequestExecutionLevel admin
