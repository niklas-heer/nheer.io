Output public/assets/articles/2026/kipferl-demo.mp4
Set Shell "bash"
Set FontSize 22
Set Width 1040
Set Height 720
Set Theme "Catppuccin Mocha"
Set Padding 24
Set TypingSpeed 35ms
Set Framerate 24
Set CursorBlink false
Hide
Type "cd /tmp/nheer-article-media/kipferl"
Enter
Type "export PATH=$PWD:$PATH"
Enter
Type "PS1='demo $ '; clear"
Enter
Show
Type "cat status.py"
Enter
Sleep 4s
Type "kipferl build status.py -o status"
Enter
Sleep 3s
Hide
Type "clear"
Enter
Show
Type "stat -f 'Standalone executable: %z bytes' status"
Enter
Sleep 3s
Type "./status"
Enter
Sleep 6s
