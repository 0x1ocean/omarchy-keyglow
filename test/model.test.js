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

describe("window focus events", () => {
  test("extracts the focused window address", () => {
    assert.equal(model.activeWindow({
      name: "activewindowv2",
      data: "5641bd425260"
    }), "5641bd425260")
  })

  test("falls back to parsed data and ignores unrelated events", () => {
    assert.equal(model.activeWindow({
      name: "activewindowv2",
      parse(limit) {
        assert.equal(limit, 1)
        return ["5641bcc327f0"]
      }
    }), "5641bcc327f0")
    assert.equal(model.activeWindow({ name: "activelayout" }), null)
  })
})

describe("physical keyboard detection", () => {
  test("accepts physical keyboards", () => {
    for (const name of [
      "at-translated-set-2-keyboard",
      "usb-gaming-keyboard",
      "roma’s-magic-keyboard"
    ]) {
      assert.equal(model.isPhysicalKeyboard(name), true, name)
    }
  })

  test("rejects virtual keyboards, buttons, hotkeys, and empty names", () => {
    for (const name of [
      "hl-virtual-keyboard-fcitx5",
      "hl-virtual-keyboard-wtype",
      "power-button",
      "sleep-button",
      "lid-switch",
      "video-bus",
      "asus-wmi-hotkeys",
      "thinkpad-extra-buttons",
      "",
      "   "
    ]) {
      assert.equal(model.isPhysicalKeyboard(name), false, name)
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
      assert.equal(model.physicalLayout(
        parsedLayoutEvent("usb-keyboard", description)), description)
    }
  })

  test("ignores Fcitx focus synchronization", () => {
    assert.equal(model.physicalLayout(
      parsedLayoutEvent("hl-virtual-keyboard-fcitx5", "Russian")), null)
  })

  test("preserves commas from parsed and raw events", () => {
    const description = "English (US, intl., with dead keys)"
    assert.equal(model.physicalLayout(
      parsedLayoutEvent("usb-keyboard", description)), description)
    assert.equal(model.physicalLayout({
      name: "activelayout",
      data: "usb-keyboard," + description
    }), description)
  })

  test("falls back to raw data when parsing is unavailable", () => {
    assert.equal(model.physicalLayout({
      name: "activelayout",
      data: "usb-keyboard,Русский",
      parse() { throw new Error("unavailable") }
    }), "Русский")
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
      assert.equal(model.physicalLayout(event), null)
    }
  })

  test("trims harmless outer whitespace", () => {
    assert.equal(model.physicalLayout({
      name: "activelayout",
      data: "  usb-keyboard  ,  Русский  "
    }), "Русский")
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
