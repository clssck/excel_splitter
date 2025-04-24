!macro registerExtensions
  DeleteRegKey HKCR ".xlsx"
  WriteRegStr HKCR ".xlsx" "" "ExcelProjectBatchSplitter.xlsx"
  WriteRegStr HKCR "ExcelProjectBatchSplitter.xlsx" "" "Excel File"
  WriteRegStr HKCR "ExcelProjectBatchSplitter.xlsx\DefaultIcon" "" "$INSTDIR\resources\app.ico"
  WriteRegStr HKCR "ExcelProjectBatchSplitter.xlsx\shell\open\command" "" "$INSTDIR\${APP_FILENAME} %1"
!macroend

Section -RegisterExtensions
  !insertmacro registerExtensions
SectionEnd

Section un.RegisterExtensions
  DeleteRegKey HKCR ".xlsx"
  DeleteRegKey HKCR "ExcelProjectBatchSplitter.xlsx"
SectionEnd
