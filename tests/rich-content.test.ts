import assert from "node:assert/strict";
import test from "node:test";
import { parseRichContent, slugSchema } from "../src/lib/validation/rich-content";

test("accepts a bounded TipTap document", () => {
  const document = JSON.stringify({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "A useful idea", marks: [{ type: "bold" }] }] }],
  });
  assert.notEqual(parseRichContent(document), null);
});

test("rejects unsafe links and unsupported content nodes", () => {
  const unsafeLink = JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "click", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }] });
  const unsupportedNode = JSON.stringify({ type: "doc", content: [{ type: "image", attrs: { src: "https://example.com/image.jpg" } }] });
  assert.equal(parseRichContent(unsafeLink), null);
  assert.equal(parseRichContent(unsupportedNode), null);
});

test("rejects invalid, oversized, and deeply nested documents", () => {
  assert.equal(parseRichContent("not json"), null);
  assert.equal(parseRichContent(" ".repeat(500_001)), null);
  let node: Record<string, unknown> = { type: "paragraph" };
  for (let index = 0; index < 22; index += 1) node = { type: "paragraph", content: [node] };
  assert.equal(parseRichContent(JSON.stringify({ type: "doc", content: [node] })), null);
});

test("accepts empty draft slugs and conventional article slugs", () => {
  assert.equal(slugSchema.safeParse("").success, true);
  assert.equal(slugSchema.safeParse("a-thoughtful-story").success, true);
  assert.equal(slugSchema.safeParse("bad slug").success, false);
});