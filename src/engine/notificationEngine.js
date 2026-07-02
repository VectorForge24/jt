/**
 * notificationEngine.js
 * ──────────────────────────────────────────────────────────────────────────
 * Schedules browser notifications for tasks that are about to end.
 * Fires 15-30 min before a task's end time (randomized within that window
 * per-task so multiple tasks don't all fire at once), checks whether the
 * task is marked done, and shows urgency-scaled messaging:
 *
 *   - Task already done           → skip, no notification needed
 *   - Task not done, >15min left  → gentle nudge
 *   - Task not done, <10min left  → penalty zone warning with skull emoji
 *
 * This runs entirely client-side using the Notification API + setTimeout.
 * It does NOT require a backend or FCM server key — it works as long as
 * the tab/PWA is open or backgrounded (not fully closed). For true
 * closed-app push, see the FCM section in firebaseConfig.js (optional
 * upgrade path documented inline).
 */

const NOTIFIED_KEY = 'tracker-notified-tasks'; // tracks which task IDs already got a notification today

function getNotifiedSet() {
  try {
    const raw = sessionStorage.getItem(NOTIFIED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function markNotified(taskId) {
  const set = getNotifiedSet();
  set.add(taskId);
  sessionStorage.setItem(NOTIFIED_KEY, JSON.stringify([...set]));
}

// ── Permission handling ─────────────────────────────────────────────────────

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// ── Core notification firing ────────────────────────────────────────────────

const MESSAGES = {
  nudge: [
    { title: '⏰ Task wrapping up soon', body: t => `"${t}" ends in a bit. Still on track?` },
    { title: '📚 Heads up', body: t => `"${t}" is about to finish. How's progress?` },
  ],
  warning: [
    { title: '⚠️ Cutting it close', body: t => `"${t}" ends in under 10 min. Is it done yet?` },
    { title: '🔥 Final stretch', body: t => `"${t}" — time's almost up. Wrap it up!` },
  ],
  penalty: [
    { title: '💀 Penalty zone incoming', body: t => `"${t}" is about to end — still not marked done. XP penalty zone is right around the corner.` },
    { title: '☠️ Last call', body: t => `"${t}" ends any minute. Mark it done now or eat the penalty.` },
  ],
};

function pickMessage(bucket) {
  const arr = MESSAGES[bucket];
  return arr[Math.floor(Math.random() * arr.length)];
}

function fireNotification(task, minutesLeft) {
  if (Notification.permission !== 'granted') return;

  const bucket = minutesLeft <= 10 ? 'penalty' : minutesLeft <= 20 ? 'warning' : 'nudge';
  const msg = pickMessage(bucket);

  // Use the Service Worker registration if available (works even when tab is backgrounded)
  // Falls back to direct `new Notification()` for browsers without SW support active yet.
  const options = {
    body: msg.body(task.title),
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: `task-${task.id}`, // prevents duplicate stacking for the same task
    requireInteraction: bucket === 'penalty', // penalty notifications stay until dismissed
    vibrate: bucket === 'penalty' ? [200, 100, 200, 100, 200] : [150],
    data: { taskId: task.id, url: '/' },
  };

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(msg.title, options);
    });
  } else {
    try { new Notification(msg.title, options); } catch (e) { console.warn('Notification failed:', e); }
  }

  markNotified(task.id);
}

// ── Scheduling ───────────────────────────────────────────────────────────────

const scheduledTimers = new Map(); // taskId -> timeoutId, so we can clear stale schedules

/**
 * Scan today's tasks and schedule a notification for each one that:
 * - hasn't ended yet
 * - hasn't already been notified this session
 * - is not already marked done
 *
 * Notification fires at a random point in the 15-30 min window before end time.
 * If that window has already passed (task ends in <15 min from now), fires immediately
 * if we're still within the window, or skips if the task has already ended.
 */
export function scheduleTaskNotifications(events) {
  if (Notification.permission !== 'granted') return;
  const safeEvents = Array.isArray(events) ? events : [];

  const now = Date.now();
  const notified = getNotifiedSet();
  const todayStr = new Date().toISOString().slice(0, 10);

  const todaysTasks = safeEvents.filter(e => {
    if (e.allDay) return false;
    const startDate = e.start?.split('T')[0];
    return startDate === todayStr;
  });

  todaysTasks.forEach(task => {
    const isDone = task.extendedProps?.done !== undefined ? task.extendedProps.done : task.done;
    if (isDone) return; // already complete, no nudge needed
    if (notified.has(task.id)) return; // already notified this session
    if (scheduledTimers.has(task.id)) return; // already scheduled, don't double-book

    const endTime = new Date(task.end).getTime();
    const minutesUntilEnd = (endTime - now) / 60000;

    if (minutesUntilEnd <= 0) return; // already ended, skip
    if (minutesUntilEnd > 30) {
      // Too early — schedule a re-check closer to the window.
      // We re-scan every minute from the app's polling loop, so just skip for now.
      return;
    }

    // We're within the 0-30 min window. Pick a random fire point inside
    // whatever's left of the 15-30 min window (or fire near-immediately
    // if we're already past the 15 min mark).
    const windowStart = Math.min(minutesUntilEnd, 30);
    const windowEnd = Math.max(minutesUntilEnd - 15, 0.5); // at least 30s from now
    const fireInMinutes = windowEnd + Math.random() * Math.max(0.1, windowStart - windowEnd);
    const fireInMs = Math.max(500, fireInMinutes * 60000 * -1 + minutesUntilEnd * 60000); 
    // Simplify: just fire somewhere between now and (minutesUntilEnd - a small buffer),
    // weighted toward the 15-30 min-before-end window when possible.
    const delay = minutesUntilEnd > 15
      ? (minutesUntilEnd - 15 - Math.random() * 15) * 60000 // random point in 15-30 min window
      : Math.random() * Math.min(2 * 60000, minutesUntilEnd * 60000); // fire soon if already inside window

    const safeDelay = Math.max(500, delay);

    const timerId = setTimeout(() => {
      const liveTask = events.find(e => e.id === task.id);
      const stillNotDone = liveTask
        ? !(liveTask.extendedProps?.done !== undefined ? liveTask.extendedProps.done : liveTask.done)
        : true;
      if (stillNotDone) {
        const minsLeftAtFire = (new Date(task.end).getTime() - Date.now()) / 60000;
        fireNotification(task, minsLeftAtFire);
      }
      scheduledTimers.delete(task.id);
    }, safeDelay);

    scheduledTimers.set(task.id, timerId);
  });

  // Clean up timers for tasks that got deleted or marked done since scheduling
  const currentIds = new Set(todaysTasks.map(t => t.id));
  for (const [taskId, timerId] of scheduledTimers.entries()) {
    if (!currentIds.has(taskId)) {
      clearTimeout(timerId);
      scheduledTimers.delete(taskId);
    }
  }
}

export function clearAllScheduledNotifications() {
  for (const timerId of scheduledTimers.values()) clearTimeout(timerId);
  scheduledTimers.clear();
}

// Clear the notified-set at midnight so tomorrow's tasks can notify fresh
export function resetDailyNotifiedSetIfNeeded() {
  const lastReset = sessionStorage.getItem('tracker-notified-reset-date');
  const today = new Date().toISOString().slice(0, 10);
  if (lastReset !== today) {
    sessionStorage.removeItem(NOTIFIED_KEY);
    sessionStorage.setItem('tracker-notified-reset-date', today);
  }
}
