import { useState, useEffect, useCallback, useRef } from "react";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase/config";

/**
 * Professional Data Hook: useFirestore (Stable Fetch Version)
 *
 * Uses one-time getDocs() fetches instead of persistent onSnapshot() listeners.
 * This completely eliminates the Firestore INTERNAL ASSERTION FAILED error that
 * occurs when many real-time listeners are created/destroyed rapidly during
 * page navigation (a known Firestore SDK bug with concurrent listener churn).
 *
 * Data is automatically refreshed after every mutation (add/update/delete).
 * Call the returned `refresh()` function to manually trigger a re-fetch.
 */
export const useFirestore = (collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // A simple counter: incrementing it triggers a re-fetch via useEffect dependency.
  const [fetchTick, setFetchTick] = useState(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const refresh = useCallback(() => {
    setFetchTick(t => t + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const colRef = collection(db, collectionName);
        // Try fetching with ordering; fall back to unordered on index error
        let snapshot;
        try {
          const q = query(colRef, orderBy("createdAt", "desc"));
          snapshot = await getDocs(q);
        } catch {
          snapshot = await getDocs(collection(db, collectionName));
        }

        if (!active) return;

        const results = snapshot.docs.map(d => ({
          ...d.data(),
          id: d.id
        }));

        // Client-side sort as safety net when order wasn't applied server-side
        results.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return dateB - dateA;
        });

        setData(results);
        setLoading(false);
      } catch (err) {
        if (!active) return;
        console.error(`[useFirestore] Fetch error for "${collectionName}":`, err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();

    return () => { active = false; };
  }, [collectionName, fetchTick]);

  const normalizeData = (input) => {
    const cleaned = { ...input };
    Object.keys(cleaned).forEach(key => {
      if (
        typeof cleaned[key] === "string" &&
        cleaned[key].trim() !== "" &&
        !isNaN(cleaned[key]) &&
        (key.toLowerCase().includes("amount") ||
          key.toLowerCase().includes("rate") ||
          key.toLowerCase().includes("limit"))
      ) {
        cleaned[key] = Number(cleaned[key]);
      }
    });
    return cleaned;
  };

  const addDocument = async (docData) => {
    try {
      const colRef = collection(db, collectionName);
      const result = await addDoc(colRef, {
        ...normalizeData(docData),
        createdAt: serverTimestamp()
      });
      refresh(); // Re-fetch after mutation
      return result;
    } catch (err) {
      console.error("[useFirestore] Add Doc Error:", err);
      throw err;
    }
  };

  const updateDocument = async (id, updates) => {
    try {
      const docRef = doc(db, collectionName, id);
      const result = await updateDoc(docRef, normalizeData(updates));
      refresh(); // Re-fetch after mutation
      return result;
    } catch (err) {
      console.error("[useFirestore] Update Doc Error:", err);
      throw err;
    }
  };

  const deleteDocument = async (id) => {
    try {
      const docRef = doc(db, collectionName, id);
      const result = await deleteDoc(docRef);
      refresh(); // Re-fetch after mutation
      return result;
    } catch (err) {
      console.error("[useFirestore] Delete Doc Error:", err);
      throw err;
    }
  };

  return { data, loading, error, refresh, addDocument, updateDocument, deleteDocument };
};
