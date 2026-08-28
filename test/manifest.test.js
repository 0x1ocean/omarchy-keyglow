const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const { describe, test } = require("node:test")

const root = path.resolve(__dirname, "..")
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"))

describe("plugin manifest", () => {
  test("declares Keyglow as an OSD-only service", () => {
    assert.deepEqual(manifest.kinds, ["service"])
    assert.deepEqual(manifest.entryPoints, { service: "Service.qml" })
    assert.equal(Object.hasOwn(manifest, "barWidget"), false)
  })

  test("references an existing service entry point", () => {
    assert.equal(fs.existsSync(path.join(root, manifest.entryPoints.service)), true)
  })

  test("does not ship the retired standalone bar widget", () => {
    assert.equal(fs.existsSync(path.join(root, "BarWidget.qml")), false)
  })
})
