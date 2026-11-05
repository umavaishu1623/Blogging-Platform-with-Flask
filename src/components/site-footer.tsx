import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <Link className="wordmark footer-wordmark" href="/">
            <span className="wordmark-mark">i<span>.</span></span>
            <span>ink &amp; signal</span>
          </Link>
          <p>Good ideas deserve room to breathe.</p>
        </div>
        <nav aria-label="Footer navigation" className="footer-links">
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Ink &amp; Signal</span>
        <span>Independent voices. Thoughtful reading.</span>
      </div>
    </footer>
  );
}