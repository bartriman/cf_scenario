import { useState, useCallback, useRef } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import type { CreateImportResponseDTO, FileValidationResult } from "../../types";

interface FileUploadZoneProps {
  companyId: string;
  onUploadSuccess: (importData: CreateImportResponseDTO) => void;
  onUploadError: (error: string) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPE = "text/csv";

/**
 * Komponent do przesyłania plików CSV z interfejsem "przeciągnij i upuść" oraz standardowym wyborem pliku.
 * Waliduje format i rozmiar pliku po stronie klienta przed wysłaniem.
 */
export function FileUploadZone({ companyId, onUploadSuccess, onUploadError }: FileUploadZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetCode, setDatasetCode] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [validation, setValidation] = useState<FileValidationResult>({ isValid: true, errors: [] });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Walidacja pliku po stronie klienta
   */
  const validateFile = useCallback((file: File): FileValidationResult => {
    const errors: string[] = [];

    // Sprawdzenie rozszerzenia i MIME type
    if (!file.name.endsWith(".csv") && file.type !== ALLOWED_FILE_TYPE) {
      errors.push("Nieprawidłowy format pliku. Dozwolone tylko .csv");
    }

    // Sprawdzenie rozmiaru
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      errors.push(`Plik za duży. Maksymalny rozmiar to 10MB. Twój plik: ${fileSizeMB}MB`);
    }

    // Sprawdzenie czy plik nie jest pusty
    if (file.size === 0) {
      errors.push("Plik jest pusty");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  /**
   * Obsługa wyboru pliku (przez drag&drop lub kliknięcie)
   */
  const handleFileSelect = useCallback(
    (file: File) => {
      const validationResult = validateFile(file);
      setValidation(validationResult);

      if (validationResult.isValid) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
      }
    },
    [validateFile]
  );

  /**
   * Obsługa drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  /**
   * Obsługa drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  /**
   * Obsługa drop
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  /**
   * Obsługa kliknięcia w strefę upuszczania
   */
  const handleZoneClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Obsługa wyboru pliku przez input
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  /**
   * Usunięcie wybranego pliku
   */
  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setValidation({ isValid: true, errors: [] });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  /**
   * Walidacja dataset_code
   */
  const isDatasetCodeValid = datasetCode.trim().length > 0 && datasetCode.length <= 50;

  /**
   * Czy można rozpocząć import
   */
  const canStartImport = selectedFile !== null && isDatasetCodeValid && validation.isValid && !isUploading;

  /**
   * Rozpoczęcie importu - wywołanie API
   */
  const handleStartImport = useCallback(async () => {
    if (!canStartImport || !selectedFile) return;

    setIsUploading(true);
    onUploadError(""); // Reset błędu

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("dataset_code", datasetCode.trim());

      const response = await fetch(`/api/companies/${companyId}/imports`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Błąd podczas uploadu pliku");
      }

      const data: CreateImportResponseDTO = await response.json();
      onUploadSuccess(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd";
      onUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [canStartImport, selectedFile, datasetCode, companyId, onUploadSuccess, onUploadError]);

  return (
    <div className="space-y-6">
      {/* Strefa upuszczania pliku */}
      <div className="space-y-2">
        <Label htmlFor="file-upload">Plik CSV</Label>
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer
            ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
            ${validation.errors.length > 0 ? "border-destructive bg-destructive/5" : ""}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleZoneClick}
          role="button"
          tabIndex={0}
          aria-label="Strefa przesyłania pliku CSV"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleZoneClick();
            }
          }}
        >
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            accept=".csv,text/csv"
            onChange={handleInputChange}
            className="sr-only"
            aria-describedby="file-upload-description"
          />

          <div className="flex flex-col items-center gap-3 text-center">
            {selectedFile ? (
              <>
                <div className="rounded-full bg-primary/10 p-3">
                  <FileText className="w-8 h-8 text-primary" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  aria-label="Usuń wybrany plik"
                >
                  <X className="w-4 h-4" />
                  Usuń plik
                </Button>
              </>
            ) : (
              <>
                <div className="rounded-full bg-muted p-3">
                  <Upload className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {isDragActive ? "Upuść plik tutaj" : "Przeciągnij i upuść plik CSV"}
                  </p>
                  <p className="text-xs text-muted-foreground">lub kliknij, aby wybrać plik</p>
                </div>
              </>
            )}
          </div>

          <p id="file-upload-description" className="mt-4 text-xs text-muted-foreground text-center">
            Format: .csv • Maksymalny rozmiar: 10MB
          </p>
        </div>

        {/* Błędy walidacji */}
        {validation.errors.length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              {validation.errors.map((error, index) => (
                <p key={index} className="text-sm text-destructive">
                  {error}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pole dataset_code */}
      <div className="space-y-2">
        <Label htmlFor="dataset-code">
          Kod zbioru danych <span className="text-destructive">*</span>
        </Label>
        <Input
          id="dataset-code"
          type="text"
          placeholder="np. Q1_2024"
          value={datasetCode}
          onChange={(e) => setDatasetCode(e.target.value)}
          maxLength={50}
          aria-required="true"
          aria-invalid={!isDatasetCodeValid && datasetCode.length > 0}
          disabled={isUploading}
        />
        <p className="text-xs text-muted-foreground">Unikalny identyfikator dla tego importu (1-50 znaków)</p>
      </div>

      {/* Przycisk rozpoczęcia importu */}
      <Button
        onClick={handleStartImport}
        disabled={!canStartImport}
        className="w-full"
        aria-label={isUploading ? "Trwa przesyłanie pliku..." : "Rozpocznij import pliku CSV"}
      >
        {isUploading ? (
          <>
            <span className="animate-spin">⏳</span>
            Przesyłanie...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Rozpocznij import
          </>
        )}
      </Button>
    </div>
  );
}
