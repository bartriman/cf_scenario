import { useState, useEffect, useMemo, useCallback } from "react";
import { useScenarios } from "@/components/hooks/useScenarios";
import { ScenarioListHeader } from "./ScenarioListHeader";
import { ScenarioGrid } from "./ScenarioGrid";
import { CreateScenarioDialog } from "./CreateScenarioDialog";
import { DuplicateScenarioDialog } from "./DuplicateScenarioDialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ScenarioListItemDTO, ScenarioFilterStatus } from "@/types";

interface ScenarioListContainerProps {
  companyId: string;
  initialScenarios?: ScenarioListItemDTO[];
}

export function ScenarioListContainer({ companyId, initialScenarios = [] }: ScenarioListContainerProps) {
  // Hook do zarządzania scenariuszami
  const { scenarios, isLoading, error, fetchScenarios, lockScenario, deleteScenario } = useScenarios(companyId);

  // Stany filtrów
  const [statusFilter, setStatusFilter] = useState<ScenarioFilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Stany dialogów
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [scenarioToDuplicate, setScenarioToDuplicate] = useState<ScenarioListItemDTO | null>(null);

  // Initial fetch
  useEffect(() => {
    // Jeśli mamy initial scenarios (SSR), użyj ich
    if (initialScenarios.length === 0) {
      fetchScenarios();
    }
  }, [fetchScenarios, initialScenarios.length]);

  // Filtrowanie scenariuszy (client-side)
  const filteredScenarios = useMemo(() => {
    let filtered = scenarios.length > 0 ? scenarios : initialScenarios;

    // Filtrowanie po statusie
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Filtrowanie po zapytaniu wyszukiwania
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.dataset_code.toLowerCase().includes(query) ||
          s.id.toString().includes(query)
      );
    }

    return filtered;
  }, [scenarios, initialScenarios, statusFilter, searchQuery]);

  // Handler dla kliknięcia karty scenariusza - nawigacja
  const handleScenarioClick = useCallback((scenarioId: number) => {
    window.location.href = `/scenarios/${scenarioId}`;
  }, []);

  // Handler dla duplikacji
  const handleDuplicateClick = useCallback((scenario: ScenarioListItemDTO) => {
    setScenarioToDuplicate(scenario);
    setDuplicateDialogOpen(true);
  }, []);

  // Handler po pomyślnym utworzeniu scenariusza
  const handleCreateSuccess = useCallback(() => {
    // Odśwież listę
    fetchScenarios();
    // Opcjonalnie: automatyczne przekierowanie do nowego scenariusza
    // window.location.href = `/scenarios/${scenario.id}`;
  }, [fetchScenarios]);

  // Handler po pomyślnej duplikacji
  const handleDuplicateSuccess = useCallback(() => {
    // Odśwież listę
    fetchScenarios();
    // Opcjonalnie: automatyczne przekierowanie
    // window.location.href = `/scenarios/${scenario.id}`;
  }, [fetchScenarios]);

  // Handler dla blokowania scenariusza
  const handleLockClick = useCallback(
    async (scenarioId: number) => {
      const scenario = filteredScenarios.find((s) => s.id === scenarioId);
      if (!scenario) return;

      // Potwierdzenie
      const confirmed = window.confirm(
        `Czy na pewno chcesz zablokować scenariusz "${scenario.name}"?\n\nPo zablokowaniu nie będzie można go edytować.`
      );

      if (!confirmed) return;

      try {
        await lockScenario(scenarioId);
        toast.success("Scenariusz zablokowany", {
          description: "Scenariusz został pomyślnie zablokowany",
        });
      } catch (error) {
        toast.error("Błąd", {
          description: error instanceof Error ? error.message : "Nie udało się zablokować scenariusza",
        });
      }
    },
    [filteredScenarios, lockScenario]
  );

  // Handler dla usuwania scenariusza
  const handleDeleteClick = useCallback(
    async (scenarioId: number) => {
      const scenario = filteredScenarios.find((s) => s.id === scenarioId);
      if (!scenario) return;

      // Potwierdzenie
      const confirmed = window.confirm(
        `Czy na pewno chcesz usunąć scenariusz "${scenario.name}"?\n\nTa operacja jest nieodwracalna.`
      );

      if (!confirmed) return;

      try {
        await deleteScenario(scenarioId);
        toast.success("Scenariusz usunięty", {
          description: "Scenariusz został pomyślnie usunięty",
        });
      } catch (error) {
        // Błąd 409 - scenariusz ma potomków
        if (error instanceof Error && error.message.includes("pochodne")) {
          toast.error("Nie można usunąć scenariusza", {
            description: "Scenariusz ma scenariusze pochodne. Usuń najpierw scenariusze zależne.",
          });
        } else {
          toast.error("Błąd", {
            description: error instanceof Error ? error.message : "Nie udało się usunąć scenariusza",
          });
        }
      }
    },
    [filteredScenarios, deleteScenario]
  );

  // Handler zmiany filtra
  const handleFilterChange = useCallback((status: ScenarioFilterStatus) => {
    setStatusFilter(status);
  }, []);

  // Handler zmiany wyszukiwania (debouncing można dodać później)
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Obsługa błędu ładowania
  if (error && scenarios.length === 0 && initialScenarios.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="rounded-full bg-destructive/10 p-6 mb-6">
            <svg className="h-12 w-12 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Nie udało się załadować scenariuszy</h3>
          <p className="text-muted-foreground text-center mb-8 max-w-md">{error}</p>
          <Button onClick={() => fetchScenarios()}>Spróbuj ponownie</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ScenarioListHeader
        onCreateClick={() => setCreateDialogOpen(true)}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
      />

      <ScenarioGrid
        scenarios={filteredScenarios}
        isLoading={isLoading && scenarios.length === 0 && initialScenarios.length === 0}
        onScenarioClick={handleScenarioClick}
        onDuplicateClick={handleDuplicateClick}
        onLockClick={handleLockClick}
        onDeleteClick={handleDeleteClick}
        onCreateClick={() => setCreateDialogOpen(true)}
      />

      <CreateScenarioDialog
        companyId={companyId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <DuplicateScenarioDialog
        companyId={companyId}
        sourceScenario={scenarioToDuplicate}
        open={duplicateDialogOpen}
        onOpenChange={(open) => {
          setDuplicateDialogOpen(open);
          if (!open) setScenarioToDuplicate(null);
        }}
        onSuccess={handleDuplicateSuccess}
      />
    </div>
  );
}
