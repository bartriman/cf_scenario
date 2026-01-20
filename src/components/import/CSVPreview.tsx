interface CSVPreviewProps {
  headers: string[];
  rows: string[][];
  maxRows?: number;
}

export function CSVPreview({ headers, rows, maxRows = 5 }: CSVPreviewProps) {
  const displayRows = rows.slice(0, maxRows);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-4 py-2 text-left font-medium text-muted-foreground border-b">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b last:border-b-0 hover:bg-muted/50">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-2 max-w-xs truncate" title={cell}>
                    {cell || <span className="text-muted-foreground italic">-</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > maxRows && (
        <div className="px-4 py-2 bg-muted/50 text-xs text-muted-foreground text-center">
          Displayed {maxRows} of {rows.length} rows
        </div>
      )}
    </div>
  );
}
