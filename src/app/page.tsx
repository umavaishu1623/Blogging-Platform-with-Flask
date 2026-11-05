import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BookOpen, Search, Sparkles } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { NewsletterForm } from "@/components/newsletter-form";
import { HeroIntro } from "@/components/hero-intro";
import { RecentlyViewed } from "@/components/recently-viewed";
import { getCategories, getTrendingArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/article-card";

export const metadata: Metadata = {
  title: "Ideas worth a slower read",
  description: "Discover thoughtful essays, field notes, and new perspectives from independent writers.",
};

export const dynamic = "force-dynamic";

async function getLatestArticles() {
  if (!process.env.DATABASE_URL) return [];

  return prisma.blog.findMany({
    where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
    include: { author: true, categories: true },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });
}

export default async function HomePage() {
  const [articles, categories, trending] = await Promise.all([
    getLatestArticles(),
    getCategories(),
    getTrendingArticles(3),
  ]);

  return (
    <>
      <section className="home-hero">
        <div className="hero-image" aria-hidden="true">
          <Image
            alt="Sunlit desk with an open notebook and a cup of coffee"
            className="hero-photo"
            fill
            priority
            sizes="100vw"
            src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=2200&q=85"
          />
        </div>
        <div className="hero-scrim" aria-hidden="true" />
        <HeroIntro>
          <p className="eyebrow hero-eyebrow"><span /> A journal for the curious</p>
          <h1>Ideas worth<br />a slower <em>read.</em></h1>
          <p className="hero-copy">A little less noise. A lot more signal. Find thoughtful writing from people who care about what they put into the world.</p>
          <div className="hero-actions">
            <Link className="button button-light" href="/explore">Explore the journal <ArrowRight size={17} /></Link>
            <Link className="hero-secondary" href="/write">Have something to say? <span>Start writing</span></Link>
          </div>
          <div className="hero-note"><ArrowDown size={15} /> Made for the in-between moments</div>
        </HeroIntro>
        <div className="hero-index"><span>01</span> / 03</div>
      </section>

      <section className="intro-band page-width">
        <div className="intro-label"><span className="section-index">01</span><span>THE JOURNAL</span></div>
        <div className="intro-text">
          <h2>Words with a point of view.</h2>
          <p>Ink &amp; Signal is a home for considered ideas, honest stories, and the kind of writing that stays with you after the tab is closed.</p>
          <Link className="underlined-link" href="/about">Get to know us <ArrowRight size={15} /></Link>
        </div>
        <div className="intro-mark" aria-hidden="true">i<span>.</span></div>
      </section>

      {categories.length > 0 && <section className="popular-topics page-width"><div><p className="eyebrow">A FEW PLACES TO BEGIN</p><h2>Popular subjects</h2></div><div className="popular-topic-list">{categories.slice(0, 6).map((category) => <Link href={`/categories/${category.slug}`} key={category.id}><span>{category.name}</span><small>{category._count.blogs} {category._count.blogs === 1 ? "story" : "stories"}</small></Link>)}</div></section>}

      <section className="latest-section">
        <div className="page-width">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><span className="section-index">02</span> FRESH OFF THE PAGE</p>
              <h2>Latest stories</h2>
            </div>
            <Link className="underlined-link" href="/explore">All stories <ArrowRight size={15} /></Link>
          </div>
          {articles.length > 0 ? (
            <div className="article-grid">
              {articles.map((article, index) => (
                <article className="article-card" key={article.id}>
                  <Link className="article-image" href={`/blog/${article.slug}`}>
                    {article.coverImageUrl ? (
                      <Image alt={article.coverImageAlt ?? ""} fill sizes="(max-width: 700px) 100vw, 33vw" src={article.coverImageUrl} />
                    ) : <span className="article-image-placeholder"><BookOpen size={24} /></span>}
                    <span className="article-number">0{index + 1}</span>
                  </Link>
                  <div className="article-meta">
                    <span>{article.categories[0]?.name ?? "Essay"}</span>
                    <span>{article.publishedAt?.toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                  </div>
                  <h3><Link href={`/blog/${article.slug}`}>{article.title}</Link></h3>
                  <p>{article.description}</p>
                  <div className="article-author">By {article.author.name ?? "Ink & Signal contributor"}</div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-stories">
              <div className="empty-icon"><Sparkles size={20} /></div>
              <div>
                <h3>The first stories are taking shape.</h3>
                <p>Good journals start with a blank page. Be the first to publish something worth reading.</p>
              </div>
              <Link className="underlined-link" href="/write">Write the first story <ArrowRight size={15} /></Link>
            </div>
          )}
        </div>
      </section>

      {trending.length > 0 && <section className="trending-section page-width"><div className="section-heading"><div><p className="eyebrow">MOST READ THIS MOMENT</p><h2>Finding an audience</h2></div><Link className="underlined-link" href="/explore/trending">Trending stories <ArrowRight size={15} /></Link></div><div className="article-grid">{trending.map((article) => <ArticleCard article={article} key={article.id} />)}</div></section>}

      <section className="newsletter-band">
        <div className="newsletter-inner page-width">
          <div><p className="eyebrow">A LETTER, NOT MORE NOISE</p><h2>One thoughtful read<br />for your inbox.</h2><p className="newsletter-copy">Occasional notes from the journal. Confirm by email, leave whenever you like.</p></div>
          <NewsletterForm />
        </div>
      </section>

      <RecentlyViewed />

      <section className="closing-band page-width">
        <div className="closing-icon"><Search size={20} /></div>
        <div><p className="eyebrow">A GOOD PLACE TO BEGIN</p><h2>Follow a thought<br />where it leads.</h2></div>
        <Link className="button button-dark" href="/explore">Find your next read <ArrowRight size={17} /></Link>
      </section>
    </>
  );
}