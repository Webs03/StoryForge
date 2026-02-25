import { useState, useEffect } from "react";
import type { FirebaseError } from "firebase/app";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDocsFromCache,
  type QuerySnapshot,
  type DocumentData,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db, firebaseInitError } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";

export type DocumentType = "story" | "playscript";
export type DocumentStatus = "Draft" | "Editing" | "Final";

export interface Document {
  id: string;
  title: string;
  content: string;
  owner: string;
  type: DocumentType;
  status: DocumentStatus;
  genre: string;
  createdAt: Date;
  updatedAt: Date;
}

const parseDate = (value: unknown): Date => {
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
};

const parseType = (value: unknown): DocumentType =>
  value === "playscript" ? "playscript" : "story";

const parseStatus = (value: unknown): DocumentStatus => {
  if (value === "Editing") return "Editing";
  if (value === "Final") return "Final";
  return "Draft";
};

const getErrorCode = (err: unknown) => {
  if (typeof err !== "object" || err === null) return null;
  const maybeError = err as Partial<FirebaseError>;
  if (typeof maybeError.code !== "string") return null;
  return maybeError.code.replace(/^firestore\//, "");
};

const isOfflineError = (err: unknown) => {
  const code = getErrorCode(err);
  if (code === "unavailable") return true;
  if (err instanceof Error && /offline/i.test(err.message)) return true;
  return false;
};

const normalizeErrorMessage = (err: unknown, fallback: string) => {
  if (isOfflineError(err)) {
    return "You are offline. Reconnect to sync your latest documents.";
  }
  const code = getErrorCode(err);
  if (code === "permission-denied") {
    return "Permission denied while accessing documents. Check Firestore rules.";
  }
  return err instanceof Error ? err.message : fallback;
};

const mapSnapshotToDocuments = (
  snapshot: QuerySnapshot<DocumentData>,
  fallbackOwner: string
) => {
  const docs: Document[] = [];
  snapshot.forEach((item) => {
    const data = item.data();
    docs.push({
      id: item.id,
      title: typeof data.title === "string" ? data.title : "Untitled",
      content: typeof data.content === "string" ? data.content : "",
      owner: typeof data.owner === "string" ? data.owner : fallbackOwner,
      type: parseType(data.type),
      status: parseStatus(data.status),
      genre: typeof data.genre === "string" ? data.genre : "Uncategorized",
      createdAt: parseDate(data.createdAt),
      updatedAt: parseDate(data.updatedAt),
    });
  });
  docs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  return docs;
};

export const useDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDbInstance = () => {
    if (!db) {
      throw new Error(firebaseInitError ?? "Firestore is not configured");
    }
    return db;
  };

  // Fetch user's documents
  useEffect(() => {
    if (!db) {
      setDocuments([]);
      setError(firebaseInitError ?? "Firestore is not configured");
      setLoading(false);
      return;
    }

    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const fetchDocuments = async () => {
      const firestore = getDbInstance();
      const documentsQuery = query(
        collection(firestore, "documents"),
        where("owner", "==", user.uid)
      );

      try {
        setLoading(true);
        const querySnapshot = await getDocs(documentsQuery);
        setDocuments(mapSnapshotToDocuments(querySnapshot, user.uid));
        setError(null);
      } catch (err) {
        if (isOfflineError(err)) {
          try {
            const cachedSnapshot = await getDocsFromCache(documentsQuery);
            setDocuments(mapSnapshotToDocuments(cachedSnapshot, user.uid));
            setError("You are offline. Showing cached documents.");
          } catch {
            setDocuments([]);
            setError("You are offline and no cached documents are available yet.");
          }
        } else {
          setError(normalizeErrorMessage(err, "Failed to fetch documents"));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  // Create new document
  const createDocument = async (
    title: string,
    content: string = "",
    options?: { type?: DocumentType; status?: DocumentStatus; genre?: string }
  ) => {
    if (!user) throw new Error("User not authenticated");
    const firestore = getDbInstance();

    const now = Timestamp.now();
    const type = options?.type ?? "story";
    const status = options?.status ?? "Draft";
    const genre = options?.genre ?? "Uncategorized";

    try {
      const docRef = await addDoc(collection(firestore, "documents"), {
        title,
        content,
        owner: user.uid,
        type,
        status,
        genre,
        createdAt: now,
        updatedAt: now,
      });

      const createdAt = now.toDate();
      setDocuments((previous) => [
        {
          id: docRef.id,
          title,
          content,
          owner: user.uid,
          type,
          status,
          genre,
          createdAt,
          updatedAt: createdAt,
        },
        ...previous,
      ]);

      return docRef.id;
    } catch (err) {
      throw new Error(normalizeErrorMessage(err, "Failed to create document"));
    }
  };

  // Update document
  const updateDocument = async (docId: string, title: string, content: string) => {
    if (!user) throw new Error("User not authenticated");
    const firestore = getDbInstance();

    try {
      const docRef = doc(firestore, "documents", docId);
      const now = Timestamp.now();
      await updateDoc(docRef, {
        title,
        content,
        updatedAt: now,
      });

      const updatedAt = now.toDate();
      setDocuments((previous) => {
        const updated = previous.map((item) =>
          item.id === docId ? { ...item, title, content, updatedAt } : item
        );
        updated.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        return updated;
      });
    } catch (err) {
      throw new Error(normalizeErrorMessage(err, "Failed to update document"));
    }
  };

  // Delete document
  const deleteDocument = async (docId: string) => {
    if (!user) throw new Error("User not authenticated");
    const firestore = getDbInstance();

    try {
      await deleteDoc(doc(firestore, "documents", docId));
      setDocuments((previous) => previous.filter((item) => item.id !== docId));
    } catch (err) {
      throw new Error(normalizeErrorMessage(err, "Failed to delete document"));
    }
  };

  return {
    documents,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
  };
};
