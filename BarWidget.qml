import QtQuick
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import qs.Commons
import qs.Ui

BarWidget {
  id: root
  moduleName: "io.github.0x1ocean.keyglow"

  property string layoutFull: ""
  property string keyboardName: ""
  property bool multipleLayouts: true
  property var layoutBriefs: ({})

  readonly property string layoutLabel: shortLabel(layoutFull)

  function isPhysicalKeyboard(name) {
    return !/^(hl-virtual-keyboard|power-button|sleep-button|lid-switch|video-bus|asus-wmi-hotkeys)/.test(String(name || ""))
  }

  function eventParts(event) {
    try {
      if (event && event.parse) return event.parse(2)
    } catch (error) {
    }
    return String(event && event.data ? event.data : "").split(",")
  }

  function shortLabel(description) {
    if (!description) return ""
    const brief = layoutBriefs[description]
    const label = typeof brief === "string" && brief
      ? brief.split("-")[0]
      : description.split(/\s+/)[0]
    return label.substring(0, 3).toUpperCase()
  }

  function parseLayoutBriefs(output) {
    const briefs = {}
    let brief = ""

    String(output || "").split("\n").forEach(line => {
      if (/^\s*- /.test(line)) brief = ""

      const field = line.match(/^  (brief|description): (.*)$/)
      if (!field) return

      if (field[1] === "brief") {
        brief = field[2].replace(/^'|'$/g, "")
      } else if (brief) {
        briefs[field[2]] = brief
        brief = ""
      }
    })

    return briefs
  }

  function refresh() {
    if (!queryProc.running) queryProc.running = true
  }

  function showOsd(description) {
    if (!description || osdProc.running) return
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
      if (!event || String(event.name) !== "activelayout") return

      const parts = root.eventParts(event)
      const keyboard = String(parts[0] || "")
      const layout = String(parts[1] || "")
      if (!root.isPhysicalKeyboard(keyboard) || !layout) return

      root.keyboardName = keyboard
      root.layoutFull = layout
      root.showOsd(layout)
    }
  }

  Process {
    id: osdProc
  }

  Process {
    id: briefsProc
    command: ["xkbcli", "list", "--load-exotic"]

    stdout: StdioCollector {
      waitForEnd: true
      onStreamFinished: root.layoutBriefs = root.parseLayoutBriefs(text)
    }
  }

  Process {
    id: queryProc
    command: ["hyprctl", "-j", "devices"]

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
        if (keyboards.length === 0) return

        const keyboard = keyboards.reduce((selected, candidate) => {
          const selectedIndex = Number(selected.active_layout_index || 0)
          const candidateIndex = Number(candidate.active_layout_index || 0)
          return candidateIndex > selectedIndex ? candidate : selected
        }, keyboards[0])

        root.keyboardName = String(keyboard.name || "")
        root.layoutFull = String(keyboard.active_keymap || "")
        root.multipleLayouts = keyboard.layout === undefined || String(keyboard.layout).indexOf(",") !== -1
      }
    }
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
