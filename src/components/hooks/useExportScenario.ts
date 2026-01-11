import { useState } from "react";

interface UseExportScenarioResult {
  isExporting: boolean;
  error: string | null;
  exportScenario: (scenarioId: number, options?: ExportOptions) => Promise<void>;
}

interface ExportOptions {
  includeCharts?: boolean;
}

/**
 * Custom hook for exporting scenarios to Excel
 */
export function useExportScenario(companyId: string): UseExportScenarioResult {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportScenario = async (scenarioId: number, options?: ExportOptions): Promise<void> => {
    setIsExporting(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (options?.includeCharts !== undefined) {
        params.append("includeCharts", options.includeCharts ? "true" : "false");
      }

      const queryString = params.toString();
      const url = `/api/companies/${companyId}/scenarios/${scenarioId}/export${queryString ? `?${queryString}` : ""}`;

      // Fetch Excel file
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          throw new Error("Unauthorized");
        }

        if (response.status === 403) {
          throw new Error("Tylko zablokowane scenariusze mogą być eksportowane");
        }

        if (response.status === 404) {
          throw new Error("Scenariusz nie został znaleziony");
        }

        throw new Error("Nie udało się wyeksportować scenariusza");
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "scenario_export.xlsx";

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Download file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się wyeksportować scenariusza";
      setError(errorMessage);
      throw err;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    error,
    exportScenario,
  };
}
