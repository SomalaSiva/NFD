import assert from "node:assert/strict";
import test from "node:test";
import { getPageMetadata, getPageOffset } from "../worker/lib/pagination.js";

test("page offset defaults to zero and rejects invalid or negative values", () => {
  assert.equal(getPageOffset(new Request("https://nfd.test/admin")), 0);
  assert.equal(getPageOffset(new Request("https://nfd.test/admin?offset=nope")), 0);
  assert.equal(getPageOffset(new Request("https://nfd.test/admin?offset=-5")), 0);
});

test("page offset is capped to a bounded value", () => {
  assert.equal(getPageOffset(new Request("https://nfd.test/admin?offset=100000000")), 100_000);
});

test("page metadata advances only while more rows remain", () => {
  assert.deepEqual(getPageMetadata(0, 250, 100), {
    offset: 0,
    total: 250,
    nextOffset: 100,
    pageSize: 100,
  });
  assert.equal(getPageMetadata(200, 250, 50).nextOffset, null);
});
