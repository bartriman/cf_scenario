import { CheckCircle2, AlertTriangle, XCircle, Download } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { ImportDetailsResponseDTO } from "../../types";

interface ValidationSummaryProps {
  importDetails: ImportDetailsResponseDTO;
}

/**
 * Podsumowanie wyników walidacji importu z wyświetleniem statystyk i statusu końcowego.
 * Pokazuje liczbę wierszy, liczbę błędów i opcjonalnie przycisk pobierania raportu.
 */
export function ValidationSummary({ importDetails }: ValidationSummaryProps) {
  const { status, total_rows, valid_rows, invalid_rows, inserted_transactions_count, error_report_url } = importDetails;

  const isSuccess = status === "completed" && invalid_rows === 0;
  const isPartialSuccess = status === "completed" && invalid_rows > 0;
  const isFailed = status === "failed";

  /**
   * Pobieranie raportu błędów
   */
  const handleDownloadReport = () => {
    if (error_report_url) {
      window.open(error_report_url, "_blank", "noopener,noreferrer");
    }
  };

  /**
   * Ikona i kolor statusu
   */
  const getStatusIcon = () => {
    if (isSuccess) {
      return <CheckCircle2 className="w-12 h-12 text-green-600" aria-hidden="true" />;
    }
    if (isPartialSuccess) {
      return <AlertTriangle className="w-12 h-12 text-amber-600" aria-hidden="true" />;
    }
    if (isFailed) {
      return <XCircle className="w-12 h-12 text-destructive" aria-hidden="true" />;
    }
    return null;
  };

  /**
   * Komunikat statusu
   */
  const getStatusMessage = () => {
    if (isSuccess) {
      return "Import zakończony sukcesem!";
    }
    if (isPartialSuccess) {
      return "Import zakończony z ostrzeżeniami";
    }
    if (isFailed) {
      return "Import zakończony błędem";
    }
    return "";
  };

  const getStatusColor = () => {
    if (isSuccess) return "text-green-600";
    if (isPartialSuccess) return "text-amber-600";
    if (isFailed) return "text-destructive";
    return "";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          {getStatusIcon()}
          <CardTitle className={`text-2xl ${getStatusColor()}`}>{getStatusMessage()}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Statystyki w siatce */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Całkowita liczba wierszy</p>
            <p className="text-2xl font-bold">{total_rows}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Prawidłowe wiersze</p>
            <p className="text-2xl font-bold text-green-600">{valid_rows}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Nieprawidłowe wiersze</p>
            <p className="text-2xl font-bold text-destructive">{invalid_rows}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Zaimportowane transakcje</p>
            <p className="text-2xl font-bold text-primary">{inserted_transactions_count}</p>
          </div>
        </div>

        {/* Komunikat szczegółowy */}
        <div className="rounded-md bg-muted/50 p-4">
          {isSuccess && (
            <p className="text-sm text-foreground">
              Wszystkie wiersze zostały zaimportowane poprawnie. Utworzono {inserted_transactions_count}{" "}
              {inserted_transactions_count === 1 ? "transakcję" : "transakcji"}.
            </p>
          )}
          {isPartialSuccess && (
            <p className="text-sm text-foreground">
              Import zakończony z ostrzeżeniami. {valid_rows} {valid_rows === 1 ? "wiersz" : "wierszy"} zaimportowano,{" "}
              {invalid_rows} {invalid_rows === 1 ? "wiersz" : "wierszy"} pominięto z powodu błędów. Sprawdź szczegóły
              poniżej.
            </p>
          )}
          {isFailed && (
            <p className="text-sm text-foreground">
              Import nie powiódł się. Sprawdź szczegóły błędów i spróbuj ponownie z poprawionym plikiem.
            </p>
          )}
        </div>

        {/* Przycisk pobierania raportu */}
        {error_report_url && (
          <div>
            <Button onClick={handleDownloadReport} variant="outline" className="w-full md:w-auto">
              <Download className="w-4 h-4" />
              Pobierz raport błędów
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
