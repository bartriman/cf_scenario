import type { ScenarioListItemDTO } from "@/types";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import ScenarioCardActions from "./ScenarioCardActions";

interface ScenarioCardProps {
  scenario: ScenarioListItemDTO;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function ScenarioCardReact({ scenario }: ScenarioCardProps) {
  const statusBadgeClasses =
    scenario.status === "Draft"
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";

  const statusLabel = scenario.status === "Draft" ? "Roboczy" : "Zablokowany";

  return (
    <a
      href={`/scenarios/${scenario.id}`}
      className="block transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg group"
    >
      <Card className="h-full hover:border-primary/50 transition-colors">
        <CardHeader className="relative pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {scenario.name}
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${statusBadgeClasses}`}
              >
                {statusLabel}
              </span>
            </div>
            <div
              className="flex-shrink-0"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <ScenarioCardActions scenario={scenario} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <span className="truncate">{scenario.dataset_code}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Utworzono {formatDate(scenario.created_at)}</span>
          </div>
          {scenario.base_scenario_id && (
            <div className="flex items-center text-sm text-muted-foreground">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>Duplikat scenariusza #{scenario.base_scenario_id}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </a>
  );
}
