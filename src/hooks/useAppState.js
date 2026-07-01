import { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { buildRankingState, INITIAL_STATE, xpToRank } from '../engine/xpEngine.js';
import { generateBots, buildLeaderboard, getPositionDelta } from '../engine/botEngine.js';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  const msg = 'Firebase config missing — set VITE_FIREBASE_* env vars in Vercel, then redeploy.';
  document.body.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b1120;color:#fff;font-family:system-ui;padding:24px;text-align:center;"><div style="max-width:380px;"><div style="font-size:36px;margin-bottom:14px;">⚠️</div><h1 style="font-size:17px;font-weight:700;margin-bottom:8px;">Configuration Error</h1><p style="font-size:13px;color:#94a3b8;line-height:1.6;">${msg}</p></div></div>`;
  throw new Error(msg);
}

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db   = getFirestore(firebaseApp);

const TRACKER_KEYS = ['tracker-events','tracker-chapters','tracker-syllabus','tracker-mocks','tracker-materials','tracker-theme','tracker-color','tracker-color-intensity','tracker-bg-dimness','tracker-tile-opacity','tracker-bg'];

function isEmptyValue(v) { if (!v) return true; const s=String(v).trim(); return s===''||s==='[]'||s==='{}'||s==='null'||s==='undefined'; }
function localDataCount() { return TRACKER_KEYS.filter(k => !isEmptyValue(localStorage.getItem(k))).length; }
function countMeaningfulKeys(data) { return Object.entries(data).filter(([k,v]) => TRACKER_KEYS.includes(k) && !isEmptyValue(v)).length; }
function safeJSON(s, fb) { try { return JSON.parse(s); } catch { return fb; } }

async function pushTrackerToFirestore(uid) {
  const data = {};
  TRACKER_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v !== null) data[k] = v; });
  await setDoc(doc(db,'users',uid,'data','trackerData'), { ...data, _updatedAt: serverTimestamp() }, { merge:true });
}

const BOT_SEED = 20260601;

export function useAppState() {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [uid, setUid] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const hasPulled = useRef(false);

  // ── Tracker data (single source of truth, drives both tracker UI + ranking) ─
  const [events,    setEventsState]    = useState(() => safeJSON(localStorage.getItem('tracker-events'), []));
  const [chapters,  setChaptersState]  = useState(() => safeJSON(localStorage.getItem('tracker-chapters'), []));
  const [syllabus,  setSyllabusState]  = useState(() => safeJSON(localStorage.getItem('tracker-syllabus'), []));
  const [mocks,     setMocksState]     = useState(() => safeJSON(localStorage.getItem('tracker-mocks'), []));
  const [materials, setMaterialsState] = useState(() => safeJSON(localStorage.getItem('tracker-materials'), null));

  // ── Ranking state ─────────────────────────────────────────────────────────
  const [rankingState, setRankingState] = useState(INITIAL_STATE);
  const [todayResult,  setTodayResult]  = useState(null);
  const [animQueue,    setAnimQueue]    = useState([]);
  const [leaderboard,  setLeaderboard]  = useState([]);
  const [positionDeltas, setPositionDeltas] = useState({});
  const [username, setUsernameState] = useState('');
  const botsRef = useRef(generateBots(BOT_SEED));

  const syncTimeoutRef = useRef(null);

  // ── Persist tracker state changes to localStorage + debounced cloud sync ──
  const persistKey = useCallback((key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      if (auth.currentUser) {
        setIsSyncing(true);
        pushTrackerToFirestore(auth.currentUser.uid).finally(() => setIsSyncing(false));
      }
    }, 2000);
  }, []);

  const setEvents   = useCallback(v => { setEventsState(prev => { const nv = typeof v==='function'?v(prev):v; persistKey('tracker-events', nv); return nv; }); }, [persistKey]);
  const setChapters = useCallback(v => { setChaptersState(prev => { const nv = typeof v==='function'?v(prev):v; persistKey('tracker-chapters', nv); return nv; }); }, [persistKey]);
  const setSyllabus = useCallback(v => { setSyllabusState(prev => { const nv = typeof v==='function'?v(prev):v; persistKey('tracker-syllabus', nv); return nv; }); }, [persistKey]);
  const setMocks     = useCallback(v => { setMocksState(prev => { const nv = typeof v==='function'?v(prev):v; persistKey('tracker-mocks', nv); return nv; }); }, [persistKey]);
  const setMaterials = useCallback(v => { setMaterialsState(prev => { const nv = typeof v==='function'?v(prev):v; persistKey('tracker-materials', nv); return nv; }); }, [persistKey]);

  // ── Recompute ranking whenever events change ───────────────────────────────
  const recomputeRanking = useCallback((evts, uname) => {
    const saved = safeJSON(localStorage.getItem('tracker-ranking-state'), null);
    const { state, todayResult: tr, animEvents, changed } = buildRankingState(evts, saved);
    setRankingState(state);
    setTodayResult(tr);
    if (animEvents.length > 0) setAnimQueue(q => [...q, ...animEvents]);
    if (changed) {
      localStorage.setItem('tracker-ranking-state', JSON.stringify(state));
      if (auth.currentUser) {
        setDoc(doc(db,'users',auth.currentUser.uid,'data','rankingData'),
          { rankingState: state, username: uname, _updatedAt: serverTimestamp() }, { merge:true }
        ).catch(() => {});
      }
    }
    const dayNum = new Date().getDate();
    const realUser = { id:'real_user', username: uname||'You', totalXP: state.totalXP, todayXP: tr?.xpDelta || 0 };
    setLeaderboard(buildLeaderboard(botsRef.current, dayNum, realUser, BOT_SEED));
    setPositionDeltas(getPositionDelta(botsRef.current, dayNum, realUser, BOT_SEED));
  }, []);

  useEffect(() => {
    recomputeRanking(events, username);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  // ── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        setUid(user.uid);
        setUserProfile({ id:user.uid, name:user.displayName, email:user.email, photoURL:user.photoURL, given_name:user.displayName?.split(' ')[0]||'Student' });
        setUsernameState(prev => prev || user.displayName?.split(' ')[0] || 'Student');

        if (!hasPulled.current) {
          hasPulled.current = true;
          await pullFromFirestore(user.uid);
        }
      } else {
        setIsLoggedIn(false);
        setUid(null);
        setUserProfile(null);
        hasPulled.current = false;
      }
    });
    return unsub;
  }, []);

  const pullFromFirestore = async (userId) => {
    setIsSyncing(true);
    try {
      const snap = await getDoc(doc(db,'users',userId,'data','trackerData'));
      if (!snap.exists()) {
        const localCount = localDataCount();
        if (localCount > 0) await pushTrackerToFirestore(userId);
        return;
      }
      const remote = snap.data();
      const remoteCount = countMeaningfulKeys(remote);
      const localCount  = localDataCount();
      if (remoteCount === 0 && localCount > 0) { await pushTrackerToFirestore(userId); return; }
      if (remoteCount === 0 && localCount === 0) return;

      let hasChanges = false;
      TRACKER_KEYS.forEach(key => {
        const remoteVal = remote[key];
        const localVal  = localStorage.getItem(key);
        if (remoteVal !== undefined && !isEmptyValue(remoteVal) && localVal !== remoteVal) {
          localStorage.setItem(key, remoteVal);
          hasChanges = true;
        }
      });

      // Pull ranking data too
      const rankSnap = await getDoc(doc(db,'users',userId,'data','rankingData'));
      if (rankSnap.exists()) {
        const rd = rankSnap.data();
        if (rd.rankingState) localStorage.setItem('tracker-ranking-state', JSON.stringify(rd.rankingState));
        if (rd.username) setUsernameState(rd.username);
      }

      if (hasChanges) window.location.reload();
    } catch (e) {
      console.error('Pull error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const setUsername = useCallback((name) => {
    setUsernameState(name);
    if (auth.currentUser) {
      setDoc(doc(db,'users',auth.currentUser.uid,'data','rankingData'), { username:name, _updatedAt: serverTimestamp() }, { merge:true }).catch(()=>{});
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile'); provider.addScope('email');
    try { await signInWithPopup(auth, provider); }
    catch (e) { if (e.code !== 'auth/popup-closed-by-user') alert('Sign-in failed: ' + e.message); }
  }, []);

  const logout = useCallback(async () => { await signOut(auth); }, []);

  const consumeAnim = useCallback(() => setAnimQueue(q => q.slice(1)), []);

  const { rank, subXP } = xpToRank(rankingState.totalXP);
  const userPosition = leaderboard.find(e => e.id==='real_user')?.position || null;

  return {
    // auth
    isLoggedIn, uid, userProfile, isSyncing, loginWithGoogle, logout,
    // tracker data
    events, setEvents, chapters, setChapters, syllabus, setSyllabus,
    mocks, setMocks, materials, setMaterials,
    // ranking
    rankingState, rank, subXP, todayResult, username, setUsername,
    leaderboard, positionDeltas, userPosition, animQueue, consumeAnim,
  };
}
