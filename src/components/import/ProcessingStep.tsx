import { useEffect, useState } from "react";

interface ProcessingStepProps {
  importId: number;
  onComplete: (scenarioId: number) => void;
  onError: (error: string) => void;
}

export function ProcessingStep({ importId, onComplete, onError }: ProcessingStepProps) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("Inicjalizacja importu...");

  useEffect(() => {
    // Symulacja postępu (w przyszłości będzie to polling do API)
    const steps = [
      { progress: 10, message: "Sprawdzanie pliku...", delay: 500 },
      { progress: 30, message: "Parsowanie danych CSV...", delay: 1000 },
      { progress: 50, message: "Walidacja transakcji...", delay: 1500 },
      { progress: 70, message: "Importowanie danych...", delay: 2000 },
      { progress: 90, message: "Tworzenie scenariusza bazowego...", delay: 2500 },
      { progress: 100, message: "Import zakończony!", delay: 3000 },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setProgress(step.progress);
        setMessage(step.message);
        currentStep++;

        if (step.progress === 100) {
          clearInterval(interval);
          // Symulacja utworzenia scenariusza (w przyszłości z API)
          setTimeout(() => {
            onComplete(1); // Placeholder scenario ID
          }, 1000);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [importId, onComplete, onError]);

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
