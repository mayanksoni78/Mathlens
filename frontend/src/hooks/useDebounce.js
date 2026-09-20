import { useState, useEffect } from 'react';

/**
 * Hook to debounce rapid value updates (useful for fine-grained sliders).
 * @param {any} value 
 * @param {number} delay 
 * @returns {any}
 */
export function useDebounce(value, delay = 100) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
