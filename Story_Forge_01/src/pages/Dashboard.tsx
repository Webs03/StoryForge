import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen, Plus, Search, Filter, FileText, Theater,
  MoreVertical, Clock, Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import StoryCard from "@/components/StoryCard";

type WorkType = "all" | "story" | "playscript";
type StatusType = "all" | "Draft" | "Editing" | "Final";

interface Work {
  id: string;
  title: string;
  type: "story" | "playscript";
  status: "Draft" | "Editing" | "Final";
  wordCount: number;
  updatedAt: string;
  genre: string;
  excerpt: string;
}

const mockWorks: Work[] = [
  {
    id: "1", title: "The Last Lighthouse Keeper", type: "story", status: "Editing",
    wordCount: 4280, updatedAt: "2 hours ago", genre: "Literary Fiction",
    excerpt: "The fog rolled in at dusk, thick as wool, swallowing the coastline whole…"
  },
  {
    id: "2", title: "Curtain Call", type: "playscript", status: "Draft",
    wordCount: 8120, updatedAt: "Yesterday", genre: "Drama",
    excerpt: "ACT I, SCENE 1. A dimly lit stage. MARGARET stands center, clutching a letter…"
  },
  {
    id: "3", title: "Parallel Lines", type: "story", status: "Final",
    wordCount: 3150, updatedAt: "3 days ago", genre: "Science Fiction",
    excerpt: "She discovered the glitch on a Tuesday — a flicker in the mirror that lasted too long…"
  },
  {
    id: "4", title: "The Understudies", type: "playscript", status: "Editing",
    wordCount: 11400, updatedAt: "1 week ago", genre: "Comedy",
    excerpt: "CHARACTERS: TOM — an overly confident understudy. DIANE — the stage manager who's had enough…"
  },
  {
    id: "5", title: "Ember & Ash", type: "story", status: "Draft",
    wordCount: 1890, updatedAt: "2 weeks ago", genre: "Fantasy",
    excerpt: "The dragon had not spoken in three hundred years, and when it finally did…"
  },
  {
    id: "6", title: "Glass Houses", type: "playscript", status: "Final",
    wordCount: 6700, updatedAt: "1 month ago", genre: "Thriller",
    excerpt: "ACT II. The living room of a modern apartment. Rain hammers the windows…"
  },
];

const statusColors: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Editing: "bg-warm-light text-primary",
  Final: "bg-secondary text-sage-dark",
};

const Dashboard = () => {
  const [typeFilter, setTypeFilter] = useState<WorkType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = mockWorks.filter((w) => {
    if (typeFilter !== "all" && w.type !== typeFilter) return false;
    if (statusFilter !== "all" && w.status !== statusFilter) return false;
    if (searchQuery && !w.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalWords = mockWorks.reduce((s, w) => s + w.wordCount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">StoryForge</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button size="sm" asChild>
              <Link to="/document/new">
                <Plus className="h-4 w-4 mr-1" /> New Work
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Nav */}
          <aside className="hidden md:block md:col-span-3">
            <div className="sticky top-20 space-y-4">
              <div className="bg-card p-4 rounded-lg border border-border">
                <h4 className="font-display font-semibold mb-2">Library</h4>
                <nav className="flex flex-col gap-2 text-sm">
                  <Link to="/dashboard" className="text-foreground/90 hover:text-primary">My Works</Link>
                  <Link to="/document/new" className="text-foreground/90 hover:text-primary">New Work</Link>
                  <Link to="/browse" className="text-foreground/90 hover:text-primary">Browse</Link>
                </nav>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border">
                <h4 className="font-display font-semibold mb-2">Filters</h4>
                <div className="flex flex-col gap-2">
                  {(["all", "story", "playscript"] as WorkType[]).map((t) => (
                    <Button
                      key={t}
                      size="sm"
                      variant={typeFilter === t ? "default" : "outline"}
                      onClick={() => setTypeFilter(t)}
                      className="capitalize w-full"
                    >
                      {t === "all" ? "All Types" : t === "story" ? "Stories" : "Playscripts"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Feed */}
          <main className="col-span-12 md:col-span-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">Your Workshop</h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search your works…"
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{mockWorks.length} works · {totalWords.toLocaleString()} words</span>
                </div>
              </div>
            </motion.div>

            <div className="space-y-4">
              {filtered.map((work, i) => (
                <motion.div
                  key={work.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.03 }}
                >
                  <StoryCard work={work} />
                </motion.div>
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-20">
                  <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="font-display text-xl text-muted-foreground">No works found</p>
                  <p className="font-body text-sm text-muted-foreground mt-1">Try adjusting your filters.</p>
                </div>
              )}
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="hidden md:block md:col-span-3">
            <div className="sticky top-20 space-y-4">
              <div className="bg-card p-4 rounded-lg border border-border">
                <h4 className="font-display font-semibold mb-3">Recommended</h4>
                <ul className="flex flex-col gap-3">
                  {mockWorks.slice(0, 3).map((w) => (
                    <li key={w.id} className="flex items-start gap-3">
                      <div className="w-12 h-16 rounded-sm bg-muted/10 flex-shrink-0" />
                      <div>
                        <Link to={`/document/${w.id}`} className="font-body text-sm font-semibold text-foreground hover:text-primary">{w.title}</Link>
                        <div className="text-xs text-muted-foreground">{w.genre} · {w.wordCount.toLocaleString()} words</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border">
                <h4 className="font-display font-semibold mb-3">Activity</h4>
                <div className="text-xs text-muted-foreground">Last edited: {mockWorks[0].updatedAt}</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
