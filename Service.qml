import QtQuick
import Quickshell.Hyprland
import Quickshell.Io
import "KeyglowModel.js" as KeyglowModel

Item {
  id: root

  property string pendingOsd: ""

  function showOsd(description) {
    const command = KeyglowModel.osdCommand(description)
    if (command.length === 0) return

    if (osdProc.running) {
      pendingOsd = command[5]
      return
    }

    osdProc.command = command
    osdProc.running = true
  }

  Connections {
    target: Hyprland

    function onRawEvent(event) {
      const change = KeyglowModel.activeLayoutEvent(event)
      if (change) root.showOsd(change.description)
    }
  }

  Process {
    id: osdProc

    onRunningChanged: {
      if (running || !root.pendingOsd) return

      const nextLayout = root.pendingOsd
      root.pendingOsd = ""
      Qt.callLater(() => root.showOsd(nextLayout))
    }
  }
}
