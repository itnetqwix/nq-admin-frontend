import { useEffect, useState } from 'react'

/** `value`, but only after it has stopped changing for `delayMs`. */
export default function useDebouncedValue(value, delayMs = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}
