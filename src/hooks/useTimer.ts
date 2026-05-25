import { useState, useEffect, useRef } from 'react';

export function useTimer() {
  const [elapsed, setElapsed] = useState(0); // tenths of a second
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      const start = Date.now() - elapsed * 100;
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 100));
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const reset = () => { setIsRunning(false); setElapsed(0); };

  const seconds = Math.floor(elapsed / 10);
  const tenths = elapsed % 10;
  const display = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}.${tenths}`;

  return { elapsed, seconds, display, isRunning, start, pause, reset };
}
