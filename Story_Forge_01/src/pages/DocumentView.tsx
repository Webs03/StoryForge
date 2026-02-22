import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, FileText, Save, Theater, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import {
  countWords,
  useDocuments,
  type StoryDocument,
  type WorkStatus,
  type WorkType,
} from "@/hooks/use-documents";

type EditorForm = {
  title: string;
  description: string;
  content: string;
  type: WorkType;
  status: WorkStatus;
  genre: string;
  language: string;
  tagsInput: string;
  isPublic: boolean;
};

const toEditorForm = (doc: StoryDocument): EditorForm => ({
  title: doc.title,
  description: doc.description,
  content: doc.content,
  type: doc.type,
  status: doc.status,
  genre: doc.genre,
  language: doc.language,
  tagsInput: doc.tags.join(", "),
  isPublic: doc.isPublic,
});

const DocumentView = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const {
    createDocument,
    deleteDocument,
    getDocumentById,
    incrementReadCount,
    updateDocument,
  } = useDocuments();

  const [documentData, setDocumentData] = useState<StoryDocument | null>(null);
  const [form, setForm] = useState<EditorForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!id) {
        setError("Document id is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setSaveError(null);

      try {
        if (id === "new") {
          const newDocumentId = await createDocument({
            title: "Untitled Story",
            type: "story",
            status: "Draft",
            genre: "General",
            language: "English",
            isPublic: false,
          });
          if (active) {
            navigate(`/document/${newDocumentId}`, { replace: true });
          }
          return;
        }

        const loaded = await getDocumentById(id);
        if (!active) return;

        if (!loaded) {
          setError("This document could not be found.");
          setLoading(false);
          return;
        }

        const hasAccess = loaded.owner === user?.uid || loaded.isPublic;
        if (!hasAccess) {
          setError("You do not have access to this document.");
          setLoading(false);
          return;
        }

        if (loaded.owner !== user?.uid) {
          try {
            await incrementReadCount(loaded.id);
          } catch {
            // Ignore if rules block updates for readers.
          }
        }

        setDocumentData(loaded);
        setForm(toEditorForm(loaded));
        setLastSavedAt(loaded.updatedAt);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load this document.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate, user?.uid]);

  const canEdit = useMemo(
    () => Boolean(documentData && user && documentData.owner === user.uid),
    [documentData, user],
  );

  const wordCount = useMemo(() => countWords(form?.content || ""), [form?.content]);
  const readingMinutes = useMemo(() => Math.max(1, Math.ceil(wordCount / 230)), [wordCount]);

  const isDirty = useMemo(() => {
    if (!documentData || !form) return false;
    return JSON.stringify(toEditorForm(documentData)) !== JSON.stringify(form);
  }, [documentData, form]);

  const updateForm = <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const handleSave = async () => {
    if (!id || id === "new" || !form || !canEdit || !documentData) return;

    const tags = form.tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    try {
      setIsSaving(true);
      setSaveError(null);
      await updateDocument(id, {
        title: form.title,
        description: form.description,
        content: form.content,
        type: form.type,
        status: form.status,
        genre: form.genre,
        language: form.language,
        tags,
        isPublic: form.isPublic,
      });

      const savedAt = new Date();
      const nextDocument: StoryDocument = {
        ...documentData,
        title: form.title,
        description: form.description,
        content: form.content,
        type: form.type,
        status: form.status,
        genre: form.genre,
        language: form.language,
        tags,
        isPublic: form.isPublic,
        updatedAt: savedAt,
      };

      setDocumentData(nextDocument);
      setLastSavedAt(savedAt);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save document.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || id === "new" || !canEdit) return;
    const confirmed = window.confirm("Delete this work permanently?");
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await deleteDocument(id);
      navigate("/dashboard");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to delete document.");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Spinner />
          Loading document...
        </div>
      </div>
    );
  }

  if (error || !form || !documentData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="font-display text-3xl">Document unavailable</h1>
          <p className="text-muted-foreground">{error || "Unable to load this document."}</p>
          <Button asChild>
            <Link to="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isPlay = form.type === "playscript";

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-2">
              {isPlay ? (
                <Theater className="h-4 w-4 text-primary" />
              ) : (
                <FileText className="h-4 w-4 text-primary" />
              )}
              <span className="font-display font-semibold text-foreground">
                {form.title || "Untitled Story"}
              </span>
              {!canEdit && (
                <Badge variant="outline" className="ml-2">
                  Read Only
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-warm-light text-primary text-xs">
              {form.status}
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {lastSavedAt ? `Saved ${lastSavedAt.toLocaleTimeString()}` : "Unsaved"}
            </span>
            {canEdit && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !isDirty}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {saveError && (
          <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {saveError}
          </div>
        )}

        {!canEdit && (
          <div className="mb-5 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
            This story is public. You can read it, but only the owner can edit.
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          <main className="col-span-12 lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-lg border border-border p-6 md:p-8"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="doc-title">Title</Label>
                  <Input
                    id="doc-title"
                    className="mt-2 text-lg font-semibold"
                    value={form.title}
                    onChange={(event) => updateForm("title", event.target.value)}
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label htmlFor="doc-description">Synopsis</Label>
                  <Textarea
                    id="doc-description"
                    className="mt-2 min-h-[90px]"
                    value={form.description}
                    onChange={(event) => updateForm("description", event.target.value)}
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label htmlFor="doc-content">Chapter Content</Label>
                  <Textarea
                    id="doc-content"
                    className="mt-2 min-h-[60vh] font-body text-[17px] leading-8 resize-y"
                    value={form.content}
                    onChange={(event) => updateForm("content", event.target.value)}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </motion.div>
          </main>

          <aside className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-card rounded-lg border border-border p-4 space-y-4">
              <h2 className="font-display text-lg">Story Settings</h2>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => updateForm("type", value as WorkType)}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="playscript">Playscript</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => updateForm("status", value as WorkStatus)}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Editing">Editing</SelectItem>
                    <SelectItem value="Final">Final</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-genre">Genre</Label>
                <Input
                  id="doc-genre"
                  value={form.genre}
                  onChange={(event) => updateForm("genre", event.target.value)}
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-language">Language</Label>
                <Input
                  id="doc-language"
                  value={form.language}
                  onChange={(event) => updateForm("language", event.target.value)}
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-tags">Tags (comma separated)</Label>
                <Input
                  id="doc-tags"
                  value={form.tagsInput}
                  onChange={(event) => updateForm("tagsInput", event.target.value)}
                  disabled={!canEdit}
                />
              </div>

              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Public Story</p>
                  <p className="text-xs text-muted-foreground">Allow discovery on the home page</p>
                </div>
                <Switch
                  checked={form.isPublic}
                  onCheckedChange={(checked) => updateForm("isPublic", checked)}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 space-y-3">
              <h2 className="font-display text-lg">Engagement</h2>
              <div className="text-sm text-muted-foreground grid grid-cols-2 gap-3">
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {documentData.reads.toLocaleString()} reads
                </span>
                <span>{documentData.votes.toLocaleString()} votes</span>
                <span>{documentData.comments.toLocaleString()} comments</span>
                <span>{wordCount.toLocaleString()} words</span>
                <span>{readingMinutes} min read</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default DocumentView;
