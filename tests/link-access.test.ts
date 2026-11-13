import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  accessRole,
  linksReady,
  makeSession,
  sessionRole,
} from "../src/lib/link-access";
test("private links select separate roles and cannot be guessed from a public ID", () => {
  const keys = {
    student: randomBytes(32).toString("base64url"),
    parent: randomBytes(32).toString("base64url"),
  };
  assert.ok(linksReady(keys));
  assert.equal(accessRole(keys.student, keys), "student");
  assert.equal(accessRole(keys.parent, keys), "parent");
  assert.equal(accessRole("stzcdqzupityyjckrepd", keys), null);
  assert.equal(accessRole(keys.student + "x", keys), null);
  assert.equal(linksReady({ ...keys, parent: keys.student }), false);
});
test("signed device session rejects tampering, expiry and rotated family links", () => {
  const keys = { student: "s".repeat(43), parent: "p".repeat(43) },
    now = Date.now();
  const s = makeSession("student", keys, now),
    p = makeSession("parent", keys, now);
  assert.equal(sessionRole(s, keys, now), "student");
  assert.equal(sessionRole(p, keys, now), "parent");
  assert.equal(sessionRole(p + "x", keys, now), null);
  const [body, sig] = p.split(".");
  const forged =
    Buffer.from(
      JSON.stringify({ role: "student", expires: now + 10000 }),
    ).toString("base64url") +
    "." +
    sig;
  assert.equal(sessionRole(forged, keys, now), null);
  assert.equal(sessionRole(s, keys, now + 366 * 86400000), null);
  assert.equal(sessionRole(s, { ...keys, parent: "q".repeat(43) }, now), null);
});
