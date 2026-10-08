Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
strDesktop = WshShell.SpecialFolders("Desktop")
appDir = FSO.GetParentFolderName(WScript.ScriptFullName)
vbsLauncher = appDir & "\Sudu Nona.vbs"

Set oLink = WshShell.CreateShortcut(strDesktop & "\Sudu Nona.lnk")
oLink.TargetPath = "wscript.exe"
oLink.Arguments = Chr(34) & vbsLauncher & Chr(34)
oLink.WorkingDirectory = appDir
oLink.Description = "Sudu Nona - Claude and ChatGPT in one window"
oLink.Save

MsgBox "Desktop shortcut 'Sudu Nona' has been created on your Desktop!", vbInformation, "Sudu Nona"
