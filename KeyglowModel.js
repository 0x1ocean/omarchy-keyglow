// Hyprland's activelayout event pairs the keyboard that switched with the layout
// it moved to. Quickshell cuts the event into that many fields, so a description
// carrying a comma of its own stays in one piece. Older bindings expose only the
// raw string; join its tail back together so commas in the description survive.
function normalizedParts(parts) {
  if (!parts || typeof parts === "string" || typeof parts.length !== "number" || parts.length < 2) return null

  var description = []
  for (var index = 1; index < parts.length; index += 1) {
    description.push(String(parts[index] || ""))
  }

  return [parts[0], description.join(",")]
}

function eventParts(event) {
  var parts

  try {
    if (event && event.parse) parts = event.parse(2)
  } catch (error) {
  }

  var parsed = normalizedParts(parts)
  if (parsed) return parsed

  var raw = String(event && event.data ? event.data : "")
  var separator = raw.indexOf(",")
  if (separator === -1) return [raw, ""]
  return [raw.substring(0, separator), raw.substring(separator + 1)]
}

// Hyprland also announces layout changes from virtual input methods and ACPI
// buttons. Ignore those so only a physical keyboard switch produces an OSD.
var UNTYPED_KEYBOARDS = /^(?:hl-virtual-keyboard|power-button|sleep-button|lid-switch|video-bus)|(?:^|-)(?:hotkeys|extra-buttons)$/i

function isTypedKeyboard(name) {
  var keyboardName = String(name || "").trim()
  return keyboardName !== "" && !UNTYPED_KEYBOARDS.test(keyboardName)
}

function activeLayoutEvent(event) {
  if (!event || String(event.name || "") !== "activelayout") return null

  var parts = eventParts(event)
  var keyboardName = String(parts[0] || "").trim()
  var description = String(parts[1] || "").trim()

  if (!keyboardName || !description || !isTypedKeyboard(keyboardName)) return null
  return { keyboardName: keyboardName, description: description }
}

function osdCommand(description) {
  var message = String(description || "").trim()
  if (!message) return []
  return ["omarchy", "osd", "-i", "keyboard", "-m", message, "-d", "800"]
}

if (typeof module !== "undefined") {
  module.exports = {
    activeLayoutEvent: activeLayoutEvent,
    isTypedKeyboard: isTypedKeyboard,
    osdCommand: osdCommand
  }
}
