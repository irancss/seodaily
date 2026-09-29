import assert from "node:assert/strict";
import { test } from "node:test";

import { csvCell, csvRow } from "../../src/modules/downloads/csv.ts";

test("PL-T29: formula injection is neutralised and numbers stay text", () => {
  assert.equal(csvCell("=HYPERLINK(\"http://x\")"), `"'=HYPERLINK(""http://x"")"`);
  assert.equal(csvCell("+989121234567"), "'+989121234567");
  assert.equal(csvCell("-1+2"), "'-1+2");
  assert.equal(csvCell("@SUM(A1)"), "'@SUM(A1)");
  assert.equal(csvCell("\tcmd"), "'\tcmd");
  assert.equal(csvCell("افزونه، سئو"), "افزونه، سئو");
  assert.equal(csvCell('a,"b"'), '"a,""b"""');
  assert.equal(csvCell(null), "");
  assert.equal(csvRow([1, "x"]), "1,x\r\n");
});
