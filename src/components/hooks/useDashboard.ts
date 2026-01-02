import { useState, useMemo, useCallback } from "react";
import type {
  ScenarioListItemDTO,
  ScenarioStatusType,
  SortOption,
  FiltersState,
  CreateScenarioRequestDTO,
  CreateScenarioResponseDTO,
  DuplicateScenarioResponseDTO,
  LockScenarioResponseDTO,
} from "@/types";
import { apiRequest, formatApiError } from "@/lib/api-client";

interface DashboardState {
  scenarios: ScenarioListItemDTO[];
  filters: FiltersState;
  loading: boolean;
  error: string | null;

  // Stany modali
  createDialogOpen: boolean;
  duplicateDialogOpen: boolean;
  confirmDialogOpen: boolean;

  // Scenariusz obecnie przetwarzany (dla modali)
  selectedScenario: ScenarioListItemDTO | null;

  // Typ akcji do potwierdzenia
  confirmAction: "lock" | "delete" | null;
}

interface UseDashboardProps {
  initialScenarios: ScenarioListItemDTO[];
  initialFilters?: Partial<FiltersState>;
  companyId: string;
}

export function useDashboard({ initialScenarios, initialFilters, companyId }: UseDashboardProps) {
  const [state, setState] = useState<DashboardState>({
    scenarios: initialScenarios,
    filters: {
      status: initialFilters?.status || null,
      sort: initialFilters?.sort || ("created_at_desc" as SortOption),
    },
    loading: false,
    error: null,
    createDialogOpen: false,
    duplicateDialogOpen: false,
    confirmDialogOpen: false,
    selectedScenario: null,
    confirmAction: null,
  });

  // Filtrowanie i sortowanie scenariuszy
  const filteredScenarios = useMemo(() => {
    let result = [...state.scenarios];

    // Filtrowanie po statusie
    if (state.filters.status) {
      result = result.filter((s) => s.status === state.filters.status);
    }

    // Sortowanie
    result.sort((a, b) => {
      switch (state.filters.sort) {
        case "created_at_desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "created_at_asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return result;
  }, [state.scenarios, state.filters]);

  // Akcje filtrowania
  const setStatusFilter = useCallback((status: ScenarioStatusType | null) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, status },
    }));
  }, []);

  const setSortOption = useCallback((sort: SortOption) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, sort },
    }));
  }, []);

  // Zarządzanie modalami
  const openCreateDialog = useCallback(() => {
    setState((prev) => ({ ...prev, createDialogOpen: true }));
  }, []);

  const closeCreateDialog = useCallback(() => {
    setState((prev) => ({ ...prev, createDialogOpen: false }));
  }, []);

  const openDuplicateDialog = useCallback((scenario: ScenarioListItemDTO) => {
    setState((prev) => ({
      ...prev,
      duplicateDialogOpen: true,
      selectedScenario: scenario,
    }));
  }, []);

  const closeDuplicateDialog = useCallback(() => {
    setState((prev) => ({
      ...prev,
      duplicateDialogOpen: false,
      selectedScenario: null,
    }));
  }, []);

  const openConfirmDialog = useCallback((scenario: ScenarioListItemDTO, action: "lock" | "delete") => {
    setState((prev) => ({
      ...prev,
      confirmDialogOpen: true,
      selectedScenario: scenario,
      confirmAction: action,
    }));
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setState((prev) => ({
      ...prev,
      confirmDialogOpen: false,
      selectedScenario: null,
      confirmAction: null,
    }));
  }, []);

  // Akcje scenariuszy
  const createScenario = useCallback(
    async (data: CreateScenarioRequestDTO): Promise<void> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiRequest<CreateScenarioResponseDTO>(`/api/companies/${companyId}/scenarios`, {
          method: "POST",
          body: JSON.stringify(data),
        });

        // Przekierowanie do nowego scenariusza
        window.location.href = `/scenarios/${response.id}`;
      } catch (err) {
        const errorMessage = formatApiError(err);
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw err;
      }
    },
    [companyId]
  );

  const duplicateScenario = useCallback(
    async (scenarioId: number, name: string): Promise<void> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiRequest<DuplicateScenarioResponseDTO>(
          `/api/companies/${companyId}/scenarios/${scenarioId}/duplicate`,
          {
            method: "POST",
            body: JSON.stringify({ name }),
          }
        );

        // Dodanie nowego scenariusza do listy (optimistic update)
        // Mapujemy response do ScenarioListItemDTO
        const newScenario: ScenarioListItemDTO = {
          id: response.id,
          company_id: response.company_id,
          import_id: response.import_id,
          dataset_code: response.dataset_code,
          name: response.name,
          status: response.status,
          base_scenario_id: response.base_scenario_id,
          start_date: response.start_date,
          end_date: response.end_date,
          locked_at: null,
          locked_by: null,
          created_at: response.created_at,
        };

        setState((prev) => ({
          ...prev,
          scenarios: [newScenario, ...prev.scenarios],
          loading: false,
          duplicateDialogOpen: false,
          selectedScenario: null,
        }));

        // Opcjonalnie: przekierowanie do nowego scenariusza
        // window.location.href = `/scenarios/${response.id}`;
      } catch (err) {
        const errorMessage = formatApiError(err);
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw err;
      }
    },
    [companyId]
  );

  const lockScenario = useCallback(
    async (scenarioId: number): Promise<void> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await apiRequest<LockScenarioResponseDTO>(
          `/api/companies/${companyId}/scenarios/${scenarioId}/lock`,
          {
            method: "POST",
          }
        );

        // Aktualizacja scenariusza w liście
        setState((prev) => ({
          ...prev,
          scenarios: prev.scenarios.map((s) =>
            s.id === scenarioId
              ? {
                  ...s,
                  status: response.status as ScenarioStatusType,
                  locked_at: response.locked_at,
                  locked_by: response.locked_by,
                }
              : s
          ),
          loading: false,
          confirmDialogOpen: false,
          selectedScenario: null,
          confirmAction: null,
        }));
      } catch (err) {
        const errorMessage = formatApiError(err);
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw err;
      }
    },
    [companyId]
  );

  const deleteScenario = useCallback(
    async (scenarioId: number): Promise<void> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        await apiRequest<undefined>(`/api/companies/${companyId}/scenarios/${scenarioId}`, {
          method: "DELETE",
        });

        // Usunięcie scenariusza z listy
        setState((prev) => ({
          ...prev,
          scenarios: prev.scenarios.filter((s) => s.id !== scenarioId),
          loading: false,
          confirmDialogOpen: false,
          selectedScenario: null,
          confirmAction: null,
        }));
      } catch (err) {
        const errorMessage = formatApiError(err);
        setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
        throw err;
      }
    },
    [companyId]
  );

  return {
    // Stan
    scenarios: state.scenarios,
    filteredScenarios,
    filters: state.filters,
    loading: state.loading,
    error: state.error,

    // Akcje filtrowania
    setStatusFilter,
    setSortOption,

    // Akcje scenariuszy
    createScenario,
    duplicateScenario,
    lockScenario,
    deleteScenario,

    // Zarządzanie modalami
    openCreateDialog,
    closeCreateDialog,
    openDuplicateDialog,
    closeDuplicateDialog,
    openConfirmDialog,
    closeConfirmDialog,

    // Stan modali
    createDialogOpen: state.createDialogOpen,
    duplicateDialogOpen: state.duplicateDialogOpen,
    confirmDialogOpen: state.confirmDialogOpen,
    selectedScenario: state.selectedScenario,
    confirmAction: state.confirmAction,
  };
}
