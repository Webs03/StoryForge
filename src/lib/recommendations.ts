export type RecommendationFormat = "Story" | "Playscript";

export interface TrendingRecommendation {
  title: string;
  category: string;
  format: RecommendationFormat;
  reads: string;
  imageSrc: string;
  href?: string;
  score?: number;
  source?: string;
}

export interface TopicRecommendation {
  title: string;
  format: RecommendationFormat;
  description: string;
  imageSrc: string;
  href?: string;
  score?: number;
  source?: string;
}

export interface RecommendationFetchResult<T> {
  items: T[];
  source: "live" | "cache" | "fallback";
  updatedAt: string | null;
}

const TRENDING_CACHE_KEY = "sf:recommendations:trending:v1";
const TRENDING_TTL_MS = 15 * 60 * 1000;
const TOPICS_TTL_MS = 6 * 60 * 60 * 1000;
const FALLBACK_IMAGE = "/covers/fallback-cover.svg";

const DEFAULT_TOPICS = [
  "fantasy_fiction",
  "science_fiction",
  "mystery_and_detective_stories",
  "romance",
  "drama",
] as const;

const SUBJECT_FROM_TOKEN: Record<string, string> = {
  fantasy: "fantasy_fiction",
  magic: "fantasy_fiction",
  romance: "romance",
  romantic: "romance",
  love: "romance",
  mystery: "mystery_and_detective_stories",
  detective: "mystery_and_detective_stories",
  thriller: "thrillers",
  suspense: "thrillers",
  horror: "horror",
  ghost: "ghost_stories",
  science: "science_fiction",
  scifi: "science_fiction",
  sci: "science_fiction",
  fiction: "fiction",
  drama: "drama",
  theater: "drama",
  theatre: "drama",
  screenplay: "drama",
  play: "drama",
  crime: "crime",
  historical: "historical_fiction",
  history: "historical_fiction",
  adventure: "adventure_stories",
  poetry: "poetry",
  young: "young_adult_fiction",
  adult: "young_adult_fiction",
};

const STOP_WORDS = new Set([
  "and",
  "the",
  "for",
  "with",
  "this",
  "that",
  "from",
  "into",
  "your",
  "story",
  "draft",
  "novel",
  "book",
  "chapter",
  "script",
  "scene",
  "untitled",
  "work",
  "a",
  "an",
  "to",
  "of",
  "in",
  "on",
  "at",
  "by",
  "is",
  "it",
]);

type CacheEnvelope<T> = {
  updatedAt: string;
  expiresAt: number;
  payload: T;
};

type RedditListingResponse = {
  data?: {
    children?: Array<{
      data?: Record<string, unknown>;
    }>;
  };
};

type OpenLibrarySubjectsResponse = {
  works?: Array<{
    key?: string;
    title?: string;
    authors?: Array<{ name?: string }>;
    cover_id?: number;
    edition_count?: number;
    subject?: string[];
  }>;
};

type GoogleBooksResponse = {
  items?: Array<{
    id?: string;
    volumeInfo?: {
      title?: string;
      description?: string;
      authors?: string[];
      categories?: string[];
      imageLinks?: {
        thumbnail?: string;
        smallThumbnail?: string;
      };
      infoLink?: string;
      ratingsCount?: number;
      averageRating?: number;
    };
  }>;
};

type GutendexResponse = {
  results?: Array<{
    id?: number;
    title?: string;
    subjects?: string[];
    authors?: Array<{ name?: string }>;
    formats?: Record<string, string>;
    download_count?: number;
  }>;
};

const isBrowser = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const readCache = <T>(key: string, options?: { allowExpired?: boolean }): CacheEnvelope<T> | null => {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CacheEnvelope<T>>;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.expiresAt !== "number" ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }
    if (!options?.allowExpired && parsed.expiresAt < Date.now()) return null;
    return parsed as CacheEnvelope<T>;
  } catch {
    return null;
  }
};

const writeCache = <T>(key: string, payload: T, ttlMs: number) => {
  if (!isBrowser()) return;
  const envelope: CacheEnvelope<T> = {
    payload,
    updatedAt: new Date().toISOString(),
    expiresAt: Date.now() + ttlMs,
  };
  try {
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // no-op: cache storage should not break recommendation rendering
  }
};

type ExternalApiProvider = "reddit" | "openlibrary" | "googlebooks" | "gutendex";

const buildExternalApiUrl = (provider: ExternalApiProvider, pathAndQuery: string) => {
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

const fetchJsonWithTimeout = async <T>(url: string, timeoutMs = 5000): Promise<T | null> => {
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

const normalizeTitle = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

const decodeHtml = (value: string) => value.replace(/&amp;/g, "&");

const inferFormat = (input: string): RecommendationFormat => {
  const lower = input.toLowerCase();
  if (
    /(play|playscript|screenplay|screenwriting|drama|theatre|theater|stage|shakespeare)/.test(
      lower
    )
  ) {
    return "Playscript";
  }
  return "Story";
};

const subjectToLabel = (subject: string) =>
  subject
    .replace(/_/g, " ")
    .replace(/\band\b/g, "&")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const tokenize = (input: string) =>
  input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

const inferSubjects = (genres: string[], recentTitles: string[]) => {
  const frequency = new Map<string, number>();
  for (const source of [...genres, ...recentTitles]) {
    for (const token of tokenize(source)) {
      const subject = SUBJECT_FROM_TOKEN[token];
      if (!subject) continue;
      frequency.set(subject, (frequency.get(subject) ?? 0) + 1);
    }
  }

  const ranked = [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([subject]) => subject);

  if (ranked.length === 0) return [...DEFAULT_TOPICS];
  return [...new Set([...ranked, ...DEFAULT_TOPICS])].slice(0, 5);
};

const TRENDING_SUPPLEMENTAL_SUBJECTS = [
  "fiction",
  "drama",
  "mystery_and_detective_stories",
] as const;

const fetchOpenLibraryTrendingItems = async (subject: string) => {
  const payload = await fetchJsonWithTimeout<OpenLibrarySubjectsResponse>(
    buildExternalApiUrl("openlibrary", `/subjects/${subject}.json?limit=12`),
    6500
  );
  const works = payload?.works ?? [];
  const label = subjectToLabel(subject);

  return works.map((work) => {
    const title = typeof work.title === "string" ? work.title.trim() : "";
    if (!title) return null;

    const author = work.authors?.[0]?.name ?? "Unknown Author";
    const editionCount = typeof work.edition_count === "number" ? work.edition_count : 0;
    const hint = `${title} ${author} ${(work.subject ?? []).join(" ")} ${subject}`;

    return {
      title,
      category: label,
      format: inferFormat(hint),
      reads: editionCount > 0 ? `${editionCount.toLocaleString()} editions` : "Recommended",
      imageSrc:
        typeof work.cover_id === "number"
          ? `https://covers.openlibrary.org/b/id/${work.cover_id}-L.jpg`
          : FALLBACK_IMAGE,
      href: typeof work.key === "string" ? `https://openlibrary.org${work.key}` : undefined,
      score: 20 + editionCount * 1.3,
      source: "Open Library",
    } satisfies TrendingRecommendation;
  });
};

const fetchGoogleBooksTrendingItems = async (subject: string) => {
  const payload = await fetchJsonWithTimeout<GoogleBooksResponse>(
    buildExternalApiUrl("googlebooks", `/books/v1/volumes?q=subject:${encodeURIComponent(
      subject.replace(/_/g, " ")
    )}&maxResults=10&printType=books&orderBy=relevance`),
    7000
  );
  const items = payload?.items ?? [];
  const label = subjectToLabel(subject);

  return items.map((entry) => {
    const volumeInfo = entry.volumeInfo;
    const title = volumeInfo?.title?.trim() ?? "";
    if (!title) return null;

    const author = volumeInfo?.authors?.[0] ?? "Unknown Author";
    const categories = volumeInfo?.categories?.join(" ") ?? "";
    const ratingsCount = typeof volumeInfo?.ratingsCount === "number" ? volumeInfo.ratingsCount : 0;
    const averageRating =
      typeof volumeInfo?.averageRating === "number" ? volumeInfo.averageRating : 0;

    return {
      title,
      category: volumeInfo?.categories?.[0] ?? label,
      format: inferFormat(`${title} ${categories}`),
      reads: ratingsCount > 0 ? `${ratingsCount.toLocaleString()} ratings` : "Recommended",
      imageSrc:
        volumeInfo?.imageLinks?.thumbnail?.replace("http://", "https://") ??
        volumeInfo?.imageLinks?.smallThumbnail?.replace("http://", "https://") ??
        FALLBACK_IMAGE,
      href: volumeInfo?.infoLink,
      score: 14 + ratingsCount * 0.2 + averageRating * 7,
      source: "Google Books",
    } satisfies TrendingRecommendation;
  });
};

const fetchGutendexTrendingItems = async (subject: string) => {
  const payload = await fetchJsonWithTimeout<GutendexResponse>(
    buildExternalApiUrl("gutendex", `/books?search=${encodeURIComponent(
      subject.replace(/_/g, " ")
    )}&languages=en`),
    7000
  );
  const items = payload?.results ?? [];
  const label = subjectToLabel(subject);

  return items.slice(0, 10).map((entry) => {
    const title = typeof entry.title === "string" ? entry.title.trim() : "";
    if (!title) return null;

    const author = entry.authors?.[0]?.name ?? "Unknown Author";
    const downloads = typeof entry.download_count === "number" ? entry.download_count : 0;
    const hint = `${title} ${author} ${(entry.subjects ?? []).join(" ")} ${subject}`;

    return {
      title,
      category: label,
      format: inferFormat(hint),
      reads: downloads > 0 ? `${downloads.toLocaleString()} downloads` : "Trending",
      imageSrc:
        typeof entry.formats?.["image/jpeg"] === "string"
          ? entry.formats["image/jpeg"]
          : FALLBACK_IMAGE,
      href:
        typeof entry.id === "number" ? `https://www.gutenberg.org/ebooks/${entry.id}` : undefined,
      score: 12 + downloads * 0.03,
      source: "Gutendex",
    } satisfies TrendingRecommendation;
  });
};

export const getTrendingRecommendations = async (
  options?: { limit?: number }
): Promise<RecommendationFetchResult<TrendingRecommendation>> => {
  const limit = options?.limit ?? 8;
  const freshCache = readCache<TrendingRecommendation[]>(TRENDING_CACHE_KEY);
  if (freshCache && freshCache.payload.length > 0) {
    return {
      items: freshCache.payload.slice(0, limit),
      source: "cache",
      updatedAt: freshCache.updatedAt,
    };
  }

  const sources: Array<{ path: string; format: RecommendationFormat }> = [
    { path: "/r/WritingPrompts/top.json?t=day&limit=12", format: "Story" },
    { path: "/r/shortstories/top.json?t=day&limit=12", format: "Story" },
    { path: "/r/Screenwriting/top.json?t=day&limit=12", format: "Playscript" },
  ];

  const responses = await Promise.all(
    sources.map(async (source) => {
      const payload = await fetchJsonWithTimeout<RedditListingResponse>(
        buildExternalApiUrl("reddit", source.path),
        6000
      );
      const children = payload?.data?.children ?? [];
      return children.map((entry) => ({ source, post: entry.data ?? {} }));
    })
  );

  const allItems = responses.flat();
  const seenTitles = new Set<string>();

  const mapped = allItems
    .map(({ source, post }, index): TrendingRecommendation | null => {
      const title = typeof post.title === "string" ? post.title.trim() : "";
      const permalink = typeof post.permalink === "string" ? post.permalink : "";
      const subreddit = typeof post.subreddit === "string" ? post.subreddit : "writing";
      const ups = typeof post.ups === "number" ? post.ups : 0;
      const comments = typeof post.num_comments === "number" ? post.num_comments : 0;
      const isPinned = Boolean(post.stickied);

      if (!title || !permalink || isPinned || title.toLowerCase().includes("[removed]")) return null;

      const normalized = normalizeTitle(title);
      if (seenTitles.has(normalized)) return null;
      seenTitles.add(normalized);

      const directThumb =
        typeof post.thumbnail === "string" && /^https?:\/\//.test(post.thumbnail)
          ? post.thumbnail
          : "";
      const preview =
        typeof post.preview === "object" && post.preview !== null
          ? (post.preview as { images?: Array<{ source?: { url?: string } }> }).images?.[0]?.source
              ?.url ?? ""
          : "";
      const thumbnail = decodeHtml(directThumb || preview || FALLBACK_IMAGE);
      const score = ups + comments * 0.6 + Math.max(0, 50 - index);

      return {
        title,
        category: `r/${subreddit}`,
        format: source.format,
        reads: `${ups.toLocaleString()} upvotes`,
        imageSrc: thumbnail,
        href: `https://www.reddit.com${permalink}`,
        score,
        source: "Reddit",
      };
    })
    .filter((item): item is TrendingRecommendation => item !== null)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit);

  const combinedByTitle = new Map<string, TrendingRecommendation>();
  for (const item of mapped) {
    combinedByTitle.set(normalizeTitle(item.title), item);
  }

  if (combinedByTitle.size < limit) {
    const [openLibrarySets, googleBooksSets, gutendexSets] = await Promise.all([
      Promise.all(TRENDING_SUPPLEMENTAL_SUBJECTS.map((subject) => fetchOpenLibraryTrendingItems(subject))),
      Promise.all(TRENDING_SUPPLEMENTAL_SUBJECTS.map((subject) => fetchGoogleBooksTrendingItems(subject))),
      Promise.all(TRENDING_SUPPLEMENTAL_SUBJECTS.map((subject) => fetchGutendexTrendingItems(subject))),
    ]);

    const supplemental = [
      ...openLibrarySets.flat(),
      ...googleBooksSets.flat(),
      ...gutendexSets.flat(),
    ].filter((item): item is TrendingRecommendation => item !== null);

    for (const item of supplemental) {
      const key = normalizeTitle(item.title);
      const existing = combinedByTitle.get(key);
      if (!existing || (item.score ?? 0) > (existing.score ?? 0)) {
        combinedByTitle.set(key, item);
      }
    }
  }

  const ranked = [...combinedByTitle.values()]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit);

  if (ranked.length > 0) {
    writeCache(TRENDING_CACHE_KEY, ranked, TRENDING_TTL_MS);
    return {
      items: ranked,
      source: "live",
      updatedAt: new Date().toISOString(),
    };
  }

  const staleCache = readCache<TrendingRecommendation[]>(TRENDING_CACHE_KEY, { allowExpired: true });
  if (staleCache && staleCache.payload.length > 0) {
    return {
      items: staleCache.payload.slice(0, limit),
      source: "cache",
      updatedAt: staleCache.updatedAt,
    };
  }

  return {
    items: [],
    source: "fallback",
    updatedAt: null,
  };
};

const fetchOpenLibraryTopicItems = async (subject: string) => {
  const payload = await fetchJsonWithTimeout<OpenLibrarySubjectsResponse>(
    buildExternalApiUrl("openlibrary", `/subjects/${subject}.json?limit=12`),
    6500
  );
  const works = payload?.works ?? [];
  const label = subjectToLabel(subject);

  return works.map((work) => {
    const title = typeof work.title === "string" ? work.title.trim() : "";
    if (!title) return null;
    const author = work.authors?.[0]?.name ?? "Unknown Author";
    const hint = `${title} ${author} ${(work.subject ?? []).join(" ")} ${subject}`;
    const editionCount = typeof work.edition_count === "number" ? work.edition_count : 0;
    const cover =
      typeof work.cover_id === "number"
        ? `https://covers.openlibrary.org/b/id/${work.cover_id}-L.jpg`
        : FALLBACK_IMAGE;

    return {
      title,
      format: inferFormat(hint),
      description: `${label} pick · ${author}`,
      imageSrc: cover,
      href: typeof work.key === "string" ? `https://openlibrary.org${work.key}` : undefined,
      score: 18 + editionCount * 1.4,
      source: "Open Library",
    } satisfies TopicRecommendation;
  });
};

const fetchGoogleBooksTopicItems = async (subject: string) => {
  const payload = await fetchJsonWithTimeout<GoogleBooksResponse>(
    buildExternalApiUrl("googlebooks", `/books/v1/volumes?q=subject:${encodeURIComponent(
      subject.replace(/_/g, " ")
    )}&maxResults=10&printType=books&orderBy=relevance`),
    7000
  );
  const items = payload?.items ?? [];
  const label = subjectToLabel(subject);

  return items.map((entry) => {
    const volumeInfo = entry.volumeInfo;
    const title = volumeInfo?.title?.trim() ?? "";
    if (!title) return null;

    const categories = volumeInfo?.categories?.join(" ") ?? "";
    const author = volumeInfo?.authors?.[0] ?? "Unknown Author";
    const imageSrc = volumeInfo?.imageLinks?.thumbnail ?? volumeInfo?.imageLinks?.smallThumbnail;
    const ratingsCount = typeof volumeInfo?.ratingsCount === "number" ? volumeInfo.ratingsCount : 0;
    const averageRating =
      typeof volumeInfo?.averageRating === "number" ? volumeInfo.averageRating : 0;
    const rawDescription =
      typeof volumeInfo?.description === "string" ? volumeInfo.description.trim() : "";
    const description =
      rawDescription.length > 140
        ? `${rawDescription.slice(0, 140).trimEnd()}...`
        : rawDescription || `${label} pick · ${author}`;

    return {
      title,
      format: inferFormat(`${categories} ${title}`),
      description,
      imageSrc: imageSrc?.replace("http://", "https://") || FALLBACK_IMAGE,
      href: volumeInfo?.infoLink,
      score: 12 + ratingsCount * 0.15 + averageRating * 8,
      source: "Google Books",
    } satisfies TopicRecommendation;
  });
};

const fetchGutendexTopicItems = async (subject: string) => {
  const payload = await fetchJsonWithTimeout<GutendexResponse>(
    buildExternalApiUrl("gutendex", `/books?search=${encodeURIComponent(
      subject.replace(/_/g, " ")
    )}&languages=en`),
    7000
  );
  const items = payload?.results ?? [];
  const label = subjectToLabel(subject);

  return items.slice(0, 10).map((entry) => {
    const title = typeof entry.title === "string" ? entry.title.trim() : "";
    if (!title) return null;

    const author = entry.authors?.[0]?.name ?? "Unknown Author";
    const hint = `${title} ${author} ${(entry.subjects ?? []).join(" ")}`;
    const imageSrc =
      typeof entry.formats?.["image/jpeg"] === "string"
        ? entry.formats["image/jpeg"]
        : FALLBACK_IMAGE;
    const downloads = typeof entry.download_count === "number" ? entry.download_count : 0;

    return {
      title,
      format: inferFormat(hint),
      description: `${label} pick · ${author}`,
      imageSrc,
      href:
        typeof entry.id === "number" ? `https://www.gutenberg.org/ebooks/${entry.id}` : undefined,
      score: 10 + downloads * 0.02,
      source: "Gutendex",
    } satisfies TopicRecommendation;
  });
};

export const getTopicsForYouRecommendations = async (options: {
  userId: string;
  genres: string[];
  recentTitles: string[];
  limit?: number;
}): Promise<RecommendationFetchResult<TopicRecommendation>> => {
  const limit = options.limit ?? 6;
  const subjects = inferSubjects(options.genres, options.recentTitles);
  const cacheKey = `sf:recommendations:topics:v1:${options.userId}:${subjects.join(",")}`;

  const freshCache = readCache<TopicRecommendation[]>(cacheKey);
  if (freshCache && freshCache.payload.length > 0) {
    return {
      items: freshCache.payload.slice(0, limit),
      source: "cache",
      updatedAt: freshCache.updatedAt,
    };
  }

  const topSubjects = subjects.slice(0, 3);
  const [openLibrarySets, googleBooksSets, gutendexSets] = await Promise.all([
    Promise.all(topSubjects.map((subject) => fetchOpenLibraryTopicItems(subject))),
    Promise.all(topSubjects.map((subject) => fetchGoogleBooksTopicItems(subject))),
    Promise.all(topSubjects.map((subject) => fetchGutendexTopicItems(subject))),
  ]);

  const merged = [...openLibrarySets.flat(), ...googleBooksSets.flat(), ...gutendexSets.flat()].filter(
    (item): item is TopicRecommendation => item !== null
  );

  const byTitle = new Map<string, TopicRecommendation>();
  for (const item of merged) {
    const key = normalizeTitle(item.title);
    const existing = byTitle.get(key);
    if (!existing || (item.score ?? 0) > (existing.score ?? 0)) {
      byTitle.set(key, item);
    }
  }

  const ranked = [...byTitle.values()]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, limit);

  if (ranked.length > 0) {
    writeCache(cacheKey, ranked, TOPICS_TTL_MS);
    return {
      items: ranked,
      source: "live",
      updatedAt: new Date().toISOString(),
    };
  }

  const staleCache = readCache<TopicRecommendation[]>(cacheKey, { allowExpired: true });
  if (staleCache && staleCache.payload.length > 0) {
    return {
      items: staleCache.payload.slice(0, limit),
      source: "cache",
      updatedAt: staleCache.updatedAt,
    };
  }

  return {
    items: [],
    source: "fallback",
    updatedAt: null,
  };
};
