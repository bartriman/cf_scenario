import { ScenarioCard } from "./ScenarioCard";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { ScenarioListItemDTO } from "@/types";

interface ScenarioGridProps {
  scenarios: ScenarioListItemDTO[];
  isLoading?: boolean;
  onScenarioClick: (scenarioId: number) => void;
  onDuplicateClick: (scenario: ScenarioListItemDTO) => void;
  onLockClick: (scenarioId: number) => void;
  onDeleteClick: (scenarioId: number) => void;
  onCreateClick: () => void;
}

function ScenarioCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function ScenarioGrid({
  scenarios,
  isLoading = false,
  onScenarioClick,
  onDuplicateClick,
  onLockClick,
  onDeleteClick,
  onCreateClick,
}: ScenarioGridProps) {
  // Stan ładowania - wyświetl szkielety
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ScenarioCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Stan pusty - brak scenariuszy
  if (scenarios.length === 0) {
    return <EmptyState onCreateClick={onCreateClick} />;
  }

  // Wyświetl siatę kart
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {scenarios.map((scenario) => (
        <ScenarioCard
          key={scenario.id}
          scenario={scenario}
          onClick={() => onScenarioClick(scenario.id)}
          onDuplicate={() => onDuplicateClick(scenario)}
          onLock={() => onLockClick(scenario.id)}
          onDelete={() => onDeleteClick(scenario.id)}
        />
      ))}
    </div>
  );
}
