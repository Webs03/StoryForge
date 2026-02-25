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

const buildCoverImage = (
  format: CoverFormat,
  toneA: string,
  toneB: string,
  highlight: string
) => {
  const motif =
    format === "Story"
      ? `
        <rect x="168" y="248" width="122" height="166" rx="14" fill="rgba(255,255,255,0.2)" />
        <rect x="310" y="248" width="122" height="166" rx="14" fill="rgba(255,255,255,0.2)" />
        <rect x="295" y="248" width="10" height="166" rx="5" fill="rgba(255,255,255,0.35)" />
        <rect x="186" y="280" width="86" height="10" rx="5" fill="rgba(255,255,255,0.7)" />
        <rect x="186" y="304" width="72" height="9" rx="4.5" fill="rgba(255,255,255,0.45)" />
        <rect x="328" y="280" width="86" height="10" rx="5" fill="rgba(255,255,255,0.7)" />
        <rect x="328" y="304" width="72" height="9" rx="4.5" fill="rgba(255,255,255,0.45)" />
      `
      : `
        <rect x="196" y="226" width="208" height="266" rx="18" fill="rgba(255,255,255,0.22)" />
        <rect x="226" y="272" width="148" height="10" rx="5" fill="rgba(255,255,255,0.72)" />
        <rect x="226" y="300" width="122" height="8" rx="4" fill="rgba(255,255,255,0.5)" />
        <rect x="226" y="338" width="136" height="8" rx="4" fill="rgba(255,255,255,0.5)" />
        <rect x="226" y="366" width="112" height="8" rx="4" fill="rgba(255,255,255,0.5)" />
        <rect x="226" y="404" width="146" height="8" rx="4" fill="rgba(255,255,255,0.5)" />
      `;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900">
      <defs>
        <linearGradient id="coverGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${toneA}" />
          <stop offset="100%" stop-color="${toneB}" />
        </linearGradient>
      </defs>
      <rect width="600" height="900" fill="url(#coverGradient)" />
      <circle cx="108" cy="120" r="146" fill="rgba(255,255,255,0.16)" />
      <circle cx="532" cy="802" r="186" fill="rgba(255,255,255,0.12)" />
      <rect x="34" y="34" width="532" height="832" rx="30" fill="none" stroke="rgba(255,255,255,0.34)" stroke-width="2" />
      <rect x="70" y="84" width="186" height="44" rx="22" fill="${highlight}" />
      <text x="163" y="111" text-anchor="middle" font-size="20" font-family="Source Sans 3, Arial, sans-serif" font-weight="700" fill="#20222e">${format.toUpperCase()}</text>
      ${motif}
      <rect x="138" y="598" width="324" height="8" rx="4" fill="rgba(255,255,255,0.78)" />
      <rect x="138" y="628" width="278" height="8" rx="4" fill="rgba(255,255,255,0.56)" />
      <rect x="138" y="658" width="242" height="8" rx="4" fill="rgba(255,255,255,0.56)" />
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const onlineImageFallback = buildCoverImage("Story", "#f97316", "#fb923c", "#ffedd5");

const recommendedTopics = [
  {
    title: "Short Story Arcs",
    format: "Story",
    description: "Discover high-performing structures for flash fiction and serialized short stories.",
    imageSrc: buildCoverImage("Story", "#ea580c", "#fb923c", "#ffedd5"),
  },
  {
    title: "Playscript Dialogue",
    format: "Playscript",
    description: "Learn stage-ready dialogue pacing, scene transitions, and character blocking cues.",
    imageSrc: buildCoverImage("Playscript", "#2563eb", "#60a5fa", "#dbeafe"),
  },
  {
    title: "Romance Beats",
    format: "Story",
    description: "Blend emotional tension and character growth to keep readers hooked chapter by chapter.",
    imageSrc: buildCoverImage("Story", "#be185d", "#f472b6", "#fce7f3"),
  },
];

const trendingNow = [
  {
    title: "When the City Forgets",
    category: "Mystery Story",
    format: "Story",
    reads: "24.1K reads",
    imageSrc: buildCoverImage("Story", "#f97316", "#fb923c", "#ffedd5"),
  },
  {
    title: "Orbit of Silence: Act I",
    category: "Sci-Fi Stage Drama",
    format: "Playscript",
    reads: "18.6K reads",
    imageSrc: buildCoverImage("Playscript", "#2563eb", "#60a5fa", "#dbeafe"),
  },
  {
    title: "The Orchard at Dusk",
    category: "Romance Story",
    format: "Story",
    reads: "16.3K reads",
    imageSrc: buildCoverImage("Story", "#be185d", "#f472b6", "#fce7f3"),
  },
  {
    title: "Room 307: Stage Cut",
    category: "Thriller Playscript",
    format: "Playscript",
    reads: "21.9K reads",
    imageSrc: buildCoverImage("Playscript", "#4338ca", "#818cf8", "#e0e7ff"),
  },
];

const editorsPick = [
  {
    title: "Ashes of the Last Kingdom",
    category: "Fantasy",
    blurb: "A sharp political fantasy with layered worldbuilding and a memorable protagonist voice.",
    imageSrc: buildCoverImage("Story", "#c2410c", "#fb923c", "#ffedd5"),
  },
  {
    title: "Exit Left, Sunrise",
    category: "Contemporary Playscript",
    blurb: "A dialogue-first script with precise stage direction and emotionally grounded scene breaks.",
    imageSrc: buildCoverImage("Playscript", "#1d4ed8", "#60a5fa", "#dbeafe"),
  },
  {
    title: "Hollow Frequency",
    category: "Horror",
    blurb: "Smart pacing, excellent tension control, and an ending that lands without over-explaining.",
    imageSrc: buildCoverImage("Story", "#7c3aed", "#a78bfa", "#ede9fe"),
  },
];

const LandingPage = () => {
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
              Your Stories and Playscripts, in One Bright Creative Home
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
              {trendingNow.map((story) => (
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
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
            {trendingNow.map((story, i) => (
              <motion.article
                key={story.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-xl overflow-hidden border border-border bg-background group hover:border-primary/30 transition-colors"
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
                    <p className="font-body text-xs text-white/80">{story.category} · {story.reads}</p>
                  </div>
                </div>
              </motion.article>
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
