"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/explore", label: "Explore" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link aria-label="Ink and Signal home" className="wordmark" href="/">
          <span className="wordmark-mark">i<span>.</span></span>
          <span>ink &amp; signal</span>
        </Link>
        <nav aria-label="Main navigation" className={menuOpen ? "main-nav is-open" : "main-nav"}>
          {links.map((link) => (
            <Link href={link.href} key={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link className="mobile-account-link" href="/login">Sign in</Link>
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <Link className="text-link account-link" href="/login">Sign in</Link>
          <Link className="button button-small" href="/write">
            Start writing <span aria-hidden="true">↗</span>
          </Link>
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            className="icon-button menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            type="button"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}