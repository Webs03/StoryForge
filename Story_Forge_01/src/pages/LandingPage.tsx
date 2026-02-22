import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Compass, Flame, PenLine, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import StoryCard from "@/components/StoryCard";
import { useDocuments } from "@/hooks/use-documents";
import { useAuth } from "@/hooks/use-auth";

const scoreStory = (reads: number, votes: number, comments: number) =>
  reads + votes * 3 + comments * 2;

const LandingPage = () => {
  const { user, userProfile } = useAuth();
  const { documents, publicStories, publicLoading } = useDocuments();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedGenre, setSelectedGenre] = useState("all");

  const availableLanguages = useMemo(() => {
    const values = Array.from(new Set(publicStories.map((story) => story.language))).filter(Boolean);
    return ["all", ...values.sort((a, b) => a.localeCompare(b))];
  }, [publicStories]);

  const availableGenres = useMemo(() => {
    const values = Array.from(new Set(publicStories.map((story) => story.genre))).filter(Boolean);
    return ["all", ...values.sort((a, b) => a.localeCompare(b))];
  }, [publicStories]);

  const filteredStories = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return publicStories.filter((story) => {
      if (selectedLanguage !== "all" && story.language !== selectedLanguage) return false;
      if (selectedGenre !== "all" && story.genre !== selectedGenre) return false;

      if (!normalizedSearch) return true;

      const searchableText = [
        story.title,
        story.description,
        story.genre,
        story.language,
        story.ownerName,
        story.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [publicStories, searchQuery, selectedGenre, selectedLanguage]);

  const trendingStories = useMemo(
    () =>
      [...filteredStories]
        .sort(
          (a, b) =>
            scoreStory(b.reads, b.votes, b.comments) -
            scoreStory(a.reads, a.votes, a.comments),
        )
        .slice(0, 6),
    [filteredStories],
  );

  const recommendedStories = useMemo(() => {
    if (!user || documents.length === 0) {
      return trendingStories.slice(0, 6);
    }

    const favoriteGenres = new Set(
      documents.map((doc) => doc.genre.toLowerCase()).filter(Boolean),
    );
    const favoriteTags = new Set(
      documents.flatMap((doc) => doc.tags.map((tag) => tag.toLowerCase())),
    );

    const personalized = filteredStories
      .filter((story) => story.owner !== user.uid)
      .map((story) => {
        let score = scoreStory(story.reads, story.votes, story.comments);
        if (favoriteGenres.has(story.genre.toLowerCase())) score += 50;
        const matchingTags = story.tags.filter((tag) =>
          favoriteTags.has(tag.toLowerCase()),
        ).length;
        score += matchingTags * 25;
        return { story, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((entry) => entry.story);

    return personalized.length > 0 ? personalized : trendingStories.slice(0, 6);
  }, [documents, filteredStories, trendingStories, user]);

  const continueReading = useMemo(() => documents.slice(0, 3), [documents]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container mx-auto h-16 px-6 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">StoryForge</span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search stories, tags, or writers..."
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm">
                <Link to="/dashboard">{userProfile?.name ? `${userProfile.name}'s Desk` : "Dashboard"}</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/signin">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="pt-28 pb-12 md:pt-36 md:pb-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="text-sm tracking-widest uppercase text-primary font-semibold mb-3">
              Discovery and Writing Hub
            </p>
            <h1 className="font-display text-4xl md:text-6xl leading-tight">
              Discover stories, keep your reading flow, and publish your own chapters.
            </h1>
            <p className="mt-5 text-muted-foreground text-lg">
              StoryForge now works as a reading-and-writing home: personalized recommendations,
              language-first browsing, and one-click access to your writing workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to={user ? "/dashboard" : "/signup"}>
                  <PenLine className="h-4 w-4 mr-1" />
                  Start Writing
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#discover">
                  <Compass className="h-4 w-4 mr-1" />
                  Start Reading
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="discover" className="pb-8">
        <div className="container mx-auto px-6">
          <div className="rounded-lg border border-border bg-card p-4 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative md:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search stories, tags, or writers..."
                  className="pl-10"
                />
              </div>

              <select
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {availableLanguages.map((language) => (
                  <option key={language} value={language}>
                    {language === "all" ? "All Languages" : language}
                  </option>
                ))}
              </select>

              <select
                value={selectedGenre}
                onChange={(event) => setSelectedGenre(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {availableGenres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre === "all" ? "All Genres" : genre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-3xl flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              {user ? "Recommended for You" : "Editor's Picks"}
            </h2>
            <Badge variant="outline">{recommendedStories.length} stories</Badge>
          </div>

          {publicLoading ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Spinner />
              Loading recommendations...
            </div>
          ) : recommendedStories.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {recommendedStories.map((story) => (
                <StoryCard key={story.id} work={story} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              No public stories match your current filters.
            </div>
          )}
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-3xl flex items-center gap-2">
              <Flame className="h-6 w-6 text-primary" />
              Trending Now
            </h2>
            <Badge variant="outline">{trendingStories.length} stories</Badge>
          </div>

          {trendingStories.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {trendingStories.map((story) => (
                <StoryCard key={story.id} work={story} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              No trending stories yet. Publish a public story to appear here.
            </div>
          )}
        </div>
      </section>

      {user && (
        <section className="py-10">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-3xl">Continue Reading</h2>
              <Button variant="ghost" asChild>
                <Link to="/dashboard">Open Dashboard</Link>
              </Button>
            </div>

            {continueReading.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {continueReading.map((story) => (
                  <StoryCard key={story.id} work={story} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
                You have not started any stories yet.
              </div>
            )}
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="rounded-lg border border-border bg-card p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="font-display text-3xl mb-2">Ready to publish your next chapter?</h3>
              <p className="text-muted-foreground">
                Create a story, write chapter by chapter, then make it public for discovery.
              </p>
            </div>
            <Button size="lg" asChild>
              <Link to={user ? "/dashboard" : "/signup"}>Start Writing</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-semibold">StoryForge</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © 2026 StoryForge · About · Terms · Help
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
