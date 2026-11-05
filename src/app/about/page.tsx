import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Ink & Signal",
  description: "An independent journal for thoughtful writing and fresh perspectives.",
};

export default function AboutPage() {
  return (
    <article className="editorial-page page-width">
      <p className="eyebrow">A NOTE ON WHY WE'RE HERE</p>
      <h1>More meaning.<br /><em>Less noise.</em></h1>
      <p className="editorial-lede">Ink &amp; Signal is an independent home for people who believe a good idea deserves a little more time.</p>
      <div className="editorial-body">
        <h2>Make room for the whole thought.</h2>
        <p>We made this journal for considered essays, honest stories, and useful perspectives. Not the fastest take. Not the loudest voice. Just writing with care behind it.</p>
        <h2>Written by people, read with curiosity.</h2>
        <p>Readers can save stories and join a conversation. Writers can build a home for their work, publish at their own pace, and share what they know.</p>
        <p>We are early in this work. Our standards are simple: respect the reader, credit the writer, and treat a person's data with care.</p>
      </div>
      <Link className="button" href="/explore">Read the journal</Link>
    </article>
  );
}