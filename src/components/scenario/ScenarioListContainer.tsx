import { useState, useEffect, useMemo, useCallback } from "react";
import { useScenarios } from "@/components/hooks/useScenarios";
import { ScenarioListHeader } from "./ScenarioListHeader";
import { ScenarioGrid } from "./ScenarioGrid";
import { CreateScenarioDialog } from "./CreateScenarioDialog";
import { DuplicateScenarioDialog } from "./DuplicateScenarioDialog";
import { ExportDialog } from "./ExportDialog";
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
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [scenarioToDuplicate, setScenarioToDuplicate] = useState<ScenarioListItemDTO | null>(null);
  const [scenarioToExport, setScenarioToExport] = useState<ScenarioListItemDTO | null>(null);

  // Initial fetch
  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  // Filtrowanie scenariuszy (client-side)
  const filteredScenarios = useMemo(() => {
    let filtered = scenarios;

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

  // Handler dla eksportu
  const handleExportClick = useCallback((scenario: ScenarioListItemDTO) => {
    setScenarioToExport(scenario);
    setExportDialogOpen(true);
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

      // Confirmation
      const confirmed = window.confirm(
        `Are you sure you want to lock scenario "${scenario.name}"?\n\nOnce locked, it cannot be edited.`
      );

      if (!confirmed) return;

      try {
        await lockScenario(scenarioId);
        toast.success("Scenario locked", {
          description: "Scenario has been successfully locked",
        });
      } catch (error) {
        toast.error("Error", {
          description: error instanceof Error ? error.message : "Failed to lock scenario",
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

      // Confirmation
      const confirmed = window.confirm(
        `Are you sure you want to delete scenario "${scenario.name}"?\n\nThis operation is irreversible.`
      );

      if (!confirmed) return;

      try {
        await deleteScenario(scenarioId);
        toast.success("Scenario deleted", {
          description: "Scenario has been successfully deleted",
        });
      } catch (error) {
        // Error 409 - scenario has descendants
        if (error instanceof Error && error.message.includes("pochodne")) {
          toast.error("Cannot delete scenario", {
            description: "Scenario has derived scenarios. Delete dependent scenarios first.",
          });
        } else {
          toast.error("Error", {
            description: error instanceof Error ? error.message : "Failed to delete scenario",
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
          <h3 className="text-xl font-semibold mb-2">Failed to load scenarios</h3>
          <p className="text-muted-foreground text-center mb-8 max-w-md">{error}</p>
          <Button onClick={() => fetchScenarios()}>Try again</Button>
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
        onExportClick={handleExportClick}
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

      <ExportDialog
        companyId={companyId}
        scenario={scenarioToExport}
        open={exportDialogOpen}
        onOpenChange={(open) => {
          setExportDialogOpen(open);
          if (!open) setScenarioToExport(null);
        }}
      />
    </div>
  );
}
