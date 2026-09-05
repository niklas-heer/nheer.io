Output public/assets/articles/2026/quirl-modes-demo.mp4
Set Shell "bash"
Set FontFamily "JetBrainsMono Nerd Font"
Set FontSize 22
Set Width 1100
Set Height 720
Set Theme "Catppuccin Mocha"
Set Padding 24
Set TypingSpeed 38ms
Set Framerate 24
Set CursorBlink false
Hide
Type "sh ../quirl/scripts/demo-session.sh --nerd-font ../quirl/target/release/quirl"
Enter
Wait+Screen /NORMAL/
Ctrl+L
Show
Sleep 2s
Type "printf 'api\nworker\njobs\n' | wc -l && echo 'pipeline: healthy'"
Enter
Sleep 3s
Ctrl+L
Type "mode data"
Enter
Sleep 2s
Type "open services.json | where latency > 50 | select service latency"
Enter
Sleep 5s
Ctrl+L
Type "mode normal"
Enter
Sleep 2s
Type "bash { cat <(printf 'Bash still works.\n') }"
Enter
Sleep 3s
Ctrl+L
Type "lua return { answer = 6 * 7, language = _VERSION }"
Enter
Sleep 5s
