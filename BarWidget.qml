import QtQuick
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import qs.Commons
import qs.Ui
import "KeyglowModel.js" as KeyglowModel

BarWidget {
  id: root
  moduleName: "io.github.0x1ocean.keyglow"

  property string layoutFull: ""
  property string keyboardName: ""
  property string typedKeyboardName: ""
  property string pendingOsd: ""
  property bool refreshPending: false
  property bool keyboardUnresolved: false
  property int keyboardCount: 0
  property bool multipleLayouts: true
  property var layoutBriefs: ({})

  readonly property string layoutLabel: KeyglowModel.shortLabel(layoutFull, layoutBriefs)

  function isPhysicalKeyboard(name) {
    return KeyglowModel.isTypedKeyboard(name)
  }

  function eventParts(event) {
    try {
      if (event && event.parse) return event.parse(2)
    } catch (error) {
    }
    return String(event && event.data ? event.data : "").split(",")
  }

  function refresh() {
    if (queryProc.running) {
      refreshPending = true
      return
    }
    refreshPending = false
    queryProc.running = true
  }

  function showOsd(description) {
    if (!description) return
    if (osdProc.running) {
      pendingOsd = description
      return
    }
    osdProc.command = ["omarchy", "osd", "-i", "keyboard", "-m", description, "-d", "800"]
    osdProc.running = true
  }

  function cycleLayout() {
    if (!keyboardName || !bar) return
    bar.run("hyprctl switchxkblayout " + Util.shellQuote(keyboardName) + " next")
  }

  Component.onCompleted: {
    briefsProc.running = true
    refresh()
  }

  Connections {
    target: Hyprland

    function onRawEvent(event) {
      if (!event || !event.name) return
      const eventName = String(event.name)
      if (eventName === "configreloaded") {
        root.refresh()
        return
      }
      if (eventName !== "activelayout") return

      const parts = root.eventParts(event)
      const keyboard = String(parts[0] || "")
      const layout = String(parts[1] || "")
      if (!root.isPhysicalKeyboard(keyboard) || !layout) return

      root.typedKeyboardName = keyboard
      root.keyboardName = keyboard
      root.layoutFull = layout
      root.showOsd(layout)
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

  Process {
    id: briefsProc
    command: ["xkbcli", "list", "--load-exotic"]

    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: root.layoutBriefs = KeyglowModel.layoutBriefs(text)
    }
  }

  Process {
    id: queryProc
    command: ["hyprctl", "-j", "devices"]

    onRunningChanged: {
      if (running) {
        queryStallTimer.restart()
        return
      }
      queryStallTimer.stop()
      if (root.refreshPending) root.refresh()
    }

    stdout: StdioCollector {
      waitForEnd: true

      onStreamFinished: {
        let devices
        try {
          devices = JSON.parse(text || "{}")
        } catch (error) {
          return
        }

        const keyboards = Array.isArray(devices.keyboards)
          ? devices.keyboards.filter(k => root.isPhysicalKeyboard(k.name))
          : []
        if (keyboards.length === 0) {
          root.keyboardUnresolved = true
          root.keyboardName = ""
          root.layoutFull = ""
          return
        }

        const keyboard = KeyglowModel.selectKeyboard(keyboards, root.typedKeyboardName)
        if (!keyboard || !keyboard.active_keymap) {
          root.keyboardUnresolved = true
          return
        }

        root.keyboardUnresolved = false
        root.keyboardCount = keyboards.length
        root.keyboardName = String(keyboard.name || "")
        root.layoutFull = String(keyboard.active_keymap || "")
        root.multipleLayouts = keyboard.layout === undefined || String(keyboard.layout).indexOf(",") !== -1
      }
    }
  }

  Timer {
    id: queryStallTimer
    interval: 5000
    onTriggered: {
      queryProc.running = false
      root.refresh()
    }
  }

  Timer {
    interval: 10000
    running: !root.keyboardName || root.keyboardUnresolved || root.keyboardCount > 1
    repeat: true
    onTriggered: root.refresh()
  }

  visible: layoutLabel !== "" && multipleLayouts
  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight

  WidgetButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: root.layoutLabel
    tooltipText: root.layoutFull
    onPressed: function() { root.cycleLayout() }
  }
}
