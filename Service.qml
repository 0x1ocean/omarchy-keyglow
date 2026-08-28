pragma ComponentBehavior: Bound

import QtQuick
import Quickshell.Hyprland
import "KeyglowModel.js" as KeyglowModel

Item {
  id: root

  property var shell: null

  function showLayout(description) {
    const payload = KeyglowModel.osdPayload(description)
    if (root.shell && payload)
      root.shell.summon("omarchy.osd", JSON.stringify(payload))
  }

  Connections {
    target: Hyprland

    function onRawEvent(event) {
      const description = KeyglowModel.physicalLayout(event)
      if (description) root.showLayout(description)
    }
  }
}
