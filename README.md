# Sequence Shortcuts (Obsidian plugin)

This plugin allows you to use a sequences of chords for shortcuts instead of single chords.

## Creating a hotkey

You can modify your hotkeys under `Plugin Options > Sequence Hotkeys` or `Options > Community plugings > Sequence Hotkeys > Options`.

You can use the search bar to filter the commands. Searches are done using space separated values separately, for example "ex co" will find a command with the description `Example Command` or `Copy Text`.

To create a hotkey for a command click the set hotkey button on the right-hand side. The hotkey component will display "Press hotkey...". Type the shortcuts you want to use. To end the input click anywhere (except the set hotkey button).

# Known Issues

-   If you have hotkey set in the default hotkeys, for example ⌘F, and you set a shortcut in the plugin using ⌘F ⌘W, for example, the plugin shortcut won't trigger.
-   While inputting a shortcut, if you press `Esc`, the settings dialog will close, but the shortcuts will still be recorded until you click.
