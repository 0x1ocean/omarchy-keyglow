const assert = require("node:assert/strict")
const { describe, test } = require("node:test")
const model = require("../KeyglowModel.js")

function parsedLayoutEvent(keyboardName, description) {
  return {
    name: "activelayout",
    parse(limit) {
      assert.equal(limit, 2)
      return [keyboardName, description]
    }
  }
}

describe("typing keyboard detection", () => {
  test("accepts physical and Fcitx keyboards", () => {
    for (const name of [
      "at-translated-set-2-keyboard",
      "usb-gaming-keyboard",
      "roma’s-magic-keyboard",
      "hl-virtual-keyboard-fcitx5"
    ]) {
      assert.equal(model.isTypedKeyboard(name), true, name)
    }
  })

  test("rejects buttons, hotkeys, and empty names", () => {
    for (const name of [
      "power-button",
      "sleep-button",
      "lid-switch",
      "video-bus",
      "asus-wmi-hotkeys",
      "thinkpad-extra-buttons",
      "",
      "   "
    ]) {
      assert.equal(model.isTypedKeyboard(name), false, name)
    }
  })
})
describe("layout events", () => {
  test("preserves descriptions in different languages", () => {
    for (const description of [
      "English (US)",
      "Russian",
      "Ukrainian",
      "Español (Latinoamérica)",
      "Ελληνικά",
      "العربية",
      "עברית",
      "日本語",
      "한국어",
      "中文"
    ]) {
      assert.deepEqual(
        model.activeLayoutEvent(parsedLayoutEvent("usb-keyboard", description)),
        { keyboardName: "usb-keyboard", description }
      )
    }
  })

  test("accepts the Fcitx virtual keyboard", () => {
    assert.deepEqual(
      model.activeLayoutEvent(
        parsedLayoutEvent("hl-virtual-keyboard-fcitx5", "Russian")
      ),
      {
        keyboardName: "hl-virtual-keyboard-fcitx5",
        description: "Russian"
      }
    )
  })

  test("preserves commas from parsed and raw events", () => {
    const description = "English (US, intl., with dead keys)"
    assert.deepEqual(
      model.activeLayoutEvent(parsedLayoutEvent("usb-keyboard", description)),
      { keyboardName: "usb-keyboard", description }
    )
    assert.deepEqual(
      model.activeLayoutEvent({
        name: "activelayout",
        data: "usb-keyboard," + description
      }),
      { keyboardName: "usb-keyboard", description }
    )
  })

  test("falls back to raw data when parsing is unavailable", () => {
    assert.deepEqual(
      model.activeLayoutEvent({
        name: "activelayout",
        data: "usb-keyboard,Русский",
        parse() { throw new Error("unavailable") }
      }),
      { keyboardName: "usb-keyboard", description: "Русский" }
    )
  })

  test("ignores unrelated, incomplete, and non-typing events", () => {
    for (const event of [
      null,
      {},
      { name: "workspace", data: "usb-keyboard,Russian" },
      { name: "activelayout", data: "" },
      { name: "activelayout", data: "usb-keyboard" },
      { name: "activelayout", data: "power-button,Russian" }
    ]) {
      assert.equal(model.activeLayoutEvent(event), null)
    }
  })

  test("trims harmless outer whitespace", () => {
    assert.deepEqual(
      model.activeLayoutEvent({
        name: "activelayout",
        data: "  usb-keyboard  ,  Русский  "
      }),
      { keyboardName: "usb-keyboard", description: "Русский" }
    )
  })
})

describe("notification filtering", () => {
  test("suppresses duplicate layouts", () => {
    assert.equal(
      model.shouldShowLayout("Russian", "Russian", 0, 5000, 150),
      false
    )
  })

  test("suppresses focus synchronization briefly", () => {
    assert.equal(
      model.shouldShowLayout("Russian", "English (US)", 1000, 1100, 150),
      false
    )
    assert.equal(
      model.shouldShowLayout("Russian", "English (US)", 1000, 1150, 150),
      true
    )
  })
})

describe("OSD payload", () => {
  test("uses Omarchy's keyboard icon and full description", () => {
    assert.deepEqual(model.osdPayload("English (US, intl.)"), {
      icon: "keyboard",
      message: "English (US, intl.)",
      duration: 800
    })
  })

  test("supports Unicode and rejects empty descriptions", () => {
    assert.deepEqual(model.osdPayload("  Українська  "), {
      icon: "keyboard",
      message: "Українська",
      duration: 800
    })
    assert.equal(model.osdPayload("   "), null)
  })
})
