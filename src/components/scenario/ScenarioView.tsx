import { useState } from "react";
import { useScenarioData } from "@/components/hooks/useScenarioData";
import { Timeline } from "./Timeline.tsx";
import { RunningBalanceChart } from "./RunningBalanceChart.tsx";
import { EditTransactionModal } from "./EditTransactionModal.tsx";
import { ExportDialog } from "./ExportDialog.tsx";
import type { TransactionVM, UpsertOverrideRequestDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Download } from "lucide-react";

interface ScenarioViewProps {
  scenarioId?: string;
  companyId?: string;
  baseCurrency: string;
}

export default function ScenarioView({ scenarioId, companyId, baseCurrency }: ScenarioViewProps) {
  const { scenario, weeklyAggregates, runningBalance, isLoading, error, refetch, updateTransaction, moveTransaction, isDemoMode } =
    useScenarioData(scenarioId, companyId);

  const [selectedTransaction, setSelectedTransaction] = useState<TransactionVM | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Handle transaction click - open edit modal
  const handleTransactionClick = (transaction: TransactionVM) => {
    // Don't open modal for "Other" type
    if (transaction.type === "other") return;

    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  // Handle transaction drop - move to new week
  const handleTransactionDrop = async (flowId: string, newWeekStartDate: string) => {
    try {
      await moveTransaction(flowId, newWeekStartDate);
    } catch {
      // Toast notification would be added here
    }
  };

  // Handle save from edit modal
  const handleSaveTransaction = async (flowId: string, data: UpsertOverrideRequestDTO) => {
    try {
      await updateTransaction(flowId, data);
      setIsModalOpen(false);
      setSelectedTransaction(null);
    } catch {
      // Toast notification would be added here
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Loading scenario data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-lg font-semibold">Failed to load scenario</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={refetch} className="mt-4" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // No data state
  if (!scenario || weeklyAggregates.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No data available for this scenario.</p>
        </div>
      </div>
    );
  }

  const isLocked = scenario.status === "Locked";

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="border-b bg-background px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{scenario.name}</h1>
            {!isDemoMode && scenario.start_date && scenario.end_date && (
              <p className="text-sm text-muted-foreground">
                {scenario.start_date} - {scenario.end_date}
              </p>
            )}
            {isDemoMode && (
              <p className="text-sm text-muted-foreground">
                Tryb demonstracyjny - wszystkie zmiany zapisywane lokalnie
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isDemoMode && isLocked && <span className="rounded-md bg-muted px-3 py-1 text-sm font-medium">Locked</span>}
            {!isDemoMode && isLocked && (
              <Button onClick={() => setIsExportDialogOpen(true)} variant="default" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col">
        {/* Running Balance Chart */}
        <div className="border-b bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Running Balance</h2>
          <RunningBalanceChart data={runningBalance} baseCurrency={baseCurrency} />
        </div>

        {/* Timeline */}
        <div className="bg-muted/30">
          <div className="p-6 pb-2">
            <h2 className="text-lg font-semibold">Weekly Cash Flow</h2>
          </div>
          <Timeline
            weeklyAggregates={weeklyAggregates}
            onTransactionDrop={handleTransactionDrop}
            onTransactionClick={handleTransactionClick}
            isLocked={!isDemoMode && isLocked}
          />
        </div>
      </div>

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={isModalOpen}
        transaction={selectedTransaction}
        onSave={handleSaveTransaction}
        onClose={handleCloseModal}
        isLocked={!isDemoMode && isLocked}
      />

      {/* Export Dialog */}
      {!isDemoMode && companyId && (
        <ExportDialog
          companyId={companyId}
          scenario={scenario}
          open={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
        />
      )}
    </div>
  );
}
