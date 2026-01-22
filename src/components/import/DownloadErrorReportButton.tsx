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
      const headers = ["Row Number", "Column", "Value", "Error Message", "Error Code"];
      const rows = errors.map((error) => [
        error.row_number || "N/A",
        error.field_name || "Unknown",
        `"${(error.invalid_value || "").replace(/"/g, '""')}"`, // Escape quotes
        `"${(error.error_message || "Unknown error").replace(/"/g, '""')}"`,
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
      console.error("Error generating CSV report:", error);
      alert("Failed to generate error report. Please try again.");
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={errors.length === 0}
      aria-label={`Download error report in CSV format (${errors.length} errors)`}
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
      Download Error Report (CSV)
    </Button>
  );
}
