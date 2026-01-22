import { QueryProvider } from "@/components/QueryProvider";
import { ScenarioListContainer } from "./ScenarioListContainer";
import type { ScenarioListItemDTO } from "@/types";

interface ScenarioListContainerWithProviderProps {
  companyId: string;
  initialScenarios: ScenarioListItemDTO[];
}

export default function ScenarioListContainerWithProvider(props: ScenarioListContainerWithProviderProps) {
  return (
    <QueryProvider>
      <ScenarioListContainer {...props} />
    </QueryProvider>
  );
}
