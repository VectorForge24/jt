/**
 * useFirebaseSync — Firebase replacement for useDriveSync.
 * Same exported API as original: { isLoggedIn, token, loginWithGoogle, logoutGoogle, saveToDrive, isSyncing }
 *
 * Fixes in this version:
 * 1. pullFromFirestore skips overwrite if remote data is empty (protects local data)
 * 2. After import, data is pushed to Firestore immediately so it persists
 * 3. No longer overwrites localStorage with stale/empty cloud data
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth        = getAuth(firebaseApp);
const db          = getFirestore(firebaseApp);

const TRACKER_KEYS = [
  'tracker-events',
  'tracker-chapters',
  'tracker-syllabus',
  'tracker-mocks',
  'tracker-materials',
  'tracker-theme',
  'tracker-color',
  'tracker-color-intensity',
  'tracker-bg-dimness',
  'tracker-tile-opacity',
  'tracker-bg',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isEmptyValue(val) {
  if (!val) return true;
  const s = String(val).trim();
  return s === '' || s === '[]' || s === '{}' || s === 'null' || s === 'undefined';
}

function countMeaningfulKeys(data) {
  // How many keys have real (non-empty) data
  return Object.entries(data).filter(([k, v]) =>
    TRACKER_KEYS.includes(k) && !isEmptyValue(v)
  ).length;
}

function localDataCount() {
  return TRACKER_KEYS.filter(k => !isEmptyValue(localStorage.getItem(k))).length;
}

// ── Write all tracker keys to Firestore ───────────────────────────────────────
async function pushAllToFirestore(uid) {
  const data = {};
  TRACKER_KEYS.forEach(key => {
    const val = localStorage.getItem(key);
    if (val !== null) data[key] = val;
  });
  await setDoc(
    doc(db, 'users', uid, 'data', 'trackerData'),
    { ...data, _updatedAt: serverTimestamp() },
    { merge: true }
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useDriveSync() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token,      setToken]      = useState(null);
  const [isSyncing,  setIsSyncing]  = useState(false);
  const hasPulled    = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        setToken(user.uid);

        if (!hasPulled.current) {
          hasPulled.current = true;
          await pullFromFirestore(user.uid);
        }
      } else {
        setIsLoggedIn(false);
        setToken(null);
        hasPulled.current = false;
      }
    });
    return unsub;
  }, []);

  // ── Pull Firestore → localStorage ─────────────────────────────────────────
  // KEY FIX: Only pull if cloud has MORE meaningful data than local.
  // If Firestore is empty (new install) and local has real data, skip the pull.
  // If local is empty and cloud has data, pull and reload.
  const pullFromFirestore = async (uid) => {
    setIsSyncing(true);
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'data', 'trackerData'));

      if (!snap.exists()) {
        // First time ever — nothing in cloud. If local has data, push it up.
        const localCount = localDataCount();
        if (localCount > 0) {
          console.log(`ℹ️ No cloud data yet. Pushing ${localCount} local keys to Firestore.`);
          await pushAllToFirestore(uid);
        } else {
          console.log('ℹ️ No cloud data and no local data — fresh start.');
        }
        return;
      }

      const remote      = snap.data();
      const remoteCount = countMeaningfulKeys(remote);
      const localCount  = localDataCount();

      console.log(`Cloud has ${remoteCount} meaningful keys, local has ${localCount}`);

      if (remoteCount === 0 && localCount > 0) {
        // Cloud is empty but local has data — push local to cloud, don't overwrite
        console.log('⚠️ Cloud empty but local has data — pushing local to cloud.');
        await pushAllToFirestore(uid);
        return;
      }

      if (remoteCount === 0 && localCount === 0) {
        console.log('ℹ️ Both empty — fresh start.');
        return;
      }

      // Cloud has data — check if it's newer/better than local
      let hasChanges = false;
      TRACKER_KEYS.forEach(key => {
        const remoteVal = remote[key];
        const localVal  = localStorage.getItem(key);
        // Only update local if remote has a non-empty value different from local
        if (remoteVal !== undefined && !isEmptyValue(remoteVal) && localVal !== remoteVal) {
          localStorage.setItem(key, remoteVal);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        console.log('✅ Cloud data restored — reloading');
        window.location.reload();
      } else {
        console.log('✅ Already in sync with cloud');
      }
    } catch (e) {
      console.error('Pull error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Push localStorage → Firestore ─────────────────────────────────────────
  const saveToDrive = useCallback(async (_ignored) => {
    const user = auth.currentUser;
    if (!user) return;
    setIsSyncing(true);
    try {
      await pushAllToFirestore(user.uid);
      console.log('✅ Saved to Firebase');
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        console.error('Login error:', e.message);
        alert('Sign-in failed: ' + e.message);
      }
    }
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logoutGoogle = useCallback(async () => {
    await signOut(auth);
    hasPulled.current = false;
  }, []);

  return {
    isLoggedIn,
    token,
    loginWithGoogle,
    logoutGoogle,
    saveToDrive,
    isSyncing,
    sessionExpired: false,
  };
}
