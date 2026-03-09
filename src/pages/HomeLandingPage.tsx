import { useEffect, useMemo, useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

const coverImagePaths = {
  tellTaleHeart: "/covers/tell-tale-heart.svg",
  hamlet: "/covers/hamlet.svg",
  giftOfTheMagi: "/covers/gift-of-the-magi.svg",
  theLottery: "/covers/the-lottery.svg",
  aRaisinInTheSun: "/covers/a-raisin-in-the-sun.svg",
  yellowWallpaper: "/covers/yellow-wallpaper.svg",
  aDollsHouse: "/covers/a-dolls-house.svg",
  lastLeaf: "/covers/last-leaf.svg",
  deathOfASalesman: "/covers/death-of-a-salesman.svg",
  romeoAndJuliet: "/covers/romeo-and-juliet.svg",
  fallback: "/covers/fallback-cover.svg",
} as const;

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

type OpenLibrarySearchResponse = {
  docs?: Array<{
    cover_i?: number;
  }>;
};

const fetchOpenLibraryCover = async (title: string, author: string) => {
  const params = new URLSearchParams({
    title,
    author,
    fields: "cover_i",
    limit: "1",
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(`https://openlibrary.org/search.json?${params.toString()}`, {
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as OpenLibrarySearchResponse;
    const coverId = payload.docs?.[0]?.cover_i;
    if (typeof coverId !== "number") return null;
    return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

const onlineImageFallback = coverImagePaths.fallback;

const storyGeneratedCovers = [
  coverImagePaths.tellTaleHeart,
  coverImagePaths.giftOfTheMagi,
  coverImagePaths.theLottery,
  coverImagePaths.yellowWallpaper,
  coverImagePaths.lastLeaf,
];

const playscriptGeneratedCovers = [
  coverImagePaths.hamlet,
  coverImagePaths.aRaisinInTheSun,
  coverImagePaths.aDollsHouse,
  coverImagePaths.deathOfASalesman,
  coverImagePaths.romeoAndJuliet,
];

const getGeneratedCover = (format: CoverFormat, index: number) => {
  const coverSet = format === "Story" ? storyGeneratedCovers : playscriptGeneratedCovers;
  return coverSet[index % coverSet.length] ?? onlineImageFallback;
};

const getInitials = (name: string, email: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1 && parts[0].length > 0) return parts[0].slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase() || "WR";
};

const buildOpenLibrarySearchHref = (title: string, author: string) =>
  `https://openlibrary.org/search?${new URLSearchParams({
    title,
    author,
  }).toString()}`;

type FamiliarWork = {
  title: string;
  author: string;
  format: CoverFormat;
  topicDescription: string;
  editorBlurb: string;
  searchTitle?: string;
};

const familiarWorks: FamiliarWork[] = [
  {
    title: "The Strange Case of Dr. Jekyll and Mr. Hyde",
    author: "Robert Louis Stevenson",
    format: "Story",
    topicDescription: "A gothic classic on identity, secrecy, and the dual nature of human character.",
    editorBlurb: "Stevenson's novella remains a key reference for psychological conflict in fiction.",
  },
  {
    title: "Macbeth",
    author: "William Shakespeare",
    format: "Playscript",
    topicDescription: "A powerful tragedy about ambition, guilt, and the cost of unchecked desire.",
    editorBlurb: "A cornerstone of dramatic structure with memorable conflict and language.",
  },
  {
    title: "The Crucible",
    author: "Arthur Miller",
    format: "Playscript",
    topicDescription: "A tense play that explores fear, accusation, and moral courage under pressure.",
    editorBlurb: "Miller's script remains one of the strongest examples of social drama on stage.",
  },
  {
    title: "Romeo & Juliet",
    author: "William Shakespeare",
    format: "Playscript",
    topicDescription: "A timeless tragedy of young love, family conflict, and fate.",
    editorBlurb: "A defining romantic tragedy with enduring influence in theater and literature.",
    searchTitle: "Romeo and Juliet",
  },
  {
    title: "If Anything Happens I Love You",
    author: "Will McCormack and Michael Govier",
    format: "Playscript",
    topicDescription: "A short-form dramatic narrative known for emotional pacing and visual storytelling.",
    editorBlurb: "A modern short-film script example with concise structure and emotional impact.",
  },
  {
    title: "Frankenstein",
    author: "Mary Shelley",
    format: "Story",
    topicDescription: "A foundational novel of science fiction, ethics, and human responsibility.",
    editorBlurb: "Shelley's novel blends horror and philosophy with lasting literary relevance.",
  },
  {
    title: "Beowulf",
    author: "Anonymous (Old English epic)",
    format: "Story",
    topicDescription: "An epic poem of heroism, legacy, and mortality across generations.",
    editorBlurb: "A classic epic that still informs heroic storytelling and mythic narrative arcs.",
  },
  {
    title: "Emma",
    author: "Jane Austen",
    format: "Story",
    topicDescription: "A sharp social novel about self-awareness, class, and relationships.",
    editorBlurb: "Austen's character-driven prose is a model for subtle irony and voice.",
  },
  {
    title: "Pride & Prejudice",
    author: "Jane Austen",
    format: "Story",
    topicDescription: "A beloved novel of wit, social expectation, and personal growth.",
    editorBlurb: "Austen's dialogue and character arcs make this a benchmark for classic romance.",
    searchTitle: "Pride and Prejudice",
  },
  {
    title: "I Know Why the Caged Bird Sings",
    author: "Maya Angelou",
    format: "Story",
    topicDescription: "A powerful autobiographical work on resilience, identity, and voice.",
    editorBlurb: "Angelou's memoir is admired for emotional honesty and lyrical narrative strength.",
  },
  {
    title: "Sense & Sensibility",
    author: "Jane Austen",
    format: "Story",
    topicDescription: "A classic exploration of reason, emotion, and family expectations.",
    editorBlurb: "Austen balances social commentary and character growth with precise prose.",
    searchTitle: "Sense and Sensibility",
  },
  {
    title: "Paradise Lost",
    author: "John Milton",
    format: "Story",
    topicDescription: "An epic poem of rebellion, free will, and moral consequence.",
    editorBlurb: "Milton's scope and poetic ambition make it a landmark in English literature.",
  },
  {
    title: "Wuthering Heights",
    author: "Emily Bronte",
    format: "Story",
    topicDescription: "A dark romantic novel centered on obsession, memory, and revenge.",
    editorBlurb: "Bronte's intense tone and layered narration keep this work continually discussed.",
  },
  {
    title: "Wait Till Helen Comes",
    author: "Mary Downing Hahn",
    format: "Story",
    topicDescription: "A well-known ghost story blending family tension and supernatural mystery.",
    editorBlurb: "A strong middle-grade horror example with accessible pacing and atmosphere.",
  },
];

const topicsForYouWorks: FamiliarWork[] = [
  familiarWorks[0], // Dr. Jekyll and Mr. Hyde
  familiarWorks[5], // Frankenstein
  familiarWorks[8], // Pride & Prejudice
  familiarWorks[9], // I Know Why the Caged Bird Sings
  familiarWorks[1], // Macbeth
  familiarWorks[2], // The Crucible
];

const editorsPickWorks: FamiliarWork[] = [
  {
    title: "Othello",
    author: "William Shakespeare",
    format: "Playscript",
    topicDescription: "A classic tragedy of trust, jealousy, and manipulation.",
    editorBlurb: "Shakespeare's dramatic tension and character psychology remain stage essentials.",
  },
  {
    title: "King Lear",
    author: "William Shakespeare",
    format: "Playscript",
    topicDescription: "A major tragedy on power, family loyalty, and human frailty.",
    editorBlurb: "A masterclass in tragic structure, emotional scale, and dramatic language.",
  },
  {
    title: "All My Sons",
    author: "Arthur Miller",
    format: "Playscript",
    topicDescription: "A post-war family drama about responsibility, denial, and consequence.",
    editorBlurb: "Miller's tightly built script is an excellent reference for modern realistic theater.",
  },
  {
    title: "Persuasion",
    author: "Jane Austen",
    format: "Story",
    topicDescription: "A mature Austen novel centered on regret, second chances, and social pressure.",
    editorBlurb: "Austen's late style offers quiet emotional depth and precise character movement.",
  },
  {
    title: "Treasure Island",
    author: "Robert Louis Stevenson",
    format: "Story",
    topicDescription: "A foundational adventure novel known for momentum, atmosphere, and voice.",
    editorBlurb: "Stevenson's pacing and scene-building make this a lasting adventure benchmark.",
  },
  {
    title: "Northanger Abbey",
    author: "Jane Austen",
    format: "Story",
    topicDescription: "A witty social satire that playfully critiques gothic fiction conventions.",
    editorBlurb: "Austen blends parody and character growth with clean, readable prose craft.",
  },
];

const coverLookupTargets = Array.from(
  new Map(
    [...familiarWorks, ...topicsForYouWorks, ...editorsPickWorks].map((work) => [
      work.title,
      {
        title: work.title,
        author: work.author,
        searchTitle: work.searchTitle ?? work.title,
      },
    ])
  ).values()
);

const recommendedTopics = topicsForYouWorks.slice(0, 6).map((work, index) => ({
  title: work.title,
  format: work.format,
  description: work.topicDescription,
  imageSrc: getGeneratedCover(work.format, index),
}));

const fallbackTrendingNow: TrendingItem[] = familiarWorks.map((work, index) => ({
  title: work.title,
  category: work.format === "Playscript" ? "Classic Playscript" : "Classic Story",
  format: work.format,
  reads: `By ${work.author}`,
  imageSrc: getGeneratedCover(work.format, index),
  href: buildOpenLibrarySearchHref(work.searchTitle ?? work.title, work.author),
  source: "StoryForge",
}));

const editorsPick = editorsPickWorks.slice(0, 6).map((work, index) => ({
  title: work.title,
  category: `${work.format} · ${work.author}`,
  blurb: work.editorBlurb,
  imageSrc: getGeneratedCover(work.format, index + 1),
}));

const HomeLandingPage = () => {
  const { user, userProfile } = useAuth();
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>(fallbackTrendingNow);
  const [trendingState, setTrendingState] = useState<"loading" | "live" | "fallback">("loading");
  const [trendingUpdatedAt, setTrendingUpdatedAt] = useState<string | null>(null);
  const [liveCoversByTitle, setLiveCoversByTitle] = useState<Record<string, string>>({});
  const isAuthenticated = Boolean(user);
  const profileName =
    userProfile?.name || user?.displayName || user?.email?.split("@")[0] || "Writer";
  const profileEmail = userProfile?.email || user?.email || "No email";
  const profileInitials = getInitials(profileName, profileEmail);
  const trendingNowItems = trendingItems.slice(0, 8);
  const rankedTrendingItems = useMemo(
    () =>
      trendingNowItems.map((item, index) => {
        const rankScore = item.score ?? Math.max(220, 1200 - index * 110);
        return {
          ...item,
          rankScore,
          estimatedReads: Math.round(rankScore * 38 + 14000),
          estimatedLikes: Math.round(rankScore * 7 + 1800),
        };
      }),
    [trendingNowItems]
  );
  const mostReadItems = [...rankedTrendingItems]
    .sort((a, b) => b.estimatedReads - a.estimatedReads)
    .slice(0, 4);
  const mostLikedItems = [...rankedTrendingItems]
    .sort((a, b) => b.estimatedLikes - a.estimatedLikes)
    .slice(0, 4);

  const getCoverSrc = (title: string, fallbackSrc: string) =>
    liveCoversByTitle[title] ?? fallbackSrc;

  useEffect(() => {
    let cancelled = false;

    const fetchCuratedCovers = async () => {
      const results = await Promise.allSettled(
        coverLookupTargets.map(async (item) => {
          const coverSrc = await fetchOpenLibraryCover(item.searchTitle, item.author);
          return { title: item.title, coverSrc };
        })
      );

      if (cancelled) return;

      const nextCovers: Record<string, string> = {};
      for (const result of results) {
        if (result.status !== "fulfilled") continue;
        if (!result.value.coverSrc) continue;
        nextCovers[result.value.title] = result.value.coverSrc;
      }

      if (Object.keys(nextCovers).length > 0) {
        setLiveCoversByTitle(nextCovers);
      }
    };

    void fetchCuratedCovers();
    return () => {
      cancelled = true;
    };
  }, []);

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
            const subreddit = typeof post.subreddit === "string" ? post.subreddit : "writing";
            const permalink = typeof post.permalink === "string" ? post.permalink : "";
            const ups = typeof post.ups === "number" ? post.ups : 0;
            const thumbnail =
              typeof post.thumbnail === "string" && /^https?:\/\//.test(post.thumbnail)
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
          .slice(0, 8);

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
          <Link to={isAuthenticated ? "/home" : "/"} className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">StoryForge</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 font-body text-sm">
            <a href="#discover" className="text-muted-foreground hover:text-foreground transition-colors">Discover</a>
            <a href="#topics" className="text-muted-foreground hover:text-foreground transition-colors">Topics</a>
            <a href="#for-you" className="text-muted-foreground hover:text-foreground transition-colors">For You</a>
            <a href="#most-read" className="text-muted-foreground hover:text-foreground transition-colors">Most Read</a>
            <a href="#most-liked" className="text-muted-foreground hover:text-foreground transition-colors">Most Liked</a>
            {!isAuthenticated && (
              <a href="#workflow" className="text-muted-foreground hover:text-foreground transition-colors">Workflow</a>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Button variant="outline" size="sm" className="sm:hidden" asChild>
                  <Link to="/dashboard">Profile</Link>
                </Button>
                <Link
                  to="/dashboard"
                  className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1.5 hover:border-primary/40 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile?.photoURL || ""} alt={profileName} />
                    <AvatarFallback>{profileInitials}</AvatarFallback>
                  </Avatar>
                  <div className="leading-tight">
                    <p className="font-body text-sm font-medium text-foreground">{profileName}</p>
                    <p className="font-body text-[11px] text-muted-foreground">Open Dashboard</p>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/signin">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Discover Section */}
      <section id="discover" className="pt-24 pb-20 md:pt-28 md:pb-28 bg-card">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">
              Trending Now
            </h2>
            <p className="font-body text-sm text-muted-foreground mt-2">
              {trendingState === "live" && trendingUpdatedAt
                ? `Live from Reddit · Updated ${new Date(trendingUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : trendingState === "loading"
                  ? "Loading live trends..."
                  : ""}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
            {trendingNowItems.map((story, i) => (
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
                    src={getCoverSrc(story.title, story.imageSrc)}
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
            id="for-you"
          >
            <Star className="h-5 w-5 text-primary" />
            <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              You Might Also Like These
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
                    src={getCoverSrc(story.title, story.imageSrc)}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-14">
            <motion.article
              id="most-read"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-xl border border-border bg-background p-5"
            >
              <h4 className="font-display text-2xl font-semibold text-foreground mb-1">Most Read</h4>
              <p className="font-body text-sm text-muted-foreground mb-4">
                Stories currently drawing the biggest reading momentum.
              </p>
              <div className="space-y-3">
                {mostReadItems.map((story, index) => (
                  <a
                    key={`most-read-${story.title}`}
                    href={story.href}
                    target={story.href ? "_blank" : undefined}
                    rel={story.href ? "noreferrer" : undefined}
                    className="flex items-center gap-3 rounded-lg border border-border p-2.5 hover:border-primary/40 transition-colors"
                  >
                    <span className="w-6 text-center font-display text-lg text-primary">{index + 1}</span>
                    <div className="h-14 w-10 overflow-hidden rounded-md border border-border bg-muted shrink-0">
                      <img
                        src={getCoverSrc(story.title, story.imageSrc)}
                        alt={story.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = onlineImageFallback;
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-body text-sm font-medium text-foreground truncate">{story.title}</p>
                      <p className="font-body text-xs text-muted-foreground">{story.category}</p>
                    </div>
                    <span className="ml-auto font-body text-xs text-muted-foreground whitespace-nowrap">
                      {story.estimatedReads.toLocaleString()} reads
                    </span>
                  </a>
                ))}
              </div>
            </motion.article>

            <motion.article
              id="most-liked"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="rounded-xl border border-border bg-background p-5"
            >
              <h4 className="font-display text-2xl font-semibold text-foreground mb-1">Most Liked</h4>
              <p className="font-body text-sm text-muted-foreground mb-4">
                Picks getting the strongest positive reactions right now.
              </p>
              <div className="space-y-3">
                {mostLikedItems.map((story, index) => (
                  <a
                    key={`most-liked-${story.title}`}
                    href={story.href}
                    target={story.href ? "_blank" : undefined}
                    rel={story.href ? "noreferrer" : undefined}
                    className="flex items-center gap-3 rounded-lg border border-border p-2.5 hover:border-primary/40 transition-colors"
                  >
                    <span className="w-6 text-center font-display text-lg text-primary">{index + 1}</span>
                    <div className="h-14 w-10 overflow-hidden rounded-md border border-border bg-muted shrink-0">
                      <img
                        src={getCoverSrc(story.title, story.imageSrc)}
                        alt={story.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = onlineImageFallback;
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-body text-sm font-medium text-foreground truncate">{story.title}</p>
                      <p className="font-body text-xs text-muted-foreground">{story.category}</p>
                    </div>
                    <span className="ml-auto font-body text-xs text-muted-foreground whitespace-nowrap">
                      {story.estimatedLikes.toLocaleString()} likes
                    </span>
                  </a>
                ))}
              </div>
            </motion.article>
          </div>
        </div>
      </section>

      {!isAuthenticated && (
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
      )}

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
                    src={getCoverSrc(topic.title, topic.imageSrc)}
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

      {!isAuthenticated && (
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
      )}

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
              {isAuthenticated ? "Ready to Start Your Own Article?" : "Ready to Forge Your Story?"}
            </h2>
            <p className="font-body text-lg text-muted-foreground mb-10">
              {isAuthenticated
                ? "Use the profile button at the top-right to open your dashboard and start writing anytime."
                : "Join writers who trust StoryForge to keep their words safe, organized, and beautifully formatted."}
            </p>
            {isAuthenticated ? (
              <Button size="lg" variant="outline" className="text-base px-10 py-6" asChild>
                <a href="#discover">Keep Exploring Recommendations</a>
              </Button>
            ) : (
              <Button size="lg" className="text-base px-10 py-6" asChild>
                <Link to="/signup">Get Started — It's Free</Link>
              </Button>
            )}
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

export default HomeLandingPage;
