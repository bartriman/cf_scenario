import { useEffect } from "react";
import type { ScenarioListItemDTO } from "@/types";
import { useDashboard } from "@/components/hooks/useDashboard";
import Filters from "./Filters";
import FloatingActionButton from "./FloatingActionButton";
import CreateScenarioDialog from "./CreateScenarioDialog";
import DuplicateScenarioDialog from "./DuplicateScenarioDialog";
import ConfirmDialog from "./ConfirmDialog";
import ScenarioGridReact from "./ScenarioGridReact";

interface DashboardProps {
  initialScenarios: ScenarioListItemDTO[];
  companyId: string;
}

export default function Dashboard({ initialScenarios, companyId }: DashboardProps) {
  const {
    filteredScenarios,
    filters,
    loading,
    error,
    setStatusFilter,
    setSortOption,
    createScenario,
    duplicateScenario,
    lockScenario,
    deleteScenario,
    openCreateDialog,
    closeCreateDialog,
    openDuplicateDialog,
    closeDuplicateDialog,
    openConfirmDialog,
    closeConfirmDialog,
    createDialogOpen,
    duplicateDialogOpen,
    confirmDialogOpen,
    selectedScenario,
    confirmAction,
  } = useDashboard({
    initialScenarios,
    companyId,
  });

  // Obsługa custom events z ScenarioCardActions
  useEffect(() => {
    const handleDuplicate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const scenario = customEvent.detail.scenario as ScenarioListItemDTO;
      openDuplicateDialog(scenario);
    };

    const handleLock = (e: Event) => {
      const customEvent = e as CustomEvent;
      const scenario = customEvent.detail.scenario as ScenarioListItemDTO;
      openConfirmDialog(scenario, "lock");
    };

    const handleDelete = (e: Event) => {
      const customEvent = e as CustomEvent;
      const scenario = customEvent.detail.scenario as ScenarioListItemDTO;
      openConfirmDialog(scenario, "delete");
    };

    window.addEventListener("scenario:duplicate", handleDuplicate);
    window.addEventListener("scenario:lock", handleLock);
    window.addEventListener("scenario:delete", handleDelete);

    return () => {
      window.removeEventListener("scenario:duplicate", handleDuplicate);
      window.removeEventListener("scenario:lock", handleLock);
      window.removeEventListener("scenario:delete", handleDelete);
    };
  }, [openDuplicateDialog, openConfirmDialog]);

  // Funkcja obsługująca potwierdzenie akcji
  const handleConfirm = async () => {
    if (!selectedScenario) return;

    if (confirmAction === "lock") {
      await lockScenario(selectedScenario.id);
    } else if (confirmAction === "delete") {
      await deleteScenario(selectedScenario.id);
    }
  };

  // Przygotowanie danych dla dialogu potwierdzenia
  const getConfirmDialogProps = () => {
    if (confirmAction === "lock") {
      return {
        title: "Zablokować scenariusz?",
        description: `Czy na pewno chcesz zablokować scenariusz "${selectedScenario?.name}"? Po zablokowaniu nie będzie możliwa jego edycja.`,
        confirmLabel: "Zablokuj",
        variant: "default" as const,
      };
    } else if (confirmAction === "delete") {
      return {
        title: "Usunąć scenariusz?",
        description: `Czy na pewno chcesz usunąć scenariusz "${selectedScenario?.name}"? Ta operacja jest nieodwracalna.`,
        confirmLabel: "Usuń",
        variant: "destructive" as const,
      };
    }
    return {
      title: "",
      description: "",
      confirmLabel: "Potwierdź",
      variant: "default" as const,
    };
  };

  const confirmDialogProps = getConfirmDialogProps();

  return (
    <>
      {/* Filtry i sortowanie */}
      <Filters
        status={filters.status}
        sort={filters.sort}
        onStatusChange={setStatusFilter}
        onSortChange={setSortOption}
      />

      {/* Wyświetlanie błędów */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6" role="alert">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Wskaźnik ładowania */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Siatka scenariuszy */}
      {!loading && <ScenarioGridReact scenarios={filteredScenarios} />}

      {/* Floating Action Button */}
      <FloatingActionButton onCreateScenario={openCreateDialog} />

      {/* Dialogi */}
      <CreateScenarioDialog open={createDialogOpen} onOpenChange={closeCreateDialog} onSubmit={createScenario} />

      <DuplicateScenarioDialog
        open={duplicateDialogOpen}
        onOpenChange={closeDuplicateDialog}
        scenario={selectedScenario}
        onSubmit={duplicateScenario}
      />

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={closeConfirmDialog}
        title={confirmDialogProps.title}
        description={confirmDialogProps.description}
        confirmLabel={confirmDialogProps.confirmLabel}
        variant={confirmDialogProps.variant}
        onConfirm={handleConfirm}
        isLoading={loading}
      />
    </>
  );
}
