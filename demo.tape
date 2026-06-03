# demo.tape — script vhs pour générer assets/demo.gif
# Install vhs : https://github.com/charmbracelet/vhs
# Génère le GIF :  vhs demo.tape
#
# Astuce : lance ceci depuis un repo réel (ou depuis nosuckreadme lui-même)
# pour montrer un vrai rendu.

Output assets/demo.gif

Set FontSize 18
Set Width 1100
Set Height 700
Set Padding 20
Set Theme "Dracula"

Type "npx nosuckreadme . --dry-run"
Sleep 500ms
Enter
Sleep 4s

Type "npx nosuckreadme . --explain --dry-run"
Sleep 500ms
Enter
Sleep 4s
