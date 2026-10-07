import { useEffect, useState } from 'react';

/** Current timestamp that refreshes on an interval, for relative times like "5 min ago". */
export const useNow = (intervalMs = 30_000): number => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
};
