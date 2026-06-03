# demo.tape - vhs script to generate assets/demo.gif
# Install vhs: https://github.com/charmbracelet/vhs
# Generate the GIF:  vhs demo.tape
#
# Tip: run this from a real repo (or from nosuckreadme itself)
# to show a real render.

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
