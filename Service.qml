pragma ComponentBehavior: Bound

import QtQuick
import Quickshell.Hyprland
import "KeyglowModel.js" as KeyglowModel

Item {
  id: root

  property var shell: null
  property string activeWindowAddress: ""

  function showLayout(description) {
    const payload = KeyglowModel.osdPayload(description)
    if (root.shell && payload)
      root.shell.summon("omarchy.osd", JSON.stringify(payload))
  }

  Connections {
    target: Hyprland

    function onRawEvent(event) {
      const address = KeyglowModel.activeWindow(event)
      if (address) {
        if (root.activeWindowAddress && root.activeWindowAddress !== address)
          focusGuard.restart()
        root.activeWindowAddress = address
        return
      }

      const description = KeyglowModel.physicalLayout(event)
      if (description && !focusGuard.running) root.showLayout(description)
    }
  }

  Timer {
    id: focusGuard
    interval: 200
  }
}
