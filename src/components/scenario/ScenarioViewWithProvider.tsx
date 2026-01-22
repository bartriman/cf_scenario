import { QueryProvider } from "@/components/QueryProvider";
import ScenarioView from "./ScenarioView";

interface ScenarioViewWithProviderProps {
  scenarioId?: string;
  companyId?: string;
  baseCurrency: string;
}

export default function ScenarioViewWithProvider(props: ScenarioViewWithProviderProps) {
  return (
    <QueryProvider>
      <ScenarioView {...props} />
    </QueryProvider>
  );
}
