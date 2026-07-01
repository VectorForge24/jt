import { useState, useEffect, useCallback, useRef } from 'react';
import {
  requestNotificationPermission,
  getNotificationPermission,
  scheduleTaskNotifications,
  resetDailyNotifiedSetIfNeeded,
} from '../engine/notificationEngine.js';

/**
 * useTaskNotifications — drives the notification engine from live event data.
 * Polls every 60s to catch newly-entering-window tasks and re-evaluates
 * permission state. Call requestPermission() from a user-gesture (button tap).
 */
export function useTaskNotifications(events) {
  const [permission, setPermission] = useState(() => getNotificationPermission());
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  }, []);

  useEffect(() => {
    resetDailyNotifiedSetIfNeeded();
  }, []);

  useEffect(() => {
    if (permission !== 'granted') return;

    // Initial scan
    scheduleTaskNotifications(eventsRef.current);

    // Re-scan every 60s — catches tasks newly entering the 30-min window,
    // and re-syncs if events changed (task added/edited/deleted).
    const interval = setInterval(() => {
      resetDailyNotifiedSetIfNeeded();
      scheduleTaskNotifications(eventsRef.current);
    }, 60_000);

    return () => clearInterval(interval);
  }, [permission]);

  // Re-schedule immediately whenever the events array itself changes
  // (e.g. user just created a task ending in 20 minutes)
  useEffect(() => {
    if (permission === 'granted') scheduleTaskNotifications(events);
  }, [events, permission]);

  return { permission, requestPermission };
}
