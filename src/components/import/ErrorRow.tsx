import type { ValidationError } from "@/types";

interface ErrorRowProps {
  error: ValidationError;
}

export function ErrorRow({ error }: ErrorRowProps) {
  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/50">
      <td className="px-4 py-3 text-sm">{error.row_number}</td>
      <td className="px-4 py-3 text-sm font-medium">{error.field_name}</td>
      <td className="px-4 py-3 text-sm max-w-xs truncate" title={error.invalid_value}>
        {error.invalid_value || <span className="text-muted-foreground italic">-</span>}
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-destructive">{error.error_message}</span>
          {error.error_code && <span className="text-xs text-muted-foreground font-mono">{error.error_code}</span>}
        </div>
      </td>
    </tr>
  );
}
