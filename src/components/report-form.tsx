"use client";

import { useActionState } from "react";
import { reportContent } from "@/lib/actions/reports";

export function ReportForm({ blogId, commentId }: { blogId: string; commentId?: string }) {
  const action = reportContent.bind(null, blogId, commentId ?? null);
  const [state, formAction, pending] = useActionState(action, {});
  return <details className="report-details"><summary>Report</summary><form action={formAction}><label className="sr-only" htmlFor={commentId ? `report-${commentId}` : "report-story"}>Reason for report</label><textarea id={commentId ? `report-${commentId}` : "report-story"} maxLength={1000} minLength={10} name="reason" placeholder="Tell the moderation team what concerns you..." required rows={3} /><div><p aria-live="polite" className={`form-message ${state.error ? "is-error" : ""} ${state.success ? "is-success" : ""}`}>{state.error ?? state.success ?? ""}</p><button disabled={pending} type="submit">{pending ? "Sending..." : "Submit report"}</button></div></form></details>;
}