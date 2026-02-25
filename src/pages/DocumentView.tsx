import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  Download,
  Share2,
  Clock,
  FileText,
  Theater,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  List,
  Heading1,
  Heading2,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDocuments } from "@/hooks/use-documents";

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

const DocumentView = () => {
  const { id } = useParams();
  const { documents, loading, error, updateDocument } = useDocuments();
  const [titleDraft, setTitleDraft] = useState("");
  const [contentDraft, setContentDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const document = useMemo(
    () => documents.find((item) => item.id === id) ?? null,
    [documents, id]
  );

  useEffect(() => {
    if (!document) return;
    setTitleDraft(document.title);
    setContentDraft(document.content);
  }, [document]);

  const hasUnsavedChanges =
    !!document &&
    (titleDraft !== document.title || contentDraft !== document.content);

  const wordCount = contentDraft.trim()
    ? contentDraft.trim().split(/\s+/).length
    : 0;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 250));
  const isPlayscript = document?.type === "playscript";

  const handleSave = async () => {
    if (!document || !hasUnsavedChanges) return;

    try {
      setSaveError(null);
      setIsSaving(true);
      await updateDocument(document.id, titleDraft.trim() || "Untitled", contentDraft);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground font-body">
          <Spinner />
          <span>Loading document...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-display text-2xl text-foreground mb-2">Could not load document</p>
          <p className="font-body text-sm text-muted-foreground mb-6">{error}</p>
          <Button asChild>
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-display text-2xl text-foreground mb-2">Document not found</p>
          <p className="font-body text-sm text-muted-foreground mb-6">
            This document may not exist or may not belong to your account.
          </p>
          <Button asChild>
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-2">
              {isPlayscript ? <Theater className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
              <span className="font-display font-semibold text-foreground line-clamp-1">{document.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-warm-light text-primary text-xs">{document.status}</Badge>
            <span className="text-xs text-muted-foreground font-body hidden sm:inline">
              Saved {formatRelativeTime(document.updatedAt)}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSave} disabled={!hasUnsavedChanges || isSaving}>
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm"><Share2 className="h-4 w-4" /></Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Document Meta */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-center gap-4 text-sm font-body text-muted-foreground mb-6">
            <span>{document.genre}</span>
            <span>·</span>
            <span>{wordCount.toLocaleString()} words</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Updated {formatRelativeTime(document.updatedAt)}
            </span>
          </div>
          {saveError && (
            <p className="font-body text-sm text-destructive">{saveError}</p>
          )}
          {!saveError && hasUnsavedChanges && (
            <p className="font-body text-sm text-muted-foreground">You have unsaved changes.</p>
          )}
        </motion.div>

        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 p-2 bg-card rounded-lg border border-border mb-6 overflow-x-auto">
          {[Bold, Italic, Minus, Heading1, Heading2, AlignLeft, AlignCenter, List].map((Icon, i) => (
            <Button key={i} variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
              <Icon className="h-4 w-4" />
            </Button>
          ))}
          <Separator orientation="vertical" className="h-5 mx-1" />
          <Button variant="ghost" size="sm" className="text-xs font-body shrink-0">
            Focus Mode
          </Button>
        </div>

        {/* Editor Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-lg border border-border p-8 md:p-12 min-h-[60vh] shadow-sm"
        >
          <Input
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            className="font-display text-2xl md:text-3xl font-bold border-0 shadow-none px-0 h-auto mb-6 focus-visible:ring-0"
            placeholder="Untitled"
          />
          <Textarea
            value={contentDraft}
            onChange={(event) => setContentDraft(event.target.value)}
            placeholder="Start writing your story..."
            className="font-body text-foreground/90 leading-[1.9] text-base md:text-lg min-h-[52vh] border-0 shadow-none resize-none px-0 focus-visible:ring-0"
          />
        </motion.div>

        {/* Bottom Stats */}
        <div className="flex items-center justify-between mt-6 text-xs font-body text-muted-foreground">
          <span>Section 1 of 1</span>
          <span>{wordCount.toLocaleString()} words · {readMinutes} min read</span>
        </div>
      </div>
    </div>
  );
};

export default DocumentView;
