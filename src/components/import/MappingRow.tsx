import { Label } from "@/components/ui/label";

interface MappingRowProps {
  systemField: string;
  label: string;
  required: boolean;
  description?: string;
  csvHeaders: string[];
  selectedColumn: string | null;
  usedColumns: Set<string>;
  onChange: (csvColumn: string | null) => void;
}

export function MappingRow({
  systemField,
  label,
  required,
  description,
  csvHeaders,
  selectedColumn,
  usedColumns,
  onChange,
}: MappingRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-3 border-b last:border-b-0">
      {/* System field info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Label htmlFor={`mapping-${systemField}`} className="font-medium">
            {label}
          </Label>
          {required && (
            <span className="px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive rounded">Wymagane</span>
          )}
        </div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>

      {/* CSV column selector */}
      <div className="flex-1">
        <select
          id={`mapping-${systemField}`}
          value={selectedColumn || ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
        >
          <option value="">-- Wybierz kolumnę CSV --</option>
          {csvHeaders.map((header, index) => {
            const isUsed = usedColumns.has(header) && header !== selectedColumn;
            return (
              <option key={index} value={header} disabled={isUsed}>
                {header} {isUsed ? "(już zmapowana)" : ""}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );
}
