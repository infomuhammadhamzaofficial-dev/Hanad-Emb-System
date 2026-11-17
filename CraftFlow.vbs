Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Run Start-CraftFlow.bat silently (0 = hidden)
WshShell.Run """" & currentDir & "\Start-CraftFlow.bat""", 0, False
