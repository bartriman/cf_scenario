import { Check } from "lucide-react";
import type { ImportWizardStep } from "../../types";

interface ProgressBarProps {
  currentStep: ImportWizardStep;
  completedSteps: number[];
}

const steps = [
  { number: 1, label: "Upload" },
  { number: 2, label: "Walidacja" },
  { number: 3, label: "Zakończenie" },
] as const;

/**
 * Komponent wizualny wskazujący postęp w kreatorze importu (3 kroki).
 * Wyświetla aktywny krok, ukończone kroki z ikoną ✓ oraz pozostałe kroki.
 */
export function ProgressBar({ currentStep, completedSteps }: ProgressBarProps) {
  return (
    <div className="mb-8" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={3}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.number);
          const isCurrent = currentStep === step.number;
          const isUpcoming = step.number > currentStep;

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors
                    ${isCompleted ? "bg-green-600 text-white" : ""}
                    ${isCurrent ? "bg-primary text-primary-foreground" : ""}
                    ${isUpcoming ? "bg-muted text-muted-foreground" : ""}
                  `}
                  aria-label={`${step.label}${isCompleted ? " - ukończony" : isCurrent ? " - aktualny" : ""}`}
                >
                  {isCompleted ? <Check className="w-5 h-5" aria-hidden="true" /> : <span>{step.number}</span>}
                </div>
                <span
                  className={`
                    mt-2 text-sm font-medium
                    ${isCurrent ? "text-foreground" : "text-muted-foreground"}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 mt-[-24px]">
                  <div
                    className={`
                      h-full transition-colors
                      ${isCompleted || (isCurrent && index < currentStep - 1) ? "bg-green-600" : "bg-muted"}
                    `}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
