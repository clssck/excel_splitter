!macro registerExtensions
  ; The following lines were causing all .xlsx files to be associated with this app,
  ; overriding the default Excel association. They are now commented out to prevent hijacking.
  ; DeleteRegKey HKCR ".xlsx"
  ; WriteRegStr HKCR ".xlsx" "" "ExcelProjectBatchSplitter.xlsx"
  ; WriteRegStr HKCR "ExcelProjectBatchSplitter.xlsx" "" "Excel File"
  ; WriteRegStr HKCR "ExcelProjectBatchSplitter.xlsx\DefaultIcon" "" "$INSTDIR\resources\app.ico"
  ; WriteRegStr HKCR "ExcelProjectBatchSplitter.xlsx\shell\open\command" "" "$INSTDIR\${APP_FILENAME} %1"
!macroend

; Add context menu entry for .xlsx files to allow splitting via right-click
WriteRegStr HKCR "ExcelProjectBatchSplitter.xlsx" "" "Excel File"
WriteRegStr HKCR "ExcelProjectBatchSplitter.xlsx\\DefaultIcon" "" "$INSTDIR\\resources\\app.ico"
WriteRegStr HKCR "ExcelProjectBatchSplitter.xlsx\\shell\\split\\command" "" "$INSTDIR\\${APP_FILENAME} %1"
WriteRegStr HKCR "ExcelProjectBatchSplitter.xlsx\\shell\\split" "" "Split with ExcelProjectBatchSplitter"

; Add context menu for .xlsx files (without changing default)
WriteRegStr HKCR "SystemFileAssociations\\.xlsx\\shell\\Split with ExcelProjectBatchSplitter\\command" "" "$INSTDIR\\${APP_FILENAME} %1"
WriteRegStr HKCR "SystemFileAssociations\\.xlsx\\shell\\Split with ExcelProjectBatchSplitter" "" "Split with ExcelProjectBatchSplitter"
Section -RegisterExtensions
  !insertmacro registerExtensions
SectionEnd
