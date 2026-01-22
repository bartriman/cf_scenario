import { useState, useCallback } from "react";

export function useDialogState<T = void>() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((item?: T) => {
    if (item !== undefined) {
      setData(item as T);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Delay clearing data for exit animation
    setTimeout(() => setData(null), 300);
  }, []);

  return { isOpen, data, open, close };
}
