import { useMemo } from "react";
import { MappingRow } from "./MappingRow";
import { SYSTEM_FIELDS } from "@/lib/constants/system-fields";
import type { ColumnMapping } from "@/types";

interface ColumnMapperProps {
  csvHeaders: string[];
  mapping: ColumnMapping;
  onChange: (mapping: ColumnMapping) => void;
}

export function ColumnMapper({ csvHeaders, mapping, onChange }: ColumnMapperProps) {
  // Zbiór już zmapowanych kolumn CSV
  const usedColumns = useMemo(() => {
    const used = new Set<string>();
    Object.values(mapping).forEach((value) => {
      if (value) used.add(value);
    });
    return used;
  }, [mapping]);

  const handleFieldChange = (fieldKey: keyof ColumnMapping, csvColumn: string | null) => {
    onChange({
      ...mapping,
      [fieldKey]: csvColumn,
    });
  };

  return (
    <div className="space-y-2">
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-1">Mapowanie kolumn</h3>
        <p className="text-sm text-muted-foreground">Map CSV columns to corresponding system fields</p>
      </div>

      <div className="border rounded-lg bg-card">
        {SYSTEM_FIELDS.map((field) => (
          <MappingRow
            key={field.key}
            systemField={field.key}
            label={field.label}
            required={field.required}
            description={field.description}
            csvHeaders={csvHeaders}
            selectedColumn={mapping[field.key] || null}
            usedColumns={usedColumns}
            onChange={(csvColumn) => handleFieldChange(field.key, csvColumn)}
          />
        ))}
      </div>

      {/* Informacja o wymaganych polach */}
      <p className="text-xs text-muted-foreground mt-3">
        * Fields marked as &quot;Required&quot; must be mapped to proceed
      </p>
    </div>
  );
}
