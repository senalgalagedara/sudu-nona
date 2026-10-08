Set FSO = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")
appDir = FSO.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = appDir

electronPath = appDir & "\node_modules\.bin\electron.cmd"

If FSO.FileExists(electronPath) Then
    WshShell.Run Chr(34) & electronPath & Chr(34) & " " & Chr(34) & appDir & Chr(34), 0, False
Else
    WshShell.Run "cmd /c npx electron .", 0, False
End If
