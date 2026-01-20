import { useState, useCallback } from "react";
import type {
  ScenarioListItemDTO,
  ScenarioListResponseDTO,
  CreateScenarioRequestDTO,
  CreateScenarioResponseDTO,
  DuplicateScenarioResponseDTO,
  ScenarioListFilters,
} from "@/types";

interface UseScenariosResult {
  scenarios: ScenarioListItemDTO[];
  isLoading: boolean;
  error: string | null;
  fetchScenarios: (filters?: Partial<ScenarioListFilters>) => Promise<void>;
  createScenario: (data: CreateScenarioRequestDTO) => Promise<CreateScenarioResponseDTO>;
  duplicateScenario: (scenarioId: number, name: string) => Promise<DuplicateScenarioResponseDTO>;
  lockScenario: (scenarioId: number) => Promise<void>;
  deleteScenario: (scenarioId: number) => Promise<void>;
}

function buildQueryParams(filters?: Partial<ScenarioListFilters>): string {
  if (!filters) return "";

  const params = new URLSearchParams();

  if (filters.status && filters.status !== "all") {
    params.append("status", filters.status);
  }

  return params.toString();
}

export function useScenarios(companyId: string): UseScenariosResult {
  const [scenarios, setScenarios] = useState<ScenarioListItemDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScenarios = useCallback(
    async (filters?: Partial<ScenarioListFilters>) => {
      setIsLoading(true);
      setError(null);

      try {
        const queryString = buildQueryParams(filters);
        const url = `/api/companies/${companyId}/scenarios${queryString ? `?${queryString}` : ""}`;

        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
            return;
          }
          throw new Error("Failed to fetch scenarios");
        }

        const data: ScenarioListResponseDTO = await response.json();
        setScenarios(data.scenarios);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load scenarios";
        setError(errorMessage);
        console.error("[useScenarios] fetchScenarios error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [companyId]
  );

  const createScenario = useCallback(
    async (data: CreateScenarioRequestDTO): Promise<CreateScenarioResponseDTO> => {
      const response = await fetch(`/api/companies/${companyId}/scenarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          throw new Error("Unauthorized");
        }

        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to create scenario");
      }

      const newScenario: CreateScenarioResponseDTO = await response.json();

      // Optimistic update - dodaj nowy scenariusz do listy
      setScenarios((prev) => [...prev, newScenario as ScenarioListItemDTO]);

      return newScenario;
    },
    [companyId]
  );

  const duplicateScenario = useCallback(
    async (scenarioId: number, name: string): Promise<DuplicateScenarioResponseDTO> => {
      const response = await fetch(`/api/companies/${companyId}/scenarios/${scenarioId}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          throw new Error("Unauthorized");
        }

        if (response.status === 404) {
          throw new Error("Source scenario does not exist");
        }

        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to duplicate scenario");
      }

      const duplicated: DuplicateScenarioResponseDTO = await response.json();

      // Optimistic update - dodaj zduplikowany scenariusz do listy
      setScenarios((prev) => [
        ...prev,
        {
          ...duplicated,
          locked_at: null,
          locked_by: null,
        } as ScenarioListItemDTO,
      ]);

      return duplicated;
    },
    [companyId]
  );

  const lockScenario = useCallback(
    async (scenarioId: number): Promise<void> => {
      const response = await fetch(`/api/companies/${companyId}/scenarios/${scenarioId}/lock`, {
        method: "POST",
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          throw new Error("Unauthorized");
        }

        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to lock scenario");
      }

      // Odśwież listę po zablokowaniu
      await fetchScenarios();
    },
    [companyId, fetchScenarios]
  );

  const deleteScenario = useCallback(
    async (scenarioId: number): Promise<void> => {
      const response = await fetch(`/api/companies/${companyId}/scenarios/${scenarioId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          throw new Error("Unauthorized");
        }

        if (response.status === 409) {
          throw new Error("Cannot delete a scenario that has derived scenarios");
        }

        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to delete scenario");
      }

      // Optimistic update - usuń scenariusz z listy
      setScenarios((prev) => prev.filter((s) => s.id !== scenarioId));
    },
    [companyId]
  );

  return {
    scenarios,
    isLoading,
    error,
    fetchScenarios,
    createScenario,
    duplicateScenario,
    lockScenario,
    deleteScenario,
  };
}
