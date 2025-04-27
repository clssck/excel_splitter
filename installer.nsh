!include "LogicLib.nsh"
!include "MUI2.nsh"

;--------------------------------
; Installation Section
;--------------------------------
!include "x64.nsh"
!include "WinVer.nsh"

!macro customInstall
  Section "Custom Install"
    ${DisableX64FSRedirection}

    ${If} ${RunningX64}
      SetRegView 64
    ${Else}
      SetRegView 32
    ${EndIf}

    WriteRegStr HKCR "SystemFileAssociations\.xlsx\shell\Split with ExcelProjectBatchSplitter" "" "Split with ExcelProjectBatchSplitter"
    WriteRegStr HKCR "SystemFileAssociations\.xlsx\shell\Split with ExcelProjectBatchSplitter\command" "" '"$INSTDIR\${APP_FILENAME}" "%1"'

    ${If} ${AtLeastWinVista}
      System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
    ${EndIf}

    ${EnableX64FSRedirection}
    SectionEnd
!macroend

!macro customUnInstall
  ${DisableX64FSRedirection}

  DeleteRegKey HKCR "SystemFileAssociations\.xlsx\shell\Split with ExcelProjectBatchSplitter"

  ${If} ${AtLeastWinVista}
    System::Call 'Shell32::SHChangeNotify(i 0x8000000, i 0, i 0, i 0)'
  ${EndIf}

  ${EnableX64FSRedirection}
!macroend

;--------------------------------
; Installer Attributes
;--------------------------------
!define APP_FILENAME "ExcelProjectBatchSplitter.exe" ; Define the application executable name
Name "ExcelProjectBatchSplitter"
OutFile "Setup.exe"
InstallDir "$PROGRAMFILES\ExcelProjectBatchSplitter"
RequestExecutionLevel admin
