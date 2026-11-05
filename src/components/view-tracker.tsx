"use client";

import { useEffect } from "react";

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    void fetch(`/api/v1/articles/${encodeURIComponent(slug)}/view`, { method: "POST", keepalive: true });
  }, [slug]);

  return null;
}
