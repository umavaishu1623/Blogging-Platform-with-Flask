"use server";

import { z } from "zod";
import { requireRole } from "@/lib/auth/authorization";
import { checkRateLimit } from "@/lib/security/rate-limit";

export type CopySuggestion = { text?: string; error?: string };

export async function generateArticleCopy(kind: "title" | "summary", articleText: string): Promise<CopySuggestion> {
  const user = await requireRole("AUTHOR", "ADMIN");
  const parsed = z.string().trim().min(80).max(20_000).safeParse(articleText);
  if (!parsed.success) return { error: "Add at least 80 characters of article text first." };
  if (!(await checkRateLimit("ai-writing", user.id, 12, 3600))) {
    return { error: "Suggestion limit reached. Try again later." };
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { error: "AI suggestions are not configured." };

  const instruction = kind === "title"
    ? "Suggest one concise, specific, human-sounding article title. Return only the title, with no quotation marks or explanation."
    : "Write one accurate, engaging article summary in 20 to 40 words. Return only the summary, with no label or explanation.";

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        input: `${instruction}\n\nArticle:\n${parsed.data}`,
        max_output_tokens: kind === "title" ? 60 : 110,
        store: false,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return { error: "The writing assistant is unavailable. Try again later." };
    const payload: unknown = await response.json();
    const output = z.object({ output_text: z.string().max(1000) }).safeParse(payload);
    if (!output.success) return { error: "The writing assistant returned an unexpected response." };
    const maxLength = kind === "title" ? 180 : 320;
    const text = output.data.output_text.trim().replace(/^['"“”]+|['"“”]+$/g, "").slice(0, maxLength);
    return text ? { text } : { error: "No suggestion was returned. Try again." };
  } catch {
    return { error: "The writing assistant is unavailable. Try again later." };
  }
}