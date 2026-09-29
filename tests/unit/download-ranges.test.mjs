import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeRanges } from "../../src/modules/downloads/ranges.ts";

test("range union preserves holes, joins adjacency and rejects impossible bytes", () => {
  let ranges = mergeRanges([], 99, 99, 100);
  ranges = mergeRanges(ranges, 0, 29, 100);
  assert.deepEqual(ranges, [[0, 29], [99, 99]]);
  ranges = mergeRanges(ranges, 20, 98, 100);
  assert.deepEqual(ranges, [[0, 99]]);
  assert.deepEqual(mergeRanges(ranges, 50, 70, 100), ranges);
  assert.throws(() => mergeRanges([], -1, 2, 100));
  assert.throws(() => mergeRanges([], 0, 100, 100));
});
