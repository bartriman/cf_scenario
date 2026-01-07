import { Button } from "@/components/ui/button";
import type { ValidationError } from "@/types";

interface DownloadErrorReportButtonProps {
  errors: ValidationError[];
  fileName?: string;
}

export function DownloadErrorReportButton({ errors, fileName = "import-errors.csv" }: DownloadErrorReportButtonProps) {
  const handleDownload = () => {
    try {
      // Generowanie CSV z błędami
      const headers = ["Nr wiersza", "Kolumna", "Wartość", "Komunikat błędu", "Kod błędu"];
      const rows = errors.map((error) => [
        error.row_number || 'N/A',
        error.field_name || 'Unknown',
        `"${(error.invalid_value || '').replace(/"/g, '""')}"`, // Escapowanie cudzysłowów
        `"${(error.error_message || 'Nieznany błąd').replace(/"/g, '""')}"`,
        error.error_code || "",
      ]);

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

      // Tworzenie blob i pobieranie pliku
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Błąd podczas generowania raportu CSV:', error);
      alert('Nie udało się wygenerować raportu błędów. Spróbuj ponownie.');
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={errors.length === 0}
      aria-label={`Pobierz raport błędów w formacie CSV (${errors.length} błędów)`}
    >
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Pobierz raport błędów (CSV)
    </Button>
  );
}
