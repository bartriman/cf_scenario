import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Upload } from "lucide-react";
import type { ScenarioFilterStatus } from "@/types";

interface ScenarioListHeaderProps {
  onCreateClick: () => void;
  onFilterChange?: (status: ScenarioFilterStatus) => void;
  onSearchChange?: (query: string) => void;
}

export function ScenarioListHeader({ onCreateClick, onFilterChange, onSearchChange }: ScenarioListHeaderProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Scenarios</h1>
          <p className="text-muted-foreground mt-1">Manage your cash flow scenarios</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild variant="outline">
            <a href="/import">
              <Upload className="mr-2 h-4 w-4" />
              Import data
            </a>
          </Button>
          
          <Button onClick={onCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            New scenario
          </Button>
        </div>
      </div>

      {(onFilterChange || onSearchChange) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {onSearchChange && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scenarios..."
                className="pl-9"
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}

          {onFilterChange && (
            <Select defaultValue="all" onValueChange={(value) => onFilterChange(value as ScenarioFilterStatus)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Locked">Locked</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
}
