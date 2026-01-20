import { useState, useCallback } from "react";

interface UseFileUploadOptions {
  maxSize?: number; // w bajtach
  acceptedFormats?: string[];
}

interface UseFileUploadReturn {
  file: File | null;
  selectFile: (file: File) => void;
  clearFile: () => void;
  error: string | null;
  isValid: boolean;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ACCEPTED_FORMATS = [".csv"];

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const { maxSize = DEFAULT_MAX_SIZE, acceptedFormats = DEFAULT_ACCEPTED_FORMATS } = options;

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Sprawdzenie formatu
      const hasValidExtension = acceptedFormats.some((format) =>
        file.name.toLowerCase().endsWith(format.toLowerCase())
      );

      if (!hasValidExtension) {
        return `Only files of type ${acceptedFormats.join(", ")} are supported`;
      }

      // Sprawdzenie rozmiaru
      if (file.size > maxSize) {
        const maxSizeMB = Math.floor(maxSize / (1024 * 1024));
        return `File size cannot exceed ${maxSizeMB}MB`;
      }

      return null;
    },
    [maxSize, acceptedFormats]
  );

  const selectFile = useCallback(
    (selectedFile: File) => {
      const validationError = validateFile(selectedFile);

      if (validationError) {
        setError(validationError);
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
    },
    [validateFile]
  );

  const clearFile = useCallback(() => {
    setFile(null);
    setError(null);
  }, []);

  return {
    file,
    selectFile,
    clearFile,
    error,
    isValid: file !== null && error === null,
  };
}
