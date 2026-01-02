import type { ApiError } from "@/types";

/**
 * Helper funkcja do wykonywania zapytań API z obsługą błędów
 * @param url - URL endpoint API
 * @param options - Opcje fetch (method, headers, body itp.)
 * @returns Sparsowana odpowiedź JSON typu T
 * @throws ApiError w przypadku błędu HTTP lub błędu parsowania
 */
export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let error: ApiError;
    try {
      const errorData = await response.json();
      error = {
        message: errorData.error?.message || errorData.message || "Wystąpił błąd serwera",
        code: errorData.error?.code || errorData.code,
        details: errorData.error?.details || errorData.details,
      };
    } catch {
      // Jeśli nie można sparsować JSON, zwróć ogólny błąd
      error = {
        message: `Błąd HTTP ${response.status}: ${response.statusText}`,
        code: response.status.toString(),
      };
    }
    throw error;
  }

  // Obsługa 204 No Content (np. dla DELETE)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Sprawdza czy błąd jest typu ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" && error !== null && "message" in error && typeof (error as ApiError).message === "string"
  );
}

/**
 * Formatuje błąd API do wyświetlenia użytkownikowi
 */
export function formatApiError(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Wystąpił nieoczekiwany błąd";
}
