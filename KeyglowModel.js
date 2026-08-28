function normalizedParts(parts) {
  if (!parts || typeof parts === "string" ||
      typeof parts.length !== "number" || parts.length < 2) return null

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

function activeWindow(event) {
  if (!event || String(event.name || "") !== "activewindowv2") return null

  var address = String(event.data || "").trim()
  if (!address && event.parse) {
    try {
      var parts = event.parse(1)
      address = String(parts && parts[0] || "").trim()
    } catch (error) {
    }
  }
  return address || null
}

// Fcitx virtual keyboards announce layout synchronization when window focus
// changes. Physical keyboards announce the user's actual layout switches.
var NON_PHYSICAL_KEYBOARDS = /^(?:hl-virtual-keyboard|power-button|sleep-button|lid-switch|video-bus)|(?:^|-)(?:hotkeys|extra-buttons)$/i

function isPhysicalKeyboard(name) {
  var keyboardName = String(name || "").trim()
  return keyboardName !== "" && !NON_PHYSICAL_KEYBOARDS.test(keyboardName)
}

function physicalLayout(event) {
  if (!event || String(event.name || "") !== "activelayout") return null

  var parts = eventParts(event)
  var keyboardName = String(parts[0] || "").trim()
  var description = String(parts[1] || "").trim()
  return isPhysicalKeyboard(keyboardName) && description ? description : null
}

function osdPayload(description) {
  var message = String(description || "").trim()
  if (!message) return null
  return { icon: "keyboard", message: message, duration: 800 }
}

if (typeof module !== "undefined") {
  module.exports = {
    activeWindow: activeWindow,
    isPhysicalKeyboard: isPhysicalKeyboard,
    osdPayload: osdPayload,
    physicalLayout: physicalLayout
  }
}
