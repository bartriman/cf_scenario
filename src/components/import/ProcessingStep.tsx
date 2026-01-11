import { useEffect, useState } from "react";

interface ProcessingStepProps {
  importId: number;
  companyId: string;
  onComplete: (scenarioId: number) => void;
  onError: (error: string) => void;
}

export function ProcessingStep({ importId, companyId, onComplete, onError }: ProcessingStepProps) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Inicjalizacja importu...");
  const [scenarioId, setScenarioId] = useState<number | null>(null);

  useEffect(() => {
    let polling = true;

    const pollImportStatus = async () => {
      try {
        const response = await fetch(`/api/companies/${companyId}/imports/${importId}/status`);

        if (!response.ok) {
          throw new Error("Failed to fetch import status");
        }

        const data = await response.json();

        // Update progress based on status
        if (data.status === "pending") {
          setProgress(10);
          setMessage("Oczekiwanie na przetwarzanie...");
        } else if (data.status === "processing") {
          setProgress(data.progress || 50);
          setMessage("Przetwarzanie danych CSV...");
        } else if (data.status === "completed") {
          setProgress(100);
          setMessage("Import zakończony pomyślnie!");

          // Find scenario ID from response (if created automatically)
          // Note: The endpoint returns scenario_id in the POST response, not GET status
          // So we check if we already have it from the initial POST
          if (scenarioId) {
            polling = false;
            setTimeout(() => {
              onComplete(scenarioId);
            }, 1000);
          } else {
            // If no scenario was created, still mark as complete
            polling = false;
            setTimeout(() => {
              onComplete(0); // 0 indicates no scenario created
            }, 1000);
          }
        } else if (data.status === "failed") {
          setProgress(100);
          setMessage("Import zakończony z błędami");
          polling = false;
          onError(
            data.error_report_json
              ? `Import failed: ${data.invalid_rows} invalid rows`
              : "Import processing failed"
          );
        }
      } catch (error) {
        console.error("Error polling import status:", error);
        polling = false;
        onError(error instanceof Error ? error.message : "Unknown error occurred");
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(() => {
      if (polling) {
        pollImportStatus();
      } else {
        clearInterval(interval);
      }
    }, 2000);

    // Initial poll
    pollImportStatus();

    return () => {
      polling = false;
      clearInterval(interval);
    };
  }, [importId, companyId, onComplete, onError, scenarioId]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Przetwarzanie importu</h2>
        <p className="text-muted-foreground">Proszę czekać, trwa importowanie danych do systemu...</p>
      </div>

      {/* Progress indicator */}
      <div className="max-w-md mx-auto space-y-4">
        {/* Spinner */}
        <div className="flex justify-center">
          <svg
            className="animate-spin h-16 w-16 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{message}</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Status message */}
        <p className="text-center text-sm text-muted-foreground">
          Import ID: <span className="font-mono">{importId}</span>
        </p>
      </div>

      {/* Information */}
      <div className="max-w-md mx-auto p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Uwaga:</strong> Nie zamykaj tej strony podczas przetwarzania. Zostaniesz automatycznie przekierowany
          po zakończeniu.
        </p>
      </div>
    </div>
  );
}
