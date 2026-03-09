import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  FileText,
  Loader2,
  Theater,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { parseReaderPayload, type ReaderLinkPayload } from "@/lib/reader-link";

type ReaderStatus = "idle" | "loading" | "ready" | "error";
type SourceProvider = "reddit" | "openlibrary" | "googlebooks" | "gutendex" | "unknown";

type RedditListingResponse = Array<{
  data?: {
    children?: Array<{
      data?: {
        selftext?: string;
      };
    }>;
  };
}>;

type OpenLibraryWorkResponse = {
  description?: string | { value?: string };
  first_sentence?: string | { value?: string };
};

type GoogleBooksVolumeResponse = {
  volumeInfo?: {
    description?: string;
  };
};

type GoogleBooksSearchResponse = {
  items?: GoogleBooksVolumeResponse[];
};

type GutendexResponse = {
  results?: Array<{
    title?: string;
    authors?: Array<{ name?: string }>;
    subjects?: string[];
    summaries?: string[];
  }>;
};

const FALLBACK_IMAGE = "/covers/fallback-cover.svg";

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const stripHtml = (value: string) =>
  decodeHtmlEntities(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const toParagraphs = (text: string) => {
  const clean = stripHtml(text);
  if (!clean) return [];
  return clean
    .split(/\n{2,}|(?<=[.?!])\s{2,}/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .slice(0, 12);
};

const buildExternalApiUrl = (
  provider: Exclude<SourceProvider, "unknown">,
  pathAndQuery: string
) => {
  const normalizedPath = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  if (import.meta.env.DEV) {
    return `/api/${provider}${normalizedPath}`;
  }

  switch (provider) {
    case "reddit":
      return `https://www.reddit.com${normalizedPath}`;
    case "openlibrary":
      return `https://openlibrary.org${normalizedPath}`;
    case "googlebooks":
      return `https://www.googleapis.com${normalizedPath}`;
    case "gutendex":
      return `https://gutendex.com${normalizedPath}`;
  }
};

const fetchJsonWithTimeout = async <T,>(url: string, timeoutMs = 7000): Promise<T | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

const inferProvider = (payload: ReaderLinkPayload): SourceProvider => {
  const href = payload.href?.toLowerCase() ?? "";
  const source = payload.source?.toLowerCase() ?? "";
  if (href.includes("reddit.com") || source.includes("reddit")) return "reddit";
  if (href.includes("openlibrary.org") || source.includes("open library")) return "openlibrary";
  if (href.includes("google") || source.includes("google books")) return "googlebooks";
  if (
    href.includes("gutendex") ||
    href.includes("gutenberg.org") ||
    source.includes("gutendex")
  ) {
    return "gutendex";
  }
  return "unknown";
};

const extractOpenLibraryKey = (href?: string) => {
  if (!href) return null;
  try {
    const url = new URL(href);
    const path = url.pathname.replace(/\/$/, "");
    if (/^\/works\/OL[0-9A-Z]+W$/i.test(path)) return `${path}.json`;
    if (/^\/books\/OL[0-9A-Z]+M$/i.test(path)) return `${path}.json`;
  } catch {
    return null;
  }
  return null;
};

const extractGoogleVolumeId = (href?: string) => {
  if (!href) return null;
  try {
    const url = new URL(href);
    const id = url.searchParams.get("id");
    if (id && id.trim().length > 0) return id.trim();
  } catch {
    return null;
  }
  return null;
};

const extractRedditPath = (href?: string) => {
  if (!href) return null;
  try {
    const url = new URL(href);
    const path = url.pathname.replace(/\/$/, "");
    if (path.startsWith("/r/")) return `${path}.json?raw_json=1`;
  } catch {
    return null;
  }
  return null;
};

const extractGutendexId = (href?: string) => {
  if (!href) return null;
  const match = href.match(/\/ebooks\/(\d+)/i);
  if (!match) return null;
  return match[1];
};

const buildFallbackBody = (payload: ReaderLinkPayload) => {
  const parts = [
    payload.description,
    payload.category ? `Category: ${payload.category}.` : "",
    payload.reads ? `Live momentum: ${payload.reads}.` : "",
    "This item is being rendered inside StoryForge so readers can stay in-app while exploring recommendations.",
  ].filter(Boolean);
  return parts.join("\n\n");
};

const fetchInAppContent = async (payload: ReaderLinkPayload): Promise<string | null> => {
  const provider = inferProvider(payload);

  if (provider === "reddit") {
    const redditPath = extractRedditPath(payload.href);
    if (!redditPath) return null;
    const payloadData = await fetchJsonWithTimeout<RedditListingResponse>(
      buildExternalApiUrl("reddit", redditPath),
      7000
    );
    const raw = payloadData?.[0]?.data?.children?.[0]?.data?.selftext ?? "";
    return stripHtml(raw);
  }

  if (provider === "openlibrary") {
    const key = extractOpenLibraryKey(payload.href);
    if (!key) return null;
    const payloadData = await fetchJsonWithTimeout<OpenLibraryWorkResponse>(
      buildExternalApiUrl("openlibrary", key),
      7000
    );
    const description =
      typeof payloadData?.description === "string"
        ? payloadData.description
        : payloadData?.description?.value ?? "";
    const firstSentence =
      typeof payloadData?.first_sentence === "string"
        ? payloadData.first_sentence
        : payloadData?.first_sentence?.value ?? "";
    return stripHtml(`${description}\n\n${firstSentence}`.trim());
  }

  if (provider === "googlebooks") {
    const volumeId = extractGoogleVolumeId(payload.href);
    if (volumeId) {
      const payloadData = await fetchJsonWithTimeout<GoogleBooksVolumeResponse>(
        buildExternalApiUrl("googlebooks", `/books/v1/volumes/${encodeURIComponent(volumeId)}`),
        7000
      );
      if (payloadData?.volumeInfo?.description) {
        return stripHtml(payloadData.volumeInfo.description);
      }
    }

    if (payload.title) {
      const payloadData = await fetchJsonWithTimeout<GoogleBooksSearchResponse>(
        buildExternalApiUrl(
          "googlebooks",
          `/books/v1/volumes?q=intitle:${encodeURIComponent(payload.title)}&maxResults=1`
        ),
        7000
      );
      const description = payloadData?.items?.[0]?.volumeInfo?.description ?? "";
      return stripHtml(description);
    }
  }

  if (provider === "gutendex") {
    const gutendexId = extractGutendexId(payload.href);
    if (!gutendexId) return null;
    const payloadData = await fetchJsonWithTimeout<GutendexResponse>(
      buildExternalApiUrl("gutendex", `/books?ids=${encodeURIComponent(gutendexId)}`),
      7000
    );
    const entry = payloadData?.results?.[0];
    if (!entry) return null;
    const summary = entry.summaries?.[0] ?? "";
    const author = entry.authors?.[0]?.name ?? "Unknown Author";
    const subjects = (entry.subjects ?? []).slice(0, 5).join(", ");
    return stripHtml(
      [summary, `Author: ${author}.`, subjects ? `Subjects: ${subjects}.` : ""]
        .filter(Boolean)
        .join("\n\n")
    );
  }

  return null;
};

const ReaderPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const payload = useMemo(() => parseReaderPayload(searchParams), [searchParams]);
  const [status, setStatus] = useState<ReaderStatus>("idle");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!payload.title) {
        setStatus("error");
        setError("Invalid reader link. Try opening a recommendation again.");
        return;
      }

      setStatus("loading");
      setError(null);
      const fallback = buildFallbackBody(payload);
      try {
        const liveContent = await fetchInAppContent(payload);
        if (cancelled) return;
        setContent((liveContent && liveContent.length > 0 ? liveContent : fallback).trim());
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setContent(fallback);
        setStatus("error");
        setError("Could not fetch live source text. Showing in-app summary instead.");
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [payload]);

  const paragraphs = useMemo(() => toParagraphs(content), [content]);
  const isPlayscript = payload.format === "Playscript";

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="container mx-auto h-16 px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">StoryForge</span>
          </Link>
          <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 md:py-10">
        {!payload.title ? (
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="font-body text-sm text-muted-foreground">
              No story data was found for this reader route.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8"
          >
            <aside className="space-y-4">
              <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
                <img
                  src={payload.imageSrc || FALLBACK_IMAGE}
                  alt={payload.title}
                  className="w-full aspect-[3/4] object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  {isPlayscript ? (
                    <Theater className="h-4 w-4 text-primary" />
                  ) : (
                    <FileText className="h-4 w-4 text-primary" />
                  )}
                  <Badge variant="secondary">{payload.format}</Badge>
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                  {payload.title}
                </h1>
                {payload.category && (
                  <p className="font-body text-sm text-muted-foreground mb-1">{payload.category}</p>
                )}
                {payload.source && (
                  <p className="font-body text-xs text-muted-foreground">Source: {payload.source}</p>
                )}
                {payload.reads && (
                  <p className="font-body text-xs text-muted-foreground">Momentum: {payload.reads}</p>
                )}
                {payload.href && (
                  <Button variant="outline" className="mt-4 w-full" asChild>
                    <a href={payload.href} target="_blank" rel="noreferrer">
                      Open Original Source
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                )}
              </div>
            </aside>

            <main className="rounded-2xl border border-border bg-card p-6 md:p-8">
              {status === "loading" && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-body mb-5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading in-app reading view...
                </div>
              )}

              {error && (
                <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-3 py-2 text-sm font-body">
                  {error}
                </p>
              )}

              <article className="prose prose-stone max-w-none">
                {paragraphs.length > 0 ? (
                  paragraphs.map((paragraph, index) => (
                    <p
                      key={`${payload.title}-paragraph-${index}`}
                      className="font-body text-foreground/90 leading-8 text-base md:text-lg mb-6"
                    >
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="font-body text-muted-foreground">
                    No readable content is available for this recommendation yet.
                  </p>
                )}
              </article>
            </main>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ReaderPage;
