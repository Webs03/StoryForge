import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Pen,
  FolderOpen,
  History,
  Share2,
  Shield,
  Star,
  Theater,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";
import tellTaleHeartCover from "@/assets/covers/tell-tale-heart.svg";
import hamletCover from "@/assets/covers/hamlet.svg";
import giftOfTheMagiCover from "@/assets/covers/gift-of-the-magi.svg";
import theLotteryCover from "@/assets/covers/the-lottery.svg";
import aRaisinInTheSunCover from "@/assets/covers/a-raisin-in-the-sun.svg";
import yellowWallpaperCover from "@/assets/covers/yellow-wallpaper.svg";
import aDollsHouseCover from "@/assets/covers/a-dolls-house.svg";
import lastLeafCover from "@/assets/covers/last-leaf.svg";
import deathOfASalesmanCover from "@/assets/covers/death-of-a-salesman.svg";
import romeoAndJulietCover from "@/assets/covers/romeo-and-juliet.svg";
import fallbackCover from "@/assets/covers/fallback-cover.svg";

const features = [
  {
    icon: Pen,
    title: "Specialized Editors",
    description: "Dedicated editors for short stories and playscripts with professional formatting tools.",
  },
  {
    icon: FolderOpen,
    title: "Smart Organization",
    description: "Tags, collections, status labels, and powerful search across all your works.",
  },
  {
    icon: History,
    title: "Version Control",
    description: "Auto-save, manual checkpoints, side-by-side comparison, and instant rollback.",
  },
  {
    icon: Share2,
    title: "Export & Share",
    description: "Export to PDF, DOCX, EPUB. Share with password protection and expiration dates.",
  },
  {
    icon: BookOpen,
    title: "Writing Analytics",
    description: "Track your productivity, writing streaks, and most productive times.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your stories are encrypted and backed up. You own your data, always.",
  },
];

type CoverFormat = "Story" | "Playscript";

type TrendingItem = {
  title: string;
  category: string;
  format: CoverFormat;
  reads: string;
  imageSrc: string;
  href?: string;
  score?: number;
  source?: string;
};

const onlineImageFallback = fallbackCover;

const storyGeneratedCovers = [
  tellTaleHeartCover,
  giftOfTheMagiCover,
  theLotteryCover,
  yellowWallpaperCover,
  lastLeafCover,
];

const playscriptGeneratedCovers = [
  hamletCover,
  aRaisinInTheSunCover,
  aDollsHouseCover,
  deathOfASalesmanCover,
  romeoAndJulietCover,
];

const getGeneratedCover = (format: CoverFormat, index: number) => {
  const coverSet = format === "Story" ? storyGeneratedCovers : playscriptGeneratedCovers;
  return coverSet[index % coverSet.length] ?? onlineImageFallback;
};

const recommendedTopics = [
  {
    title: "The Tell-Tale Heart",
    format: "Story",
    description: "Edgar Allan Poe's suspense classic with an unreliable narrator and mounting guilt.",
    imageSrc: tellTaleHeartCover,
  },
  {
    title: "Hamlet",
    format: "Playscript",
    description: "Shakespeare's iconic tragedy of power, grief, and moral uncertainty.",
    imageSrc: hamletCover,
  },
  {
    title: "The Gift of the Magi",
    format: "Story",
    description: "O. Henry's timeless short story of sacrifice, love, and irony.",
    imageSrc: giftOfTheMagiCover,
  },
];

const fallbackTrendingNow: TrendingItem[] = [
  {
    title: "The Lottery",
    category: "Classic Story",
    format: "Story",
    reads: "By Shirley Jackson",
    imageSrc: theLotteryCover,
  },
  {
    title: "A Raisin in the Sun",
    category: "Classic Playscript",
    format: "Playscript",
    reads: "By Lorraine Hansberry",
    imageSrc: aRaisinInTheSunCover,
  },
  {
    title: "The Yellow Wallpaper",
    category: "Classic Story",
    format: "Story",
    reads: "By Charlotte Perkins Gilman",
    imageSrc: yellowWallpaperCover,
  },
  {
    title: "A Doll's House",
    category: "Classic Playscript",
    format: "Playscript",
    reads: "By Henrik Ibsen",
    imageSrc: aDollsHouseCover,
  },
];

const editorsPick = [
  {
    title: "The Last Leaf",
    category: "Story · O. Henry",
    blurb: "A beloved short story known for emotional restraint, precise pacing, and a memorable ending.",
    imageSrc: lastLeafCover,
  },
  {
    title: "Death of a Salesman",
    category: "Playscript · Arthur Miller",
    blurb: "A modern theater landmark blending realism, memory, and sharp character conflict.",
    imageSrc: deathOfASalesmanCover,
  },
  {
    title: "Romeo and Juliet",
    category: "Playscript · William Shakespeare",
    blurb: "A canonical tragedy with enduring themes of love, conflict, and fate.",
    imageSrc: romeoAndJulietCover,
  },
];

const LandingPage = () => {
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>(fallbackTrendingNow);
  const [trendingState, setTrendingState] = useState<"loading" | "live" | "fallback">("loading");
  const [trendingUpdatedAt, setTrendingUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchLiveTrending = async () => {
      try {
        const sources: Array<{ url: string; format: CoverFormat }> = [
          { url: "https://www.reddit.com/r/WritingPrompts/top.json?t=day&limit=8", format: "Story" },
          { url: "https://www.reddit.com/r/shortstories/top.json?t=day&limit=8", format: "Story" },
          { url: "https://www.reddit.com/r/Screenwriting/top.json?t=day&limit=8", format: "Playscript" },
        ];

        const responses = await Promise.allSettled(
          sources.map(async (source) => {
            const response = await fetch(source.url);
            if (!response.ok) return [];
            const payload = (await response.json()) as {
              data?: { children?: Array<{ data?: Record<string, unknown> }> };
            };
            const children = payload.data?.children ?? [];
            return children.map((entry) => ({ source, post: entry.data ?? {} }));
          })
        );

        const collected = responses.flatMap((result) =>
          result.status === "fulfilled" ? result.value : []
        );

        const liveItems: TrendingItem[] = collected
          .map(({ source, post }, index) => {
            const title = typeof post.title === "string" ? post.title : "";
            const subreddit =
              typeof post.subreddit === "string" ? post.subreddit : "writing";
            const permalink =
              typeof post.permalink === "string" ? post.permalink : "";
            const ups = typeof post.ups === "number" ? post.ups : 0;
            const thumbnail =
              typeof post.thumbnail === "string" &&
              /^https?:\/\//.test(post.thumbnail)
                ? post.thumbnail
                : getGeneratedCover(source.format, index);
            const isPinned = Boolean(post.stickied);
            const isRemoved = title.toLowerCase().includes("[removed]");

            if (!title || !permalink || isPinned || isRemoved) return null;

            return {
              title,
              category: `r/${subreddit}`,
              format: source.format,
              reads: `${ups.toLocaleString()} upvotes`,
              imageSrc: thumbnail,
              href: `https://www.reddit.com${permalink}`,
              score: ups,
              source: "Reddit",
            } satisfies TrendingItem;
          })
          .filter((item): item is TrendingItem => item !== null)
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
          .slice(0, 4);

        if (cancelled) return;

        if (liveItems.length > 0) {
          setTrendingItems(liveItems);
          setTrendingState("live");
          setTrendingUpdatedAt(new Date().toISOString());
          return;
        }

        setTrendingItems(fallbackTrendingNow);
        setTrendingState("fallback");
      } catch {
        if (cancelled) return;
        setTrendingItems(fallbackTrendingNow);
        setTrendingState("fallback");
      }
    };

    void fetchLiveTrending();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">StoryForge</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 font-body text-sm">
            <a href="#discover" className="text-muted-foreground hover:text-foreground transition-colors">Discover</a>
            <a href="#topics" className="text-muted-foreground hover:text-foreground transition-colors">Topics</a>
            <a href="#workflow" className="text-muted-foreground hover:text-foreground transition-colors">Workflow</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImage} alt="Writing desk" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-br from-warm-light/80 via-background to-secondary/40" />
          <div className="absolute -top-28 -left-14 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-sage/35 blur-3xl" />
        </div>
        <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 xl:gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <p className="text-primary font-body font-semibold tracking-widest uppercase text-sm mb-4">
              Read. Write. Publish.
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6 text-balance">
              Discover stories, keep your reading flow, and publish your own chapters.
            </h1>
            <p className="font-body text-lg md:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed">
              Build episodes, draft scenes, and publish faster with a writer-first platform designed to feel familiar to story readers and serial fiction creators.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-base px-8 py-6" asChild>
                <Link to="/dashboard">Start Writing Free</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 py-6" asChild>
                <a href="#discover">Explore Trending</a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="rounded-full border border-border bg-card/80 px-4 py-2 text-xs font-body text-foreground">
                120K+ Story Drafts
              </span>
              <span className="rounded-full border border-border bg-card/80 px-4 py-2 text-xs font-body text-foreground">
                18K+ Playscript Scenes
              </span>
              <span className="rounded-full border border-border bg-card/80 px-4 py-2 text-xs font-body text-foreground">
                Real-Time Autosave
              </span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
            className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 md:p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-body text-xs uppercase tracking-[0.2em] text-primary font-semibold">
                Reader Shelf
              </p>
              <span className="text-xs text-muted-foreground font-body">Updated Live</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {trendingItems.map((story) => (
                <article
                  key={`${story.title}-shelf`}
                  className="rounded-xl overflow-hidden border border-border bg-background shadow-sm"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={story.imageSrc}
                      alt={story.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = onlineImageFallback;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute left-3 right-3 bottom-3">
                      <p className="font-body text-[10px] uppercase tracking-wide text-white/90 mb-1">{story.format}</p>
                      <h3 className="font-display text-sm font-semibold text-white leading-tight line-clamp-2">{story.title}</h3>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Discover Section */}
      <section id="discover" className="py-20 md:py-28 bg-card">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-primary font-body font-semibold tracking-widest uppercase text-sm mb-3">Discover</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">
              Trending Now
            </h2>
            <p className="font-body text-sm text-muted-foreground mt-2">
              {trendingState === "live" && trendingUpdatedAt
                ? `Live from Reddit · Updated ${new Date(trendingUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : trendingState === "loading"
                  ? "Loading live trends..."
                  : "Showing curated picks while live trends are unavailable."}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
            {trendingItems.map((story, i) => (
              <motion.a
                key={story.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-xl overflow-hidden border border-border bg-background group hover:border-primary/30 transition-colors"
                href={story.href}
                target={story.href ? "_blank" : undefined}
                rel={story.href ? "noreferrer" : undefined}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={story.imageSrc}
                    alt={story.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = onlineImageFallback;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <div className="absolute left-4 right-4 bottom-4">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-black/60 text-white/90 px-2.5 py-1 text-[11px] font-body mb-2">
                      {story.format === "Playscript" ? <Theater className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                      {story.format}
                    </div>
                    <h3 className="font-display text-xl font-semibold text-white mb-1 leading-tight">{story.title}</h3>
                    <p className="font-body text-xs text-white/80">
                      {story.category} · {story.reads}
                      {story.source ? ` · ${story.source}` : ""}
                    </p>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 mb-5"
          >
            <Star className="h-5 w-5 text-primary" />
            <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Editor's Pick
            </h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {editorsPick.map((story, i) => (
              <motion.article
                key={story.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-background rounded-xl border border-border overflow-hidden group hover:border-primary/30 transition-colors"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={story.imageSrc}
                    alt={story.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = onlineImageFallback;
                    }}
                  />
                </div>
                <div className="p-5">
                  <p className="font-body text-xs uppercase tracking-wide text-primary mb-2">{story.category}</p>
                  <h4 className="font-display text-xl font-semibold text-foreground mb-2">{story.title}</h4>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">{story.blurb}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-card">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-primary font-body font-semibold tracking-widest uppercase text-sm mb-3">Crafted for Writers</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">
              Everything You Need to Write
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-background rounded-lg p-8 border border-border hover:border-primary/30 transition-colors group"
              >
                <div className="h-12 w-12 rounded-lg bg-warm-light flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="font-body text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Topics Section */}
      <section id="topics" className="py-20 md:py-28">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-primary font-body font-semibold tracking-widest uppercase text-sm mb-3">Recommendations</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">
              Topics for You
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {recommendedTopics.map((topic, i) => (
              <motion.article
                key={topic.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-card rounded-xl border border-border overflow-hidden group hover:border-primary/30 transition-colors"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={topic.imageSrc}
                    alt={topic.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = onlineImageFallback;
                    }}
                  />
                </div>
                <div className="p-6">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 mb-3">
                    {topic.format === "Playscript" ? <Theater className="h-3 w-3 text-primary" /> : <FileText className="h-3 w-3 text-primary" />}
                    <span className="font-body text-[11px] uppercase tracking-wide text-primary">{topic.format}</span>
                  </div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">{topic.title}</h3>
                  <p className="font-body text-muted-foreground leading-relaxed">{topic.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="workflow" className="py-20 md:py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-primary font-body font-semibold tracking-widest uppercase text-sm mb-3">Simple Workflow</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">
              From Idea to Final Draft
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Create or Upload", desc: "Start a new story or playscript, or upload existing files." },
              { step: "02", title: "Write & Organize", desc: "Use specialized editors with auto-save and version history." },
              { step: "03", title: "Export & Share", desc: "Export to any format or share with collaborators securely." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="text-center"
              >
                <div className="font-display text-6xl font-bold text-primary/20 mb-4">{item.step}</div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="font-body text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-card">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-6">
              Ready to Forge Your Story?
            </h2>
            <p className="font-body text-lg text-muted-foreground mb-10">
              Join writers who trust StoryForge to keep their words safe, organized, and beautifully formatted.
            </p>
            <Button size="lg" className="text-base px-10 py-6" asChild>
              <Link to="/dashboard">Get Started — It's Free</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold text-foreground">StoryForge</span>
          </div>
          <p className="font-body text-sm text-muted-foreground">
            © 2026 StoryForge. Crafted for storytellers.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
