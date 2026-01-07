interface WizardProgressProps {
  steps: { label: string; status: "completed" | "active" | "inactive" }[];
}

export function WizardProgress({ steps }: WizardProgressProps) {
  return (
    <nav aria-label="Postęp kreatora importu" className="mb-8">
      <ol className="flex items-center justify-between w-full max-w-3xl mx-auto">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isLast = index === steps.length - 1;

          return (
            <li key={stepNumber} className="flex items-center flex-1">
              <div className="flex items-center flex-col">
                {/* Circle with step number */}
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold
                    ${
                      step.status === "completed"
                        ? "bg-primary border-primary text-primary-foreground"
                        : step.status === "active"
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-muted border-muted-foreground text-muted-foreground"
                    }
                  `}
                  aria-current={step.status === "active" ? "step" : undefined}
                >
                  {step.status === "completed" ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </div>

                {/* Step label */}
                <span
                  className={`
                    mt-2 text-xs sm:text-sm font-medium text-center
                    ${step.status === "active" ? "text-foreground" : "text-muted-foreground"}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2 mt-[-20px]
                    ${step.status === "completed" ? "bg-primary" : "bg-muted"}
                  `}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
