"use client";

import { useActionState } from "react";
import { postComment } from "@/lib/actions/interactions";

type CommentFormProps = { blogId: string; parentId?: string; compact?: boolean };

export function CommentForm({ blogId, parentId, compact = false }: CommentFormProps) {
  const action = postComment.bind(null, blogId, parentId ?? null);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className={compact ? "comment-form comment-form-compact" : "comment-form"}>
      <label className="sr-only" htmlFor={parentId ? `reply-${parentId}` : "new-comment"}>{parentId ? "Write a reply" : "Write a response"}</label>
      <textarea id={parentId ? `reply-${parentId}` : "new-comment"} maxLength={5000} minLength={2} name="body" placeholder={parentId ? "Add to the conversation..." : "Share a thoughtful response..."} required rows={compact ? 2 : 4} />
      <div className="comment-form-bottom">
        <p aria-live="polite" className={`form-message ${state.error ? "is-error" : ""} ${state.success ? "is-success" : ""}`}>{state.error ?? state.success ?? ""}</p>
        <button className="button button-small" disabled={pending} type="submit">{pending ? "Posting..." : parentId ? "Reply" : "Post response"}</button>
      </div>
    </form>
  );
}