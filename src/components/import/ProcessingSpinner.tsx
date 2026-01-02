import { Loader2 } from "lucide-react";

/**
 * Prosty komponent wizualny pokazujący animowany spinner z komunikatem o przetwarzaniu.
 * Używany podczas przetwarzania importu CSV.
 */
export function ProcessingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-12 h-12 text-primary animate-spin" aria-hidden="true" />
      <p className="mt-4 text-lg font-medium text-foreground">Przetwarzanie pliku CSV...</p>
      <p className="mt-2 text-sm text-muted-foreground">
        To może potrwać kilka chwil. Nie zamykaj tej strony.
      </p>
    </div>
  );
}
