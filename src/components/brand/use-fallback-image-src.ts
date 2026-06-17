import { useCallback, useState } from "react";

/**
 * Tries `candidates[0]`, `candidates[1]`, … on `onError` until exhausted, then `null` (hide image).
 */
export function useFallbackImageSrc(candidates: readonly string[]) {
  const [index, setIndex] = useState(0);
  const src = index < candidates.length ? candidates[index]! : null;
  const onError = useCallback(() => {
    setIndex((i) => i + 1);
  }, []);
  const exhausted = index >= candidates.length;
  return { src, onError, exhausted, tryAgain: () => setIndex(0) };
}
