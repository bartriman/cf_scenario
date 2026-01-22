import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface ScenarioStatsCardProps {
  total: number;
  draft: number;
  locked: number;
}

export function ScenarioStatsCard({ total, draft, locked }: ScenarioStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Scenario Statistics
        </CardTitle>
        <CardDescription>Total number of scenarios</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">All</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{draft}</p>
            <p className="text-xs text-muted-foreground">Draft</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{locked}</p>
            <p className="text-xs text-muted-foreground">Locked</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
