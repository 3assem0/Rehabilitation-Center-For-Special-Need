import { initializeApp } from "firebase/app";
import { initializeFirestore, CACHE_SIZE_UNLIMITED } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCESmn8jJIE04dbrbZwcZcZxeQz_MAHcQg",
  authDomain: "shop-dashboard-285a2.firebaseapp.com",
  databaseURL: "https://shop-dashboard-285a2-default-rtdb.firebaseio.com",
  projectId: "shop-dashboard-285a2",
  storageBucket: "shop-dashboard-285a2.firebasestorage.app",
  messagingSenderId: "712065723372",
  appId: "1:712065723372:web:a124ac91846d209d106ec9",
  measurementId: "G-HS5967MNW1"
};

const app = initializeApp(firebaseConfig);

/**
 * Use initializeFirestore with experimentalForceLongPolling disabled and
 * no local persistence. This prevents the SDK's internal watch-stream from
 * accumulating stale state that causes the INTERNAL ASSERTION FAILED crash
 * (error IDs b815 / ca9) when many pages are opened in rapid succession.
 *
 * Since useFirestore now uses getDocs() (one-time fetches), we don't need
 * any real-time listener infrastructure at all — this config is optimal.
 */
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: false,
  ignoreUndefinedProperties: true,
});

export const auth = getAuth(app);
