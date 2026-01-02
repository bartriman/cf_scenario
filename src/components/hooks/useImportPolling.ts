import { useEffect, useRef, useCallback } from "react";
import type { ImportDetailsResponseDTO } from "../../types";

interface UseImportPollingParams {
  companyId: string;
  importId: number | null;
  enabled: boolean;
  onUpdate: (details: ImportDetailsResponseDTO) => void;
  onComplete: () => void;
}

interface UseImportPollingReturn {
  isPolling: boolean;
  error: string | null;
}

/**
 * Hook odpowiedzialny za polling statusu importu co 2-3 sekundy.
 * Automatycznie zatrzymuje się gdy status !== 'pending' && status !== 'processing'.
 */
export function useImportPolling({
  companyId,
  importId,
  enabled,
  onUpdate,
  onComplete,
}: UseImportPollingParams): UseImportPollingReturn {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const errorRef = useRef<string | null>(null);

  const POLLING_INTERVAL = 2500; // 2.5 sekundy

  /**
   * Funkcja pobierająca status importu
   */
  const fetchImportStatus = useCallback(async () => {
    if (!importId) return;

    try {
      const response = await fetch(`/api/companies/${companyId}/imports/${importId}`);

      if (!response.ok) {
        throw new Error("Nie udało się pobrać statusu importu");
      }

      const data: ImportDetailsResponseDTO = await response.json();

      // Aktualizacja danych przez callback
      onUpdate(data);

      // Sprawdzenie czy import się zakończył
      if (data.status === "completed" || data.status === "failed") {
        // Zatrzymanie pollingu
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          isPollingRef.current = false;
        }

        // Wywołanie callback o zakończeniu
        onComplete();
      }

      errorRef.current = null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
      errorRef.current = errorMessage;
      console.error("Błąd podczas pollingu:", err);
    }
  }, [importId, companyId, onUpdate, onComplete]);

  /**
   * Uruchomienie pollingu
   */
  useEffect(() => {
    // Sprawdzenie czy polling powinien być aktywny
    if (!enabled || !importId) {
      // Czyszczenie interwału jeśli był aktywny
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        isPollingRef.current = false;
      }
      return;
    }

    // Pierwsze pobranie od razu
    fetchImportStatus();

    // Ustawienie interwału
    isPollingRef.current = true;
    intervalRef.current = setInterval(fetchImportStatus, POLLING_INTERVAL);

    // Cleanup przy unmount lub zmianie zależności
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        isPollingRef.current = false;
      }
    };
  }, [enabled, importId, fetchImportStatus]);

  return {
    isPolling: isPollingRef.current,
    error: errorRef.current,
  };
}
