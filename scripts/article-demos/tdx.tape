Output public/assets/articles/2026/tdx-readme-demo.mp4
Set Shell "bash"
Set FontSize 24
Set Width 1040
Set Height 700
Set Theme "Catppuccin Mocha"
Set Padding 24
Set TypingSpeed 45ms
Set Framerate 24
Set CursorBlink false
Hide
Type "cd /tmp/nheer-article-media/tdx"
Enter
Type "export XDG_CONFIG_HOME=$PWD/config"
Enter
Type "PS1='demo $ '; clear"
Enter
Show
Type "cat README.md"
Enter
Sleep 4s
Type "tdx README.md"
Enter
Sleep 3s
Space
Sleep 2s
Type "j"
Sleep 2s
Escape
Sleep 1s
Type "git diff -- README.md"
Enter
Sleep 5s
