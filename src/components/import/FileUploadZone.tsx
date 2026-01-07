import { useState, useCallback, useRef, type DragEvent, type ChangeEvent } from "react";

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSize?: number; // w bajtach
  disabled?: boolean;
  selectedFile?: File | null;
}

export function FileUploadZone({
  onFileSelect,
  acceptedFormats = [".csv"],
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  selectedFile = null,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);

      if (files.length > 1) {
        alert("Można przesłać tylko jeden plik");
        return;
      }

      if (files.length === 1) {
        onFileSelect(files[0]);
      }
    },
    [disabled, onFileSelect]
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;

      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(",")}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/5"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {selectedFile ? (
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>
            <p className="text-xs text-muted-foreground">Kliknij lub przeciągnij inny plik, aby zmienić</p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-foreground">Przeciągnij i upuść plik CSV tutaj</p>
              <p className="text-muted-foreground">lub kliknij, aby wybrać plik</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Maksymalny rozmiar: {formatFileSize(maxSize)} • Format: {acceptedFormats.join(", ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
