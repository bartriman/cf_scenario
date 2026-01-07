import { useState, useCallback } from "react";
import { useFileUpload } from "@/components/hooks/useFileUpload";
import { useCSVParser } from "@/components/hooks/useCSVParser";
import { FileUploadZone } from "./FileUploadZone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FileUploadStepProps {
  onNext: (file: File, datasetCode: string, headers: string[], previewRows: string[][]) => void;
  onCancel: () => void;
}

const DATASET_CODE_REGEX = /^[a-zA-Z0-9_-]+$/;
const DATASET_CODE_MAX_LENGTH = 50;

export function FileUploadStep({ onNext, onCancel }: FileUploadStepProps) {
  const [datasetCode, setDatasetCode] = useState("");
  const [datasetCodeError, setDatasetCodeError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    file,
    selectFile,
    error: fileError,
  } = useFileUpload({
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptedFormats: [".csv"],
  });

  const { parse, isLoading: isParsing, error: parseError } = useCSVParser();

  const validateDatasetCode = useCallback((value: string): string | null => {
    if (value.trim().length === 0) {
      return "Kod zestawu danych jest wymagany";
    }

    if (value.length > DATASET_CODE_MAX_LENGTH) {
      return `Maksymalna długość to ${DATASET_CODE_MAX_LENGTH} znaków`;
    }

    if (!DATASET_CODE_REGEX.test(value)) {
      return "Dozwolone tylko litery, cyfry, '-' i '_'";
    }

    return null;
  }, []);

  const handleDatasetCodeChange = useCallback(
    (value: string) => {
      setDatasetCode(value);

      if (value.trim().length > 0) {
        const error = validateDatasetCode(value);
        setDatasetCodeError(error);
      } else {
        setDatasetCodeError(null);
      }
    },
    [validateDatasetCode]
  );

  const handleNext = useCallback(async () => {
    // Walidacja przed przejściem dalej
    if (!file) {
      return;
    }

    const codeError = validateDatasetCode(datasetCode);
    if (codeError) {
      setDatasetCodeError(codeError);
      return;
    }

    setIsProcessing(true);

    try {
      // Parsowanie CSV
      const { headers, rows } = await parse(file);

      // Przejście do następnego kroku
      onNext(file, datasetCode, headers, rows);
    } catch {
      // Błąd parsowania jest już ustawiony w useCSVParser
      // Error is already handled by useCSVParser hook
    } finally {
      setIsProcessing(false);
    }
  }, [file, datasetCode, validateDatasetCode, parse, onNext]);

  const canProceed = file !== null && datasetCode.trim() !== "" && !datasetCodeError;
  const showError = fileError || parseError;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Wybierz plik CSV</h2>
        <p className="text-muted-foreground">Prześlij plik CSV z danymi finansowymi, aby rozpocząć proces importu</p>
      </div>

      {/* Error message */}
      {showError && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-sm text-destructive font-medium">{showError}</p>
        </div>
      )}

      {/* File upload zone */}
      <div>
        <Label htmlFor="file-upload" className="mb-2 block">
          Plik CSV *
        </Label>
        <FileUploadZone onFileSelect={selectFile} selectedFile={file} disabled={isProcessing || isParsing} />
      </div>

      {/* Dataset code input */}
      <div>
        <Label htmlFor="dataset-code">Kod zestawu danych *</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Unikalny identyfikator dla tego zestawu danych (np. &quot;Q1-2026&quot;, &quot;budget-2026&quot;)
        </p>
        <Input
          id="dataset-code"
          type="text"
          value={datasetCode}
          onChange={(e) => handleDatasetCodeChange(e.target.value)}
          placeholder="np. Q1-2026"
          maxLength={DATASET_CODE_MAX_LENGTH}
          disabled={isProcessing || isParsing}
          className={datasetCodeError ? "border-destructive" : ""}
        />
        {datasetCodeError && <p className="text-sm text-destructive mt-1">{datasetCodeError}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          {datasetCode.length}/{DATASET_CODE_MAX_LENGTH} znaków
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isProcessing || isParsing}>
          Anuluj
        </Button>
        <Button onClick={handleNext} disabled={!canProceed || isProcessing || isParsing} className="ml-auto">
          {isProcessing || isParsing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Przetwarzanie...
            </>
          ) : (
            "Dalej"
          )}
        </Button>
      </div>
    </div>
  );
}
