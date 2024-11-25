# Sequence Shortcuts (Obsidian plugin)

This plugin allows you to use a sequences of chords for shortcuts instead of single chords.

*NOTE*: I don't use Obsidian so much anymore, so I probably won't be working on the repo much going forward.

## Creating a hotkey

You can modify your hotkeys under `Plugin Options > Sequence Hotkeys` or `Options > Community plugings > Sequence Hotkeys > Options`.

You can use the search bar to filter the commands. Searches are done using space separated values separately, for example "ex co" will find a command with the description `Example Command` or `Copy Text`.

To create a hotkey for a command click the set hotkey button on the right-hand side. The hotkey component will display "Press hotkey...". Type the chords you want to use and complete the input by pressing Enter (⏎) or clicking the ✓ button. Pressing Escape (⎋) or closing the settings window will cancel the hotkey creation. To use ⏎ or ⎋ in your hotkey sequence, click on the + button and select one to add to the sequence.

# Known Issues

-   If you have hotkey set in the default hotkeys, for example ⌘F, and you set a shortcut in the plugin using ⌘F ⌘W, for example, the plugin shortcut won't trigger.
-   Doesn't support the use of different keyboard layouts, like Dvorak.
