"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [message, setMessage] = useState("");

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title, url: window.location.href });
      else {
        await navigator.clipboard.writeText(window.location.href);
        setMessage("Link copied");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") setMessage("Could not share this link.");
    }
  }

  return <span className="share-control"><button aria-label="Share story" className="icon-button" onClick={share} title="Share story" type="button"><Share2 size={16} /></button><span aria-live="polite">{message}</span></span>;
}