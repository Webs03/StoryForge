import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  FileText,
  Theater,
  Clock,
  Hash,
  LogOut,
  LayoutGrid,
  Sparkles,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import {
  type Document,
  type DocumentStatus,
  type DocumentType,
  useDocuments,
} from "@/hooks/use-documents";

type WorkType = "all" | DocumentType;
type StatusType = "all" | DocumentStatus;

const statusColors: Record<DocumentStatus, string> = {
  Draft: "bg-muted text-muted-foreground",
  Editing: "bg-warm-light text-primary",
  Final: "bg-secondary text-sage-dark",
};

const getWordCount = (content: string) => {
  const trimmed = content.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
};

const formatRelativeTime = (value: Date) => {
  const diff = Date.now() - value.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return value.toLocaleDateString();
};

const getExcerpt = (document: Document) => {
  const trimmed = document.content.trim();
  if (!trimmed) return "Start writing to build your first draft...";
  return trimmed.length > 160 ? `${trimmed.slice(0, 160)}...` : trimmed;
};

const getInitials = (name: string, email: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1 && parts[0].length > 0) return parts[0].slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase() || "WR";
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile, logOut } = useAuth();
  const { documents, loading, error, createDocument } = useDocuments();
  const [typeFilter, setTypeFilter] = useState<WorkType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<DocumentType | null>(null);

  const profileName =
    userProfile?.name || user?.displayName || user?.email?.split("@")[0] || "Writer";
  const profileEmail = userProfile?.email || user?.email || "No email";
  const profileInitials = getInitials(profileName, profileEmail);

  const filtered = useMemo(() => documents.filter((w) => {
    if (typeFilter !== "all" && w.type !== typeFilter) return false;
    if (statusFilter !== "all" && w.status !== statusFilter) return false;
    if (
      searchQuery &&
      !`${w.title} ${w.content} ${w.genre}`.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  }), [documents, typeFilter, statusFilter, searchQuery]);

  const totalWords = documents.reduce((sum, document) => sum + getWordCount(document.content), 0);
  const storyCount = documents.filter((document) => document.type === "story").length;
  const playscriptCount = documents.filter((document) => document.type === "playscript").length;
  const recentWorks = [...documents]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 3);

  const handleCreate = async (type: DocumentType) => {
    try {
      setActionError(null);
      setCreatingType(type);
      const docId = await createDocument(
        type === "story" ? "Untitled Story" : "Untitled Playscript",
        "",
        { type, status: "Draft" }
      );
      navigate(`/document/${docId}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to create new work");
    } finally {
      setCreatingType(null);
    }
  };

  const handleLogout = async () => {
    try {
      setActionError(null);
      await logOut();
      navigate("/signin");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to sign out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground font-body">
          <Spinner />
          <span>Loading your workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">StoryForge</span>
          </Link>
          <div className="hidden md:flex items-center gap-3 min-w-[260px]">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
                placeholder="Search titles, content, genre..."
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => handleCreate("story")}
              disabled={creatingType !== null}
            >
              <Plus className="h-4 w-4 mr-1" /> New Story
            </Button>
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-border px-2.5 py-1.5 bg-card">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userProfile?.photoURL || ""} alt={profileName} />
                <AvatarFallback>{profileInitials}</AvatarFallback>
              </Avatar>
              <div className="leading-tight">
                <p className="font-body text-sm font-medium text-foreground">{profileName}</p>
                <p className="font-body text-xs text-muted-foreground">{profileEmail}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-background p-8 mb-8"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-primary font-body font-semibold mb-3">
            Your Workspace
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Welcome back, {profileName.split(" ")[0]}
          </h1>
          <p className="font-body text-muted-foreground max-w-2xl">
            Manage your drafts, track writing momentum, and continue exactly where you left off.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => handleCreate("story")} disabled={creatingType !== null}>
              <Plus className="h-4 w-4 mr-1" /> New Story
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCreate("playscript")}
              disabled={creatingType !== null}
            >
              <Theater className="h-4 w-4 mr-1" /> New Playscript
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Works",
              value: documents.length.toLocaleString(),
              icon: LayoutGrid,
              tone: "text-primary",
            },
            {
              label: "Total Words",
              value: totalWords.toLocaleString(),
              icon: Hash,
              tone: "text-emerald-600",
            },
            {
              label: "Stories",
              value: storyCount.toLocaleString(),
              icon: FileText,
              tone: "text-sky-600",
            },
            {
              label: "Playscripts",
              value: playscriptCount.toLocaleString(),
              icon: Theater,
              tone: "text-amber-600",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-body text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.tone}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-display text-3xl font-bold text-foreground">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 md:max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search works..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {(["all", "story", "playscript"] as WorkType[]).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={typeFilter === t ? "default" : "outline"}
                onClick={() => setTypeFilter(t)}
                className="capitalize"
              >
                {t === "all" ? "All Types" : t === "story" ? "Stories" : "Playscripts"}
              </Button>
            ))}
            <span className="w-px h-5 bg-border mx-1" />
            {(["all", "Draft", "Editing", "Final"] as StatusType[]).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "All Status" : s}
              </Button>
            ))}
          </div>
        </div>

        {(error || actionError) && (
          <p className="font-body text-sm text-destructive mb-6">{error || actionError}</p>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-display text-2xl text-foreground">Your Works</CardTitle>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    {filtered.length} matching {filtered.length === 1 ? "result" : "results"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCreate("story")}
                  disabled={creatingType !== null}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.map((work, i) => (
                    <motion.div
                      key={work.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.03 }}
                    >
                      <Link
                        to={`/document/${work.id}`}
                        className="block rounded-xl border border-border p-5 bg-background hover:border-primary/30 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {work.type === "story" ? (
                              <FileText className="h-4 w-4 text-primary" />
                            ) : (
                              <Theater className="h-4 w-4 text-primary" />
                            )}
                            <span className="font-body text-xs text-muted-foreground uppercase tracking-wide">
                              {work.type === "story" ? "Story" : "Playscript"}
                            </span>
                          </div>
                          <Badge className={statusColors[work.status]} variant="secondary">
                            {work.status}
                          </Badge>
                        </div>

                        <h3 className="font-display text-lg font-semibold text-foreground mb-2 line-clamp-1">
                          {work.title}
                        </h3>
                        <p className="font-body text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                          {getExcerpt(work)}
                        </p>

                        <div className="flex items-center justify-between text-xs font-body text-muted-foreground">
                          <span>{work.genre}</span>
                          <span>
                            {getWordCount(work.content).toLocaleString()} words ·{" "}
                            {formatRelativeTime(work.updatedAt)}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4">
                  <FolderOpen className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="font-display text-xl text-foreground mb-1">
                    No works found
                  </h3>
                  <p className="font-body text-sm text-muted-foreground mb-5">
                    Adjust filters or create your first document for this account.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button onClick={() => handleCreate("story")} disabled={creatingType !== null}>
                      <Plus className="h-4 w-4 mr-1" /> New Story
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCreate("playscript")}
                      disabled={creatingType !== null}
                    >
                      <Theater className="h-4 w-4 mr-1" /> New Playscript
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-xl flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Account Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="font-body text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Profile
                </p>
                <p className="font-body text-sm font-semibold text-foreground">{profileName}</p>
                <p className="font-body text-xs text-muted-foreground">{profileEmail}</p>
                <p className="font-body text-xs text-muted-foreground mt-2">
                  Member since{" "}
                  {userProfile?.createdAt
                    ? new Date(userProfile.createdAt).toLocaleDateString()
                    : "recently"}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-background p-4">
                <p className="font-body text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Recent Activity
                </p>
                {recentWorks.length > 0 ? (
                  <div className="space-y-3">
                    {recentWorks.map((work) => (
                      <Link
                        key={work.id}
                        to={`/document/${work.id}`}
                        className="flex items-start justify-between gap-2 text-sm hover:text-primary transition-colors"
                      >
                        <span className="font-body text-foreground line-clamp-1">{work.title}</span>
                        <span className="font-body text-xs text-muted-foreground shrink-0">
                          {formatRelativeTime(work.updatedAt)}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="font-body text-sm text-muted-foreground">
                    No activity yet. Create a new work to get started.
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-border bg-background p-4">
                <p className="font-body text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Progress
                </p>
                <div className="space-y-2 text-sm font-body text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Last sign-in
                    </span>
                    <span>
                      {userProfile?.lastSignInAt
                        ? formatRelativeTime(new Date(userProfile.lastSignInAt))
                        : "Today"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> Drafts
                    </span>
                    <span>{documents.filter((item) => item.status === "Draft").length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5" /> Total words
                    </span>
                    <span>{totalWords.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
