import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useGlobalTimer — the fix for "timer turns off when I switch pages."
 *
 * Root cause: the old TimerPage owned all timer state (mode, timeLeft,
 * isRunning, the setInterval) via its own useState/useEffect. React
 * unmounts a route's component entirely when you navigate away — that
 * doesn't pause the timer, it deletes all of its state and clears the
 * interval. This hook is called once, at the App.jsx level (above the
 * router), so the timer keeps running in the background regardless of
 * which page is currently showing. TimerPage now just reads/controls
 * this shared instance instead of owning its own copy.
 */
export function useGlobalTimer() {
  const [mode, setMode] = useState('Pomodoro'); // Pomodoro | Stopwatch | Countdown
  const [pomoType, setPomoType] = useState('Focus'); // Focus | Short | Long
  const [timeLeft, setTimeLeft] = useState(1500);
  const [totalTime, setTotalTime] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [countdownInput, setCountdownInput] = useState({ h:0, m:30, s:0 });

  const intervalRef = useRef(null);

  // Single interval, lives for the life of the app (App.jsx mounts once).
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (mode === 'Stopwatch') return prev + 1;
          if (prev <= 1) { setIsRunning(false); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, mode]);

  const changeMode = useCallback((m) => {
    setMode(prevMode => {
      if (prevMode === m) return prevMode;
      setIsRunning(false);
      if (m === 'Pomodoro') {
        const t = pomoType === 'Focus' ? 1500 : pomoType === 'Short' ? 300 : 900;
        setTimeLeft(t); setTotalTime(t);
      } else if (m === 'Stopwatch') {
        setTimeLeft(0); setTotalTime(0);
      } else {
        const { h, m:mm, s } = countdownInput;
        const t = h*3600 + mm*60 + s;
        setTimeLeft(t); setTotalTime(t);
      }
      return m;
    });
  }, [pomoType, countdownInput]);

  const changePomoType = useCallback((t) => {
    setPomoType(prev => {
      if (prev === t) return prev;
      setIsRunning(false);
      const nt = t === 'Focus' ? 1500 : t === 'Short' ? 300 : 900;
      setTimeLeft(nt); setTotalTime(nt);
      return t;
    });
  }, []);

  const changeCountdownInput = useCallback((h, m, s) => {
    setCountdownInput({ h, m, s });
    setMode(currentMode => {
      if (currentMode === 'Countdown' && !isRunning) {
        const nt = h*3600 + m*60 + s;
        setTimeLeft(nt); setTotalTime(nt);
      }
      return currentMode;
    });
  }, [isRunning]);

  const toggle = useCallback(() => {
    setTimeLeft(currentTimeLeft => {
      setMode(currentMode => {
        if (currentMode === 'Countdown' && currentTimeLeft === 0) return currentMode; // can't start at 0
        setIsRunning(r => !r);
        return currentMode;
      });
      return currentTimeLeft;
    });
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setMode(currentMode => {
      if (currentMode === 'Pomodoro') {
        setPomoType(pt => { setTimeLeft(pt==='Focus'?1500:pt==='Short'?300:900); return pt; });
      } else if (currentMode === 'Stopwatch') {
        setTimeLeft(0);
      } else {
        setTotalTime(tt => { setTimeLeft(tt); return tt; });
      }
      return currentMode;
    });
  }, []);

  const isDone = timeLeft === 0 && !isRunning && totalTime > 0 && mode !== 'Stopwatch';
  const progress = mode === 'Stopwatch' ? 0 : totalTime ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  // "Active" = worth showing the pill for — either running, or a countdown/
  // pomodoro that's been started and isn't back at its full reset value.
  const isActive = isRunning || (mode !== 'Countdown' ? timeLeft !== totalTime || isRunning : timeLeft > 0 && timeLeft < totalTime) || (mode==='Stopwatch' && timeLeft > 0);

  return {
    mode, pomoType, timeLeft, totalTime, isRunning, countdownInput, isDone, progress, isActive,
    changeMode, changePomoType, changeCountdownInput, toggle, reset,
  };
}
