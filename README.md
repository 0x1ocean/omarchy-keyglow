# Keyglow

[![Test](https://github.com/0x1ocean/omarchy-keyglow/actions/workflows/test.yml/badge.svg)](https://github.com/0x1ocean/omarchy-keyglow/actions/workflows/test.yml)

Keyglow adds instant native OSD feedback to Omarchy's built-in keyboard layout
indicator. The stock widget keeps its usual place and behavior; Keyglow runs in
the background and briefly shows the new layout when a physical keyboard
switches.

## Features

- Works with Omarchy's built-in keyboard layout widget instead of adding a second bar item.
- Shows instant OSD feedback when the layout changes.
- Ignores virtual keyboards such as fcitx5 to avoid duplicate notifications.
- Has no external runtime dependencies beyond Omarchy.

## Install

```sh
omarchy plugin add https://github.com/0x1ocean/omarchy-keyglow.git --enable
```

Keep `omarchy.keyboard-layout` enabled. It remains the visible indicator and
continues to handle click-to-cycle; Keyglow only supplies the OSD.

### Upgrade from 1.0.0

Version 1.0.0 was a separate bar widget. Remove its old bar entry before
updating, then enable the new background service and restore the stock widget:

```sh
omarchy plugin disable io.github.0x1ocean.keyglow
omarchy plugin update io.github.0x1ocean.keyglow --yes
omarchy plugin enable io.github.0x1ocean.keyglow
omarchy plugin enable omarchy.keyboard-layout center
```

## Remove

```sh
omarchy plugin remove io.github.0x1ocean.keyglow
```

## Development

```sh
omarchy plugin validate .
qmllint -I /usr/share/omarchy/shell Service.qml
node --test test/*.test.js
```

## License

MIT
