import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { useDocuments, type DocumentType } from "@/hooks/use-documents";
import { downloadDocument, type DocumentExportFormat } from "@/lib/document-export";

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

const getLineBounds = (value: string, start: number, end: number) => {
  const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const lineEndIndex = value.indexOf("\n", end);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
  return { lineStart, lineEnd };
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const DocumentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNewDocument = id === "new";
  const requestedType = searchParams.get("type");
  const draftType: DocumentType = requestedType === "playscript" ? "playscript" : "story";
  const defaultTitle = draftType === "playscript" ? "Untitled Playscript" : "Untitled Story";

  const {
    documents,
    loading,
    error,
    createDocument,
    getDocumentById,
    updateDocument,
  } = useDocuments({
    skipInitialFetch: true,
  });
  const [titleDraft, setTitleDraft] = useState("");
  const [contentDraft, setContentDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isResolvingDocument, setIsResolvingDocument] = useState(false);
  const [documentLoadError, setDocumentLoadError] = useState<string | null>(null);
  const [resolveAttemptedForId, setResolveAttemptedForId] = useState<string | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null);

  const document = useMemo(
    () => documents.find((item) => item.id === id) ?? null,
    [documents, id]
  );

  useEffect(() => {
    if (!document) return;
    setTitleDraft(document.title);
    setContentDraft(document.content);
  }, [document]);

  useEffect(() => {
    if (!isNewDocument) return;
    setTitleDraft((previous) => (previous.trim().length > 0 ? previous : defaultTitle));
  }, [isNewDocument, defaultTitle]);

  useEffect(() => {
    if (isNewDocument || !id || document || resolveAttemptedForId === id) return;

    let cancelled = false;

    const resolveDocument = async () => {
      try {
        setDocumentLoadError(null);
        setResolveAttemptedForId(id);
        setIsResolvingDocument(true);
        await getDocumentById(id);
      } catch (err) {
        if (cancelled) return;
        setDocumentLoadError(err instanceof Error ? err.message : "Failed to load document");
      } finally {
        if (!cancelled) {
          setIsResolvingDocument(false);
        }
      }
    };

    void resolveDocument();

    return () => {
      cancelled = true;
    };
  }, [id, isNewDocument, document, getDocumentById, resolveAttemptedForId]);

  useEffect(() => {
    setResolveAttemptedForId(null);
    setDocumentLoadError(null);
  }, [id, isNewDocument]);

  const hasUnsavedChanges = isNewDocument
    ? titleDraft.trim().length > 0 || contentDraft.trim().length > 0
    : !!document && (titleDraft !== document.title || contentDraft !== document.content);

  const wordCount = contentDraft.trim()
    ? contentDraft.trim().split(/\s+/).length
    : 0;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 250));
  const isPlayscript = isNewDocument
    ? draftType === "playscript"
    : document?.type === "playscript";

  const applyContentTransform = (
    transform: (
      value: string,
      selectionStart: number,
      selectionEnd: number
    ) => { value: string; selectionStart: number; selectionEnd: number }
  ) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;
    const selectionStart = textarea.selectionStart ?? 0;
    const selectionEnd = textarea.selectionEnd ?? 0;

    setContentDraft((previous) => {
      const result = transform(previous, selectionStart, selectionEnd);
      pendingSelectionRef.current = {
        start: result.selectionStart,
        end: result.selectionEnd,
      };
      return result.value;
    });

    requestAnimationFrame(() => {
      const target = contentTextareaRef.current;
      const nextSelection = pendingSelectionRef.current;
      if (!target || !nextSelection) return;
      target.focus();
      target.setSelectionRange(nextSelection.start, nextSelection.end);
      pendingSelectionRef.current = null;
    });
  };

  const wrapSelection = (prefix: string, suffix: string, placeholder: string) => {
    applyContentTransform((value, selectionStart, selectionEnd) => {
      const selected = value.slice(selectionStart, selectionEnd);
      const insertion = selected || placeholder;
      const nextValue =
        value.slice(0, selectionStart) +
        `${prefix}${insertion}${suffix}` +
        value.slice(selectionEnd);
      const nextStart = selectionStart + prefix.length;
      const nextEnd = nextStart + insertion.length;

      return {
        value: nextValue,
        selectionStart: nextStart,
        selectionEnd: nextEnd,
      };
    });
  };

  const toggleLinePrefix = (prefix: string) => {
    applyContentTransform((value, selectionStart, selectionEnd) => {
      const { lineStart, lineEnd } = getLineBounds(value, selectionStart, selectionEnd);
      const selectedBlock = value.slice(lineStart, lineEnd);
      const lines = selectedBlock.split("\n");
      const prefixRegex = new RegExp(`^${escapeRegExp(prefix)}`);
      const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
      const removePrefix =
        nonEmptyLines.length > 0 && nonEmptyLines.every((line) => prefixRegex.test(line));

      const updatedLines = lines.map((line) => {
        if (line.trim().length === 0) return line;
        return removePrefix ? line.replace(prefixRegex, "") : `${prefix}${line}`;
      });

      const updatedBlock = updatedLines.join("\n");
      const nextValue = value.slice(0, lineStart) + updatedBlock + value.slice(lineEnd);

      return {
        value: nextValue,
        selectionStart: lineStart,
        selectionEnd: lineStart + updatedBlock.length,
      };
    });
  };

  const wrapBlockWithCenter = () => {
    const startTag = "<div align=\"center\">\n";
    const endTag = "\n</div>";
    applyContentTransform((value, selectionStart, selectionEnd) => {
      const selected = value.slice(selectionStart, selectionEnd);
      const insertion = selected || "Centered text";
      const nextValue =
        value.slice(0, selectionStart) +
        `${startTag}${insertion}${endTag}` +
        value.slice(selectionEnd);
      const nextStart = selectionStart + startTag.length;
      const nextEnd = nextStart + insertion.length;

      return {
        value: nextValue,
        selectionStart: nextStart,
        selectionEnd: nextEnd,
      };
    });
  };

  const removeCenterWrapper = () => {
    applyContentTransform((value, selectionStart, selectionEnd) => {
      const { lineStart, lineEnd } = getLineBounds(value, selectionStart, selectionEnd);
      const selectedBlock = value.slice(lineStart, lineEnd);
      const updatedBlock = selectedBlock
        .replace(/^\s*<div align="center">\s*\n?/i, "")
        .replace(/\n?\s*<\/div>\s*$/i, "")
        .replace(/<div align="center">/gi, "")
        .replace(/<\/div>/gi, "");
      const nextValue = value.slice(0, lineStart) + updatedBlock + value.slice(lineEnd);

      return {
        value: nextValue,
        selectionStart: lineStart,
        selectionEnd: lineStart + updatedBlock.length,
      };
    });
  };

  const insertHorizontalRule = () => {
    applyContentTransform((value, selectionStart, selectionEnd) => {
      const insertion = "\n\n---\n\n";
      const nextValue = value.slice(0, selectionStart) + insertion + value.slice(selectionEnd);
      const cursor = selectionStart + insertion.length;

      return {
        value: nextValue,
        selectionStart: cursor,
        selectionEnd: cursor,
      };
    });
  };

  const handleDownload = (format: DocumentExportFormat) => {
    downloadDocument(titleDraft.trim() || defaultTitle, contentDraft || "", format);
    toast(`Download started (.${format}).`);
  };

  const handleShare = async () => {
    const title = titleDraft.trim() || defaultTitle;
    const excerpt = contentDraft.trim().slice(0, 280);
    const shareUrl =
      isNewDocument || !document
        ? window.location.href
        : `${window.location.origin}/document/${document.id}`;

    const sharePayload = {
      title,
      text: excerpt ? `${excerpt}${contentDraft.trim().length > 280 ? "..." : ""}` : title,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
        toast("Shared successfully.");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(
          `${title}\n${shareUrl}${excerpt ? `\n\n${sharePayload.text}` : ""}`
        );
        toast("Share details copied to clipboard.");
        return;
      }

      toast("Sharing is not supported in this browser.");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast("Failed to share document.");
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (!isNewDocument && (!document || !hasUnsavedChanges)) return;

    try {
      setSaveError(null);
      setIsSaving(true);
      if (isNewDocument) {
        const docId = await createDocument(titleDraft.trim() || defaultTitle, contentDraft, {
          type: draftType,
          status: "Draft",
        });
        toast("Draft saved.");
        navigate(`/document/${docId}`, { replace: true });
        return;
      }

      await updateDocument(document.id, titleDraft.trim() || "Untitled", contentDraft);
      toast("Changes saved.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save document";
      setSaveError(message);
      toast(message);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      void handleSave();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const formattingActions = [
    { label: "Bold", icon: Bold, onClick: () => wrapSelection("**", "**", "bold text") },
    { label: "Italic", icon: Italic, onClick: () => wrapSelection("*", "*", "italic text") },
    { label: "Horizontal Rule", icon: Minus, onClick: insertHorizontalRule },
    { label: "Heading 1", icon: Heading1, onClick: () => toggleLinePrefix("# ") },
    { label: "Heading 2", icon: Heading2, onClick: () => toggleLinePrefix("## ") },
    { label: "Align Left", icon: AlignLeft, onClick: removeCenterWrapper },
    { label: "Align Center", icon: AlignCenter, onClick: wrapBlockWithCenter },
    { label: "Bullet List", icon: List, onClick: () => toggleLinePrefix("- ") },
  ];

  if (!isNewDocument && ((loading && !document) || isResolvingDocument)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground font-body">
          <Spinner />
          <span>{isResolvingDocument ? "Opening document..." : "Loading document..."}</span>
        </div>
      </div>
    );
  }

  if (!isNewDocument && (error || documentLoadError) && !document) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-display text-2xl text-foreground mb-2">Could not load document</p>
          <p className="font-body text-sm text-muted-foreground mb-6">{error || documentLoadError}</p>
          <Button asChild>
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!isNewDocument && !document) {
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
              <span className="font-display font-semibold text-foreground line-clamp-1">
                {titleDraft.trim() || defaultTitle}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-warm-light text-primary text-xs">
              {document?.status ?? "Draft"}
            </Badge>
            <span className="text-xs text-muted-foreground font-body hidden sm:inline">
              {isNewDocument ? "Not saved yet" : `Saved ${formatRelativeTime(document!.updatedAt)}`}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSave} disabled={!hasUnsavedChanges || isSaving}>
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Download document">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDownload("docx")}>
                  DOCX (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload("odt")}>
                  ODT (.odt)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload("rtf")}>
                  RTF (.rtf)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload("html")}>
                  HTML (.html)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload("txt")}>
                  TXT (.txt)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" onClick={() => void handleShare()} aria-label="Share document">
              <Share2 className="h-4 w-4" />
            </Button>
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
            <span>{document?.genre ?? "Uncategorized"}</span>
            <span>·</span>
            <span>{wordCount.toLocaleString()} words</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />{" "}
              {isNewDocument ? "Draft not saved yet" : `Updated ${formatRelativeTime(document!.updatedAt)}`}
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
          {formattingActions.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={action.onClick}
              aria-label={action.label}
              title={action.label}
            >
              <action.icon className="h-4 w-4" />
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
            ref={contentTextareaRef}
            value={contentDraft}
            onChange={(event) => setContentDraft(event.target.value)}
            placeholder={isPlayscript ? "Start writing your playscript..." : "Start writing your story..."}
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
