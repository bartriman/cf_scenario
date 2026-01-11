import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useExportScenario } from "@/components/hooks/useExportScenario";
import { Download, FileSpreadsheet } from "lucide-react";
import type { ScenarioListItemDTO } from "@/types";

interface ExportDialogProps {
  companyId: string;
  scenario: ScenarioListItemDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ companyId, scenario, open, onOpenChange }: ExportDialogProps) {
  const { isExporting, exportScenario } = useExportScenario(companyId);

  const handleExport = async () => {
    if (!scenario) return;

    try {
      await exportScenario(scenario.id, { includeCharts: true });

      toast.success("Scenariusz wyeksportowany", {
        description: "Plik Excel został pobrany",
      });

      onOpenChange(false);
    } catch (error) {
      toast.error("Błąd eksportu", {
        description: error instanceof Error ? error.message : "Nie udało się wyeksportować scenariusza",
      });
    }
  };

  if (!scenario) return null;

  // Only allow export for Locked scenarios
  const isLocked = scenario.status === "Locked";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Eksportuj scenariusz: {scenario.name}
          </DialogTitle>
          <DialogDescription>
            {isLocked
              ? "Pobierz dane scenariusza w formacie Excel (.xlsx)"
              : "Tylko zablokowane scenariusze mogą być eksportowane"}
          </DialogDescription>
        </DialogHeader>

        {!isLocked ? (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              Ten scenariusz ma status <strong>Draft</strong>. Aby wyeksportować scenariusz, najpierw zablokuj go
              używając opcji <strong>Lock</strong> w menu akcji.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Zawartość eksportu</Label>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>
                      <strong>Weekly Summary</strong> - podsumowanie wpływów i wypływów na tygodnie
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>
                      <strong>Transactions</strong> - pełna lista transakcji z detalami
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>
                      <strong>Running Balance</strong> - saldo kroczące dzień po dniu
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-md border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Wskazówka:</strong> Eksport uwzględnia wszystkie modyfikacje wprowadzone w scenariuszu.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
                Anuluj
              </Button>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <Download className="mr-2 h-4 w-4 animate-bounce" />
                    Eksportowanie...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Pobierz Excel
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {!isLocked && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Zamknij
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
