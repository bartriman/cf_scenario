import type { ScenarioListItemDTO } from "@/types";
import ScenarioCardReact from "./ScenarioCardReact";

interface ScenarioGridReactProps {
  scenarios: ScenarioListItemDTO[];
}

export default function ScenarioGridReact({ scenarios }: ScenarioGridReactProps) {
  if (scenarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <svg
          className="w-24 h-24 text-neutral-300 mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          ></path>
        </svg>
        <h3 className="text-xl font-semibold text-neutral-700 mb-2">Nie masz jeszcze żadnych scenariuszy</h3>
        <p className="text-neutral-500 mb-6 text-center max-w-md">
          Rozpocznij pracę od utworzenia pierwszego scenariusza lub zaimportowania danych z pliku CSV.
        </p>
        <a
          href="/import"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Utwórz pierwszy scenariusz
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {scenarios.map((scenario) => (
        <ScenarioCardReact key={scenario.id} scenario={scenario} />
      ))}
    </div>
  );
}
