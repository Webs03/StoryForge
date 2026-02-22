import { useEffect, useMemo, useState } from "react";
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  query,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";

export type WorkType = "story" | "playscript";
export type WorkStatus = "Draft" | "Editing" | "Final";

export interface StoryDocument {
  id: string;
  title: string;
  description: string;
  content: string;
  owner: string;
  ownerName: string;
  type: WorkType;
  status: WorkStatus;
  genre: string;
  tags: string[];
  language: string;
  coverUrl: string;
  isPublic: boolean;
  reads: number;
  votes: number;
  comments: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateDocumentInput = Partial<
  Omit<StoryDocument, "id" | "owner" | "createdAt" | "updatedAt">
>;

export type UpdateDocumentInput = Partial<
  Omit<StoryDocument, "id" | "owner" | "createdAt" | "updatedAt">
>;

const DEFAULT_LANGUAGE = "English";
const DEFAULT_GENRE = "General";
const DEFAULT_TITLE = "Untitled Story";
const DEFAULT_OWNER_NAME = "Anonymous Writer";

export const countWords = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
};

const toDate = (value: unknown) => {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
};

const asString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const asNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

const asStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
};

const asWorkType = (value: unknown): WorkType =>
  value === "playscript" ? "playscript" : "story";

const asWorkStatus = (value: unknown): WorkStatus => {
  if (value === "Final") return "Final";
  if (value === "Editing") return "Editing";
  return "Draft";
};

const mapDocument = (id: string, data: DocumentData): StoryDocument => {
  const content = asString(data.content);

  return {
    id,
    title: asString(data.title, DEFAULT_TITLE),
    description: asString(data.description),
    content,
    owner: asString(data.owner),
    ownerName: asString(data.ownerName, DEFAULT_OWNER_NAME),
    type: asWorkType(data.type),
    status: asWorkStatus(data.status),
    genre: asString(data.genre, DEFAULT_GENRE),
    tags: asStringArray(data.tags),
    language: asString(data.language, DEFAULT_LANGUAGE),
    coverUrl: asString(data.coverUrl),
    isPublic: Boolean(data.isPublic),
    reads: asNumber(data.reads),
    votes: asNumber(data.votes),
    comments: asNumber(data.comments),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
};

const sortByUpdated = (a: StoryDocument, b: StoryDocument) =>
  b.updatedAt.getTime() - a.updatedAt.getTime();

export const useDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<StoryDocument[]>([]);
  const [publicStories, setPublicStories] = useState<StoryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [publicLoading, setPublicLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ownerQuery = query(
      collection(db, "documents"),
      where("owner", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      ownerQuery,
      (snapshot) => {
        const docs = snapshot.docs
          .map((snapshotDoc) => mapDocument(snapshotDoc.id, snapshotDoc.data()))
          .sort(sortByUpdated);
        setDocuments(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err instanceof Error ? err.message : "Failed to fetch documents");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    setPublicLoading(true);
    const publicQuery = query(
      collection(db, "documents"),
      where("isPublic", "==", true),
      limit(40),
    );

    const unsubscribe = onSnapshot(
      publicQuery,
      (snapshot) => {
        const docs = snapshot.docs
          .map((snapshotDoc) => mapDocument(snapshotDoc.id, snapshotDoc.data()))
          .sort(sortByUpdated);
        setPublicStories(docs);
        setPublicLoading(false);
      },
      (err) => {
        setError(err instanceof Error ? err.message : "Failed to fetch stories");
        setPublicStories([]);
        setPublicLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const allCached = useMemo(
    () => [...documents, ...publicStories],
    [documents, publicStories],
  );

  const createDocument = async (input: CreateDocumentInput = {}) => {
    if (!user) throw new Error("User not authenticated");

    const now = Timestamp.now();
    const normalizedTags = asStringArray(input.tags);

    const payload = {
      title: asString(input.title, DEFAULT_TITLE) || DEFAULT_TITLE,
      description: asString(input.description),
      content: asString(input.content),
      owner: user.uid,
      ownerName:
        asString(input.ownerName) ||
        asString(user.displayName) ||
        DEFAULT_OWNER_NAME,
      type: asWorkType(input.type),
      status: asWorkStatus(input.status),
      genre: asString(input.genre, DEFAULT_GENRE),
      tags: normalizedTags,
      language: asString(input.language, DEFAULT_LANGUAGE),
      coverUrl: asString(input.coverUrl),
      isPublic: Boolean(input.isPublic),
      reads: asNumber(input.reads),
      votes: asNumber(input.votes),
      comments: asNumber(input.comments),
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, "documents"), payload);
    return docRef.id;
  };

  const updateDocument = async (docId: string, updates: UpdateDocumentInput) => {
    if (!user) throw new Error("User not authenticated");

    const payload: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    if (updates.title !== undefined) payload.title = updates.title.trim() || DEFAULT_TITLE;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.ownerName !== undefined) payload.ownerName = updates.ownerName || DEFAULT_OWNER_NAME;
    if (updates.type !== undefined) payload.type = asWorkType(updates.type);
    if (updates.status !== undefined) payload.status = asWorkStatus(updates.status);
    if (updates.genre !== undefined) payload.genre = updates.genre || DEFAULT_GENRE;
    if (updates.tags !== undefined) payload.tags = asStringArray(updates.tags);
    if (updates.language !== undefined) payload.language = updates.language || DEFAULT_LANGUAGE;
    if (updates.coverUrl !== undefined) payload.coverUrl = updates.coverUrl;
    if (updates.isPublic !== undefined) payload.isPublic = Boolean(updates.isPublic);
    if (updates.reads !== undefined) payload.reads = Math.max(0, Math.floor(updates.reads));
    if (updates.votes !== undefined) payload.votes = Math.max(0, Math.floor(updates.votes));
    if (updates.comments !== undefined) payload.comments = Math.max(0, Math.floor(updates.comments));

    await updateDoc(doc(db, "documents", docId), payload);
  };

  const deleteDocument = async (docId: string) => {
    if (!user) throw new Error("User not authenticated");
    await deleteDoc(doc(db, "documents", docId));
  };

  const getDocumentById = async (docId: string) => {
    const cached = allCached.find((item) => item.id === docId);
    if (cached) return cached;

    const snapshot = await getDoc(doc(db, "documents", docId));
    if (!snapshot.exists()) return null;
    return mapDocument(snapshot.id, snapshot.data());
  };

  const incrementReadCount = async (docId: string) => {
    await updateDoc(doc(db, "documents", docId), {
      reads: increment(1),
    });
  };

  return {
    documents,
    publicStories,
    loading,
    publicLoading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    getDocumentById,
    incrementReadCount,
  };
};
