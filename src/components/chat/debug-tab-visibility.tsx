'use client';

import { useEffect, useState } from 'react';

export function DebugTabVisibility() {
  const [visibilityState, setVisibilityState] = useState<string>('visible');
  const [eventCount, setEventCount] = useState(0);
  const [lastEvent, setLastEvent] = useState<string>('');

  useEffect(() => {
    const handleVisibilityChange = () => {
      const state = document.visibilityState;
      setVisibilityState(state);
      setEventCount(prev => prev + 1);
      setLastEvent(`${new Date().toLocaleTimeString()}: ${state}`);
      console.debug('Tab visibility changed:', state);
    };

    const handleFocus = () => {
      setLastEvent(`${new Date().toLocaleTimeString()}: focus`);
      console.debug('Window focused');
    };

    const handleBlur = () => {
      setLastEvent(`${new Date().toLocaleTimeString()}: blur`);
      console.debug('Window blurred');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-4 rounded bg-black/80 p-2 text-xs text-white">
      <div>Visibility: {visibilityState}</div>
      <div>Events: {eventCount}</div>
      <div>Last: {lastEvent}</div>
    </div>
  );
}
