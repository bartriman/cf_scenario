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

      toast.success("Scenario exported", {
        description: "Excel file has been downloaded",
      });

      onOpenChange(false);
    } catch (error) {
      toast.error("Export error", {
        description: error instanceof Error ? error.message : "Failed to export scenario",
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
            Export scenario: {scenario.name}
          </DialogTitle>
          <DialogDescription>
            {isLocked
              ? "Download scenario data in Excel format (.xlsx)"
              : "Only locked scenarios can be exported"}
          </DialogDescription>
        </DialogHeader>

        {!isLocked ? (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              This scenario has <strong>Draft</strong> status. To export the scenario, first lock it
              using the <strong>Lock</strong> option in the actions menu.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Export contents</Label>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>
                      <strong>Weekly Summary</strong> - summary of inflows and outflows by week
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>
                      <strong>Transactions</strong> - complete list of transactions with details
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>
                      <strong>Running Balance</strong> - rolling balance day by day
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-md border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Tip:</strong> Export includes all modifications made to the scenario.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
                Cancel
              </Button>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <Download className="mr-2 h-4 w-4 animate-bounce" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Excel
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {!isLocked && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
