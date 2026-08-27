const assert = require("node:assert/strict")
const model = require("../KeyglowModel.js")

const xkbData = `
- layout: 'us'
  variant: ''
  brief: 'en'
  description: English (US)
- layout: 'de'
  variant: ''
  brief: 'de'
  description: German
- layout: 'mm'
  variant: 'zawgyi'
  brief: 'my-zwg'
  description: Burmese (Zawgyi)
`

const briefs = model.layoutBriefs(xkbData)
assert.equal(briefs["English (US)"], "en")
assert.equal(briefs.German, "de")
assert.equal(model.shortLabel("English (US)", briefs), "EN")
assert.equal(model.shortLabel("German", briefs), "DE")
assert.equal(model.shortLabel("Burmese (Zawgyi)", briefs), "MY")
assert.equal(model.shortLabel("Portuguese", {}), "POR")

assert.equal(model.isTypedKeyboard("at-translated-set-2-keyboard"), true)
assert.equal(model.isTypedKeyboard("usb-gaming-keyboard"), true)
assert.equal(model.isTypedKeyboard("hl-virtual-keyboard-fcitx5"), false)
assert.equal(model.isTypedKeyboard("power-button"), false)

const keyboards = [
  { name: "laptop", active_layout_index: 0 },
  { name: "external", active_layout_index: 2 }
]
assert.equal(model.selectKeyboard(keyboards, "").name, "external")
assert.equal(model.selectKeyboard(keyboards, "laptop").name, "laptop")

const parsedEvent = {
  parse() { return ["usb-keyboard", "English (US)"] }
}
assert.equal(model.eventKeyboardName(parsedEvent), "usb-keyboard")
assert.equal(model.eventKeyboardName({ data: "hl-virtual-keyboard-fcitx5,Russian" }), "")

console.log("Keyglow model tests passed")
