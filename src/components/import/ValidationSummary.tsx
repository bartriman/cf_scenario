interface ValidationSummaryProps {
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export function ValidationSummary({ totalRows, validRows, invalidRows }: ValidationSummaryProps) {
  const validPercentage = totalRows > 0 ? Math.round((validRows / totalRows) * 100) : 0;

  // Określ status na podstawie wyników
  const status: "success" | "warning" | "error" = invalidRows === 0 ? "success" : validRows === 0 ? "error" : "warning";

  const statusConfig = {
    success: {
      icon: (
        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: "Validation completed successfully",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-800",
    },
    warning: {
      icon: (
        <svg className="w-12 h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      title: "Validation errors detected",
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
      borderColor: "border-amber-200 dark:border-amber-800",
    },
    error: {
      icon: (
        <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: "All rows contain errors",
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-800",
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`border rounded-lg p-6 ${config.bgColor} ${config.borderColor}`} role="region" aria-label="Podsumowanie walidacji">
      <div className="flex flex-col items-center text-center">
        <div aria-hidden="true">{config.icon}</div>
        <h3 className={`text-lg font-semibold mt-4 ${config.color}`}>{config.title}</h3>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6 w-full max-w-md">
          <div>
            <div className="text-2xl font-bold" aria-label={`Total rows: ${totalRows}`}>{totalRows}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600" aria-label={`Valid rows: ${validRows}`}>{validRows}</div>
            <div className="text-sm text-muted-foreground">Valid</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600" aria-label={`Invalid rows: ${invalidRows}`}>{invalidRows}</div>
            <div className="text-sm text-muted-foreground">Invalid</div>
          </div>
        </div>

        {/* Percentage indicator */}
        <div className="mt-6 w-full max-w-md">
          <div className="flex justify-between text-sm mb-2">
            <span>Data correctness</span>
            <span className="font-medium" aria-label={`Correctness percentage: ${validPercentage}%`}>{validPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2" role="progressbar" aria-valuenow={validPercentage} aria-valuemin={0} aria-valuemax={100} aria-label="Data correctness bar">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                validPercentage === 100 ? "bg-green-600" : validPercentage > 50 ? "bg-amber-600" : "bg-red-600"
              }`}
              style={{ width: `${validPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
