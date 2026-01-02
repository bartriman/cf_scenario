import { ProcessingSpinner } from "./ProcessingSpinner";
import { ValidationSummary } from "./ValidationSummary";
import { ValidationErrorTable } from "./ValidationErrorTable";
import type { ImportDetailsResponseDTO } from "../../types";

interface ValidationStatusPanelProps {
  importDetails: ImportDetailsResponseDTO;
  companyId: string;
}

/**
 * Panel wyświetlający status przetwarzania importu.
 * Pokazuje spinner podczas przetwarzania, podsumowanie wyników po zakończeniu
 * oraz tabelę błędów jeśli wystąpiły problemy.
 */
export function ValidationStatusPanel({ importDetails, companyId }: ValidationStatusPanelProps) {
  const { status, invalid_rows, id } = importDetails;

  // Podczas przetwarzania pokazujemy spinner
  if (status === "pending" || status === "processing") {
    return <ProcessingSpinner />;
  }

  // Po zakończeniu pokazujemy podsumowanie i opcjonalnie błędy
  if (status === "completed" || status === "failed") {
    return (
      <div className="space-y-6">
        {/* Podsumowanie wyników */}
        <ValidationSummary importDetails={importDetails} />

        {/* Tabela błędów - tylko jeśli są błędy */}
        {invalid_rows > 0 && <ValidationErrorTable importId={id} companyId={companyId} />}
      </div>
    );
  }

  // Domyślnie nic nie pokazujemy (nie powinno się zdarzyć)
  return null;
}
