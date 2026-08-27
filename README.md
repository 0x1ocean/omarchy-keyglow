# Keyglow

[![Test](https://github.com/0x1ocean/omarchy-keyglow/actions/workflows/test.yml/badge.svg)](https://github.com/0x1ocean/omarchy-keyglow/actions/workflows/test.yml)

Keyglow is a keyboard layout indicator for the Omarchy bar. It updates when
the active physical keyboard layout changes and briefly shows the new layout
through Omarchy's native OSD.

## Features

- Displays the current layout in the bar.
- Shows instant OSD feedback when the layout changes.
- Resolves labels for every installed XKB layout instead of using a fixed language list.
- Ignores virtual keyboards such as fcitx5 to avoid duplicate notifications.
- Clicks cycle the layout of the detected physical keyboard.
- Has no external runtime dependencies beyond Omarchy.

## Install

```sh
omarchy plugin add https://github.com/0x1ocean/omarchy-keyglow.git --enable
omarchy plugin disable omarchy.keyboard-layout
```

The second command removes the built-in layout indicator from the bar so it
does not appear beside Keyglow. Keyglow is placed in the center section by
default. Move it with:

```sh
omarchy bar move io.github.0x1ocean.keyglow --section center
```

## Remove

```sh
omarchy plugin remove io.github.0x1ocean.keyglow
omarchy plugin enable omarchy.keyboard-layout center
```

The second command restores Omarchy's built-in layout indicator.

## Development

```sh
omarchy plugin validate .
qmllint -I /usr/share/omarchy/shell BarWidget.qml
node test/model.test.js
```

## License

MIT
