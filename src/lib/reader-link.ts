import type { RecommendationFormat } from "@/lib/recommendations";

export interface ReaderLinkPayload {
  title: string;
  format: RecommendationFormat;
  imageSrc?: string;
  source?: string;
  href?: string;
  category?: string;
  description?: string;
  reads?: string;
}

const setParam = (params: URLSearchParams, key: string, value?: string) => {
  if (!value) return;
  const trimmed = value.trim();
  if (!trimmed) return;
  params.set(key, trimmed);
};

export const buildReaderUrl = (payload: ReaderLinkPayload) => {
  const params = new URLSearchParams();
  setParam(params, "title", payload.title);
  setParam(params, "format", payload.format);
  setParam(params, "image", payload.imageSrc);
  setParam(params, "source", payload.source);
  setParam(params, "href", payload.href);
  setParam(params, "category", payload.category);
  setParam(params, "description", payload.description);
  setParam(params, "reads", payload.reads);
  return `/read?${params.toString()}`;
};

const getParam = (params: URLSearchParams, key: string) => {
  const value = params.get(key);
  return value?.trim() || "";
};

export const parseReaderPayload = (params: URLSearchParams): ReaderLinkPayload => {
  const format = getParam(params, "format") === "Playscript" ? "Playscript" : "Story";
  return {
    title: getParam(params, "title"),
    format,
    imageSrc: getParam(params, "image") || undefined,
    source: getParam(params, "source") || undefined,
    href: getParam(params, "href") || undefined,
    category: getParam(params, "category") || undefined,
    description: getParam(params, "description") || undefined,
    reads: getParam(params, "reads") || undefined,
  };
};
