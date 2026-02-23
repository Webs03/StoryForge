import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";

export interface Document {
  id: string;
  title: string;
  content: string;
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useDocuments = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's documents
  useEffect(() => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, "documents"),
          where("owner", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const docs: Document[] = [];
        querySnapshot.forEach((doc) => {
          docs.push({
            id: doc.id,
            ...(doc.data() as Omit<Document, "id">),
          });
        });
        setDocuments(docs);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  // Create new document
  const createDocument = async (title: string, content: string = "") => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const docRef = await addDoc(collection(db, "documents"), {
        title,
        content,
        owner: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to create document");
    }
  };

  // Update document
  const updateDocument = async (docId: string, title: string, content: string) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      const docRef = doc(db, "documents", docId);
      await updateDoc(docRef, {
        title,
        content,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to update document");
    }
  };

  // Delete document
  const deleteDocument = async (docId: string) => {
    if (!user) throw new Error("User not authenticated");
    
    try {
      await deleteDoc(doc(db, "documents", docId));
      setDocuments(documents.filter((d) => d.id !== docId));
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to delete document");
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
