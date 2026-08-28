pragma ComponentBehavior: Bound

import QtQuick
import Quickshell
import Quickshell.Hyprland
import "KeyglowModel.js" as KeyglowModel

Item {
  id: root

  property var shell: null
  property string lastDescription: ""
  property double focusChangedAt: -1000

  function showLayout(description) {
    const payload = KeyglowModel.osdPayload(description)
    if (!payload) return

    if (shell) {
      shell.summon("omarchy.osd", JSON.stringify(payload))
    } else {
      Quickshell.execDetached([
        "omarchy-shell", "-q", "osd", "show", JSON.stringify(payload)
      ])
    }
  }

  Connections {
    target: Hyprland

    function onActiveToplevelChanged() {
      root.focusChangedAt = Date.now()
    }

    function onRawEvent(event) {
      const change = KeyglowModel.activeLayoutEvent(event)
      if (!change) return

      const now = Date.now()
      const shouldShow = KeyglowModel.shouldShowLayout(
        change.description,
        root.lastDescription,
        root.focusChangedAt,
        now,
        150)

      root.lastDescription = change.description
      if (shouldShow) root.showLayout(change.description)
    }
  }
}
