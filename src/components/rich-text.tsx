import type { ReactNode } from "react";
import type { Prisma } from "@prisma/client";

type RichNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type?: string; attrs?: Record<string, unknown> }>;
  content?: RichNode[];
};

function safeHref(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "mailto:" ? value : null;
  } catch {
    return null;
  }
}

function renderNode(node: RichNode, key: number): ReactNode {
  if (node.type === "text") {
    let text: ReactNode = node.text ?? "";
    for (const [index, mark] of (node.marks ?? []).entries()) {
      if (mark.type === "bold") text = <strong key={`${key}-b${index}`}>{text}</strong>;
      if (mark.type === "italic") text = <em key={`${key}-i${index}`}>{text}</em>;
      if (mark.type === "strike") text = <s key={`${key}-s${index}`}>{text}</s>;
      if (mark.type === "code") text = <code key={`${key}-c${index}`}>{text}</code>;
      if (mark.type === "link") {
        const href = safeHref(mark.attrs?.href);
        if (href) text = <a href={href} key={`${key}-a${index}`} rel="noreferrer" target="_blank">{text}</a>;
      }
    }
    return text;
  }

  const children = (node.content ?? []).map((child, index) => renderNode(child, index));
  switch (node.type) {
    case "doc": return <>{children}</>;
    case "paragraph": return <p key={key}>{children}</p>;
    case "heading": {
      const level = Math.max(2, Math.min(4, Number(node.attrs?.level) || 2));
      if (level === 2) return <h2 key={key}>{children}</h2>;
      if (level === 3) return <h3 key={key}>{children}</h3>;
      return <h4 key={key}>{children}</h4>;
    }
    case "bulletList": return <ul key={key}>{children}</ul>;
    case "orderedList": return <ol key={key}>{children}</ol>;
    case "listItem": return <li key={key}>{children}</li>;
    case "blockquote": return <blockquote key={key}>{children}</blockquote>;
    case "codeBlock": return <pre key={key}><code>{children}</code></pre>;
    case "horizontalRule": return <hr key={key} />;
    case "hardBreak": return <br key={key} />;
    default: return <>{children}</>;
  }
}

export function RichText({ content }: { content: Prisma.JsonValue }) {
  if (!content || typeof content !== "object" || Array.isArray(content)) return null;
  return <div className="prose-content">{renderNode(content as RichNode, 0)}</div>;
}