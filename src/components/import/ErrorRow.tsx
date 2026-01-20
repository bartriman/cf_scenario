import type { ValidationError } from "@/types";

interface ErrorRowProps {
  error: ValidationError;
}

export function ErrorRow({ error }: ErrorRowProps) {
  const rowNumber = error.row_number || 'N/A';
  const fieldName = error.field_name || 'Unknown';
  const invalidValue = error.invalid_value || '';
  const errorMessage = error.error_message || 'Unknown error';

  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/50 transition-colors" role="row">
      <td className="px-4 py-3 text-sm" role="cell">
        {rowNumber}
      </td>
      <td className="px-4 py-3 text-sm font-medium" role="cell">
        {fieldName}
      </td>
      <td className="px-4 py-3 text-sm max-w-xs truncate" title={invalidValue || 'No value'} role="cell">
        {invalidValue ? (
          <span className="text-foreground">{invalidValue}</span>
        ) : (
          <span className="text-muted-foreground italic">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm" role="cell">
        <div className="flex flex-col gap-1">
          <span className="text-destructive">{errorMessage}</span>
          {error.error_code && (
            <span className="text-xs text-muted-foreground font-mono" aria-label={`Error code: ${error.error_code}`}>
              {error.error_code}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
