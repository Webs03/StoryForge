import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock3,
  LogOut,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import StoryCard from "@/components/StoryCard";
import {
  countWords,
  useDocuments,
  type WorkStatus,
  type WorkType,
} from "@/hooks/use-documents";
import { useAuth } from "@/hooks/use-auth";

type WorkTypeFilter = WorkType | "all";
type StatusFilter = WorkStatus | "all";

const Dashboard = () => {
  const navigate = useNavigate();
  const { userProfile, logOut } = useAuth();
  const { documents, loading, error, createDocument } = useDocuments();
  const [typeFilter, setTypeFilter] = useState<WorkTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return documents.filter((doc) => {
      if (typeFilter !== "all" && doc.type !== typeFilter) return false;
      if (statusFilter !== "all" && doc.status !== statusFilter) return false;
      if (!normalizedQuery) return true;

      const searchable = [
        doc.title,
        doc.description,
        doc.genre,
        doc.language,
        doc.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [documents, searchQuery, statusFilter, typeFilter]);

  const totalWords = useMemo(
    () => documents.reduce((sum, doc) => sum + countWords(doc.content), 0),
    [documents],
  );

  const lastEdited = documents[0];
  const recommended = [...documents]
    .sort((a, b) => b.votes + b.reads - (a.votes + a.reads))
    .slice(0, 3);

  const handleCreateWork = async () => {
    try {
      setIsCreating(true);
      const type = typeFilter === "all" ? "story" : typeFilter;
      const newDocumentId = await createDocument({
        title: "Untitled Story",
        type,
        status: "Draft",
        genre: "General",
        language: "English",
        content: "",
        description: "",
        isPublic: false,
      });
      navigate(`/document/${newDocumentId}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsSigningOut(true);
      await logOut();
      navigate("/signin");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">StoryForge</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleCreateWork} disabled={isCreating}>
              <Plus className="h-4 w-4 mr-1" />
              {isCreating ? "Creating..." : "New Work"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isSigningOut}
            >
              <LogOut className="h-4 w-4 mr-1" />
              {isSigningOut ? "Signing out..." : "Sign out"}
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
                  <Link to="/dashboard" className="text-foreground/90 hover:text-primary">
                    My Works
                  </Link>
                  <button
                    type="button"
                    className="text-left text-foreground/90 hover:text-primary"
                    onClick={handleCreateWork}
                    disabled={isCreating}
                  >
                    Start New Story
                  </button>
                  <Link to="/" className="text-foreground/90 hover:text-primary">
                    Discover Stories
                  </Link>
                </nav>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border">
                <h4 className="font-display font-semibold mb-2">Type</h4>
                <div className="flex flex-col gap-2">
                  {(["all", "story", "playscript"] as WorkTypeFilter[]).map((type) => (
                    <Button
                      key={type}
                      size="sm"
                      variant={typeFilter === type ? "default" : "outline"}
                      onClick={() => setTypeFilter(type)}
                      className="capitalize w-full"
                    >
                      {type === "all"
                        ? "All Types"
                        : type === "story"
                          ? "Stories"
                          : "Playscripts"}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border">
                <h4 className="font-display font-semibold mb-2">Status</h4>
                <div className="flex flex-col gap-2">
                  {(["all", "Draft", "Editing", "Final"] as StatusFilter[]).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={statusFilter === status ? "default" : "outline"}
                      onClick={() => setStatusFilter(status)}
                      className="w-full"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Feed */}
          <main className="col-span-12 md:col-span-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Your Workshop
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome back{userProfile?.name ? `, ${userProfile.name}` : ""}.
              </p>
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
                  <span className="text-sm text-muted-foreground">
                    {documents.length} works · {totalWords.toLocaleString()} words
                  </span>
                </div>
              </div>
            </motion.div>

            {loading && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground py-8">
                <Spinner />
                Loading your works...
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive mb-4">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {filteredDocuments.map((work, i) => (
                <motion.div
                  key={work.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.03 }}
                >
                  <StoryCard work={work} />
                </motion.div>
              ))}

              {filteredDocuments.length === 0 && (
                <div className="text-center py-20">
                  <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="font-display text-xl text-muted-foreground">No works found</p>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    Try adjusting your filters or create a new work.
                  </p>
                  <Button className="mt-4" onClick={handleCreateWork} disabled={isCreating}>
                    <Plus className="h-4 w-4 mr-1" />
                    New Work
                  </Button>
                </div>
              )}
            </div>
          </main>

          <aside className="hidden md:block md:col-span-3">
            <div className="sticky top-20 space-y-4">
              <div className="bg-card p-4 rounded-lg border border-border">
                <h4 className="font-display font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Recommended
                </h4>
                <ul className="flex flex-col gap-3">
                  {recommended.map((work) => (
                    <li key={work.id} className="flex items-start gap-3">
                      <div className="w-12 h-16 rounded-sm bg-muted/10 flex-shrink-0" />
                      <div>
                        <Link
                          to={`/document/${work.id}`}
                          className="font-body text-sm font-semibold text-foreground hover:text-primary"
                        >
                          {work.title}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {work.genre} · {countWords(work.content).toLocaleString()} words
                        </div>
                      </div>
                    </li>
                  ))}
                  {recommended.length === 0 && (
                    <li className="text-xs text-muted-foreground">
                      Once you create stories, recommendations will appear here.
                    </li>
                  )}
                </ul>
              </div>

              <div className="bg-card p-4 rounded-lg border border-border">
                <h4 className="font-display font-semibold mb-3">Activity</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  Last edited:{" "}
                  {lastEdited ? lastEdited.updatedAt.toLocaleString() : "No recent activity"}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
