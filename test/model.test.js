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

describe("physical keyboard detection", () => {
  test("accepts common internal, USB, Bluetooth, and Unicode device names", () => {
    const physicalKeyboards = [
      "at-translated-set-2-keyboard",
      "usb-gaming-keyboard",
      "keychron-k2-pro",
      "roma’s-magic-keyboard",
      "ACME Keyboard 2000"
    ]

    for (const keyboardName of physicalKeyboards) {
      assert.equal(model.isTypedKeyboard(keyboardName), true, keyboardName)
    }
  })

  test("rejects virtual keyboards, ACPI buttons, and hotkey devices", () => {
    const pseudoKeyboards = [
      "hl-virtual-keyboard-fcitx5",
      "hl-virtual-keyboard-custom",
      "power-button",
      "Power-Button-1",
      "sleep-button",
      "lid-switch",
      "video-bus",
      "asus-wmi-hotkeys",
      "wireless-hotkeys",
      "thinkpad-extra-buttons"
    ]

    for (const keyboardName of pseudoKeyboards) {
      assert.equal(model.isTypedKeyboard(keyboardName), false, keyboardName)
    }
  })

  test("rejects missing and whitespace-only device names", () => {
    for (const keyboardName of [undefined, null, "", "   "]) {
      assert.equal(model.isTypedKeyboard(keyboardName), false)
    }
  })
})

describe("active layout events", () => {
  test("preserves layout descriptions across languages and writing systems", () => {
    const descriptions = [
      "English (US)",
      "Russian",
      "Ukrainian",
      "Español (Latinoamérica)",
      "Português (Brasil)",
      "Ελληνικά",
      "Русский",
      "Українська",
      "العربية",
      "עברית",
      "हिन्दी",
      "ไทย",
      "ქართული",
      "日本語",
      "한국어",
      "中文"
    ]

    for (const description of descriptions) {
      assert.deepEqual(model.activeLayoutEvent(parsedLayoutEvent("usb-keyboard", description)), {
        keyboardName: "usb-keyboard",
        description
      }, description)
    }
  })

  test("preserves commas returned by the Quickshell parse API", () => {
    assert.deepEqual(
      model.activeLayoutEvent(parsedLayoutEvent("usb-keyboard", "English (US, intl., with dead keys)")),
      {
        keyboardName: "usb-keyboard",
        description: "English (US, intl., with dead keys)"
      }
    )
  })

  test("supports the legacy raw-data fallback without losing commas or Unicode", () => {
    const fallbackEvents = [
      {
        event: { name: "activelayout", data: "usb-keyboard,English (US, intl.)" },
        description: "English (US, intl.)"
      },
      {
        event: { name: "activelayout", data: "roma’s-magic-keyboard,Українська" },
        keyboardName: "roma’s-magic-keyboard",
        description: "Українська"
      },
      {
        event: {
          name: "activelayout",
          data: "usb-keyboard,العربية",
          parse() { throw new Error("parse unavailable") }
        },
        description: "العربية"
      },
      {
        event: {
          name: "activelayout",
          data: "usb-keyboard,日本語",
          parse() { return null }
        },
        description: "日本語"
      }
    ]

    for (const fixture of fallbackEvents) {
      assert.deepEqual(model.activeLayoutEvent(fixture.event), {
        keyboardName: fixture.keyboardName || "usb-keyboard",
        description: fixture.description
      })
    }
  })

  test("falls back to raw data when parse returns a malformed value", () => {
    const event = {
      name: "activelayout",
      data: "usb-keyboard,한국어",
      parse() { return "not-a-list" }
    }

    assert.deepEqual(model.activeLayoutEvent(event), {
      keyboardName: "usb-keyboard",
      description: "한국어"
    })
  })

  test("ignores events from virtual and non-typing devices", () => {
    for (const keyboardName of [
      "hl-virtual-keyboard-fcitx5",
      "power-button",
      "asus-wmi-hotkeys",
      "thinkpad-extra-buttons"
    ]) {
      assert.equal(model.activeLayoutEvent(parsedLayoutEvent(keyboardName, "Russian")), null)
    }
  })

  test("ignores unrelated and incomplete Hyprland events", () => {
    const invalidEvents = [
      undefined,
      null,
      {},
      { name: "workspace", data: "usb-keyboard,Russian" },
      { name: "activelayout", data: "" },
      { name: "activelayout", data: "usb-keyboard" },
      { name: "activelayout", data: ",Russian" },
      { name: "activelayout", data: "usb-keyboard," },
      { name: "activelayout", data: "   ,Russian" },
      { name: "activelayout", data: "usb-keyboard,   " }
    ]

    for (const event of invalidEvents) {
      assert.equal(model.activeLayoutEvent(event), null)
    }
  })

  test("normalizes harmless outer whitespace", () => {
    assert.deepEqual(
      model.activeLayoutEvent({ name: "activelayout", data: "  usb-keyboard  ,  Русский  " }),
      { keyboardName: "usb-keyboard", description: "Русский" }
    )
  })
})

describe("OSD command construction", () => {
  test("uses Omarchy's stock keyboard icon and keeps the description in one argument", () => {
    for (const description of [
      "English (US, intl.)",
      "Русский",
      "العربية",
      "日本語",
      "layout; touch /tmp/keyglow-must-not-run"
    ]) {
      assert.deepEqual(model.osdCommand(description), [
        "omarchy", "osd", "-i", "keyboard", "-m", description, "-d", "800"
      ])
    }
  })

  test("does not create a command for an empty description", () => {
    for (const description of [undefined, null, "", "   "]) {
      assert.deepEqual(model.osdCommand(description), [])
    }
  })

  test("trims only outer whitespace from the OSD message", () => {
    assert.deepEqual(model.osdCommand("  English (US)  ")[5], "English (US)")
  })
})
