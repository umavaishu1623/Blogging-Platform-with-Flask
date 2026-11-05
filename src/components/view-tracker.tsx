"use client";

import { useEffect, useRef } from "react";

export function ViewTracker({ slug }: { slug: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    try {
      const previous: unknown = JSON.parse(localStorage.getItem("ink-recent-articles") ?? "[]");
      const slugs = Array.isArray(previous) ? previous.filter((item): item is string => typeof item === "string" && item !== slug) : [];
      localStorage.setItem("ink-recent-articles", JSON.stringify([slug, ...slugs].slice(0, 5)));
    } catch {
      localStorage.removeItem("ink-recent-articles");
    }
    void fetch(`/api/v1/articles/${encodeURIComponent(slug)}/view`, { method: "POST", keepalive: true });
  }, [slug]);

  return null;
}
