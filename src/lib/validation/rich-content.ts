import { z } from "zod";

const allowedNodes = new Set([
  "doc", "paragraph", "heading", "bulletList", "orderedList", "listItem",
  "blockquote", "codeBlock", "horizontalRule", "hardBreak", "text",
]);
const allowedMarks = new Set(["bold", "italic", "strike", "code", "link"]);

function validateNode(value: unknown, depth = 0): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) || depth > 20) return false;
  const node = value as Record<string, unknown>;
  if (typeof node.type !== "string" || !allowedNodes.has(node.type)) return false;
  if (node.type === "text" && typeof node.text !== "string") return false;
  if (node.text !== undefined && typeof node.text !== "string") return false;
  if (node.content !== undefined) {
    if (!Array.isArray(node.content) || !node.content.every((child) => validateNode(child, depth + 1))) return false;
  }
  if (node.marks !== undefined) {
    if (!Array.isArray(node.marks)) return false;
    for (const markValue of node.marks) {
      if (!markValue || typeof markValue !== "object" || Array.isArray(markValue)) return false;
      const mark = markValue as Record<string, unknown>;
      if (typeof mark.type !== "string" || !allowedMarks.has(mark.type)) return false;
      if (mark.type === "link") {
        if (!mark.attrs || typeof mark.attrs !== "object" || Array.isArray(mark.attrs)) return false;
        const href = (mark.attrs as Record<string, unknown>).href;
        if (typeof href !== "string" || !(href.startsWith("https://") || href.startsWith("mailto:"))) return false;
      }
    }
  }
  return true;
}

export function parseRichContent(raw: string) {
  if (raw.length > 500_000) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return validateNode(parsed) && parsed.type === "doc" ? parsed : null;
  } catch {
    return null;
  }
}

export const slugSchema = z.string().trim().max(100).regex(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/);