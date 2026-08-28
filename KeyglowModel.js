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

// Fcitx owns the active layout through a Hyprland virtual keyboard, so it is
// a valid source. Only devices that cannot type are ignored.
var UNTYPED_KEYBOARDS = /^(?:power-button|sleep-button|lid-switch|video-bus)|(?:^|-)(?:hotkeys|extra-buttons)$/i

function isTypedKeyboard(name) {
  var keyboardName = String(name || "").trim()
  return keyboardName !== "" && !UNTYPED_KEYBOARDS.test(keyboardName)
}

function activeLayoutEvent(event) {
  if (!event || String(event.name || "") !== "activelayout") return null

  var parts = eventParts(event)
  var keyboardName = String(parts[0] || "").trim()
  var description = String(parts[1] || "").trim()
  if (!isTypedKeyboard(keyboardName) || !description) return null

  return { keyboardName: keyboardName, description: description }
}

function shouldShowLayout(description, previousDescription, focusChangedAt, now, quietPeriod) {
  var current = String(description || "").trim()
  if (!current || current === String(previousDescription || "").trim()) return false

  var focusTime = Number(focusChangedAt)
  var currentTime = Number(now)
  var quiet = Math.max(0, Number(quietPeriod) || 0)
  return !(isFinite(focusTime) && isFinite(currentTime) &&
    currentTime - focusTime < quiet)
}

function osdPayload(description) {
  var message = String(description || "").trim()
  if (!message) return null
  return { icon: "keyboard", message: message, duration: 800 }
}

if (typeof module !== "undefined") {
  module.exports = {
    activeLayoutEvent: activeLayoutEvent,
    isTypedKeyboard: isTypedKeyboard,
    osdPayload: osdPayload,
    shouldShowLayout: shouldShowLayout
  }
}
