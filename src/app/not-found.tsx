import Link from "next/link";

export default function NotFound() {
  return <section className="not-found page-width"><p className="eyebrow">404 / LOST YOUR PLACE?</p><h1>This page<br /><em>isn't here.</em></h1><p>The link may have changed, or the story has moved on.</p><Link className="button" href="/">Back to the journal</Link></section>;
}