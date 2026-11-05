import assert from "node:assert/strict";
import { test } from "node:test";
import { hasWord, queryWords, searchableText } from "../lib/match.ts";
import { parseLeaderboard, parseReport } from "../lib/report.ts";

const flight = (json: string): string => json.replaceAll('"', '\\"');

test("reads listings out of the page's embedded data", () => {
  const item = '{"slug":"a","name":"A","url":"https://a.dev/mcp","score":null,"categories":[],"curated":false,"lastReviewedAt":null}';
  const html = `<script>${flight(`{"initialResult":{"items":[${item}],"total":1}}`)}</script>`;
  assert.equal(parseLeaderboard(html)[0].score, null);
});

test("throws rather than returning an empty list if the page changes", () => {
  assert.throws(() => parseLeaderboard("<html></html>"), /no initialResult/);
  assert.throws(() => parseLeaderboard(flight('{"initialResult":{"items":[{"slug":"a"}]}}')));
});

test("returns null for a listing with no public report", () => {
  assert.equal(parseReport("<html>Opening your score report…</html>"), null);
});

test("treats a non-applicable or missing section as null, not zero", () => {
  const sections = '"sections":{"protocol":{"score":100,"applicable":true},"tools":{"score":90,"applicable":true},"apps":{"applicable":false},"metadata":{"score":0,"applicable":true},"documentation":{"score":80,"applicable":true}}';
  const report = parseReport(flight(`{"server":{"description":"d"},${sections},"x":{"tool":{"name":"t1"}}}`));
  assert.ok(report);
  assert.equal(report.sections.apps, null);
  assert.equal(report.sections.discoverability, null);
  assert.equal(report.sections.metadata, 0);
  assert.deepEqual(report.tools, ["t1"]);
});

test("matches the start of a word, not the middle", () => {
  assert.equal(hasWord(searchableText("read threads and uploads"), "ads"), false);
  assert.equal(hasWord(searchableText("digital signage"), "git"), false);
  assert.equal(hasWord(searchableText("GitHub issues"), "git"), true);
  assert.equal(hasWord(searchableText("listEmails"), "email"), true);
  assert.equal(hasWord(searchableText("run_postgres_select_query"), "postgres"), true);
  assert.equal(hasWord(searchableText("spreadsheet ads"), "ads"), true);
});

test("treats Postgres spellings as one keyword and drops filler words", () => {
  assert.deepEqual(queryWords("postgresql"), ["postgres"]);
  assert.deepEqual(queryWords("pg"), ["postgres"]);
  assert.deepEqual(queryWords("which mcp server"), []);
});
