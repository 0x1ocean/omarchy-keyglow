const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const { describe, test } = require("node:test")

const root = path.resolve(__dirname, "..")
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"))
const service = fs.readFileSync(path.join(root, "Service.qml"), "utf8")

describe("plugin manifest", () => {
  test("declares Keyglow as an OSD-only service", () => {
    assert.deepEqual(manifest.kinds, ["service"])
    assert.deepEqual(manifest.entryPoints, { service: "Service.qml" })
    assert.equal(Object.hasOwn(manifest, "barWidget"), false)
  })

  test("references an existing service entry point", () => {
    assert.equal(fs.existsSync(path.join(root, manifest.entryPoints.service)), true)
  })

  test("does not ship background caret helpers", () => {
    assert.equal(fs.existsSync(path.join(root, "caret_locator.py")), false)
  })

  test("does not ship the retired standalone bar widget", () => {
    assert.equal(fs.existsSync(path.join(root, "BarWidget.qml")), false)
  })

  test("keeps layout feedback on the direct path", () => {
    assert.match(service, /shell\.summon\("omarchy\.osd"/)
    assert.match(service, /activeWindowAddress/)
    assert.match(service, /focusGuard\.running/)
    for (const retired of [
      "Process {",
      "Date.now",
      "execDetached",
      "onActiveToplevelChanged"
    ]) {
      assert.equal(service.includes(retired), false, retired)
    }
  })
})
