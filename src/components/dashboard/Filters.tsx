import { Button } from "@/components/ui/button";
import type { ScenarioStatusType, SortOption } from "@/types";

interface FiltersProps {
  status: ScenarioStatusType | null;
  sort: SortOption;
  onStatusChange: (status: ScenarioStatusType | null) => void;
  onSortChange: (sort: SortOption) => void;
}

export default function Filters({ status, sort, onStatusChange, onSortChange }: FiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Status Filter */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted-foreground">Status</span>
        <div className="flex gap-2" role="group" aria-label="Filtr statusu">
          <Button variant={status === null ? "default" : "outline"} size="sm" onClick={() => onStatusChange(null)}>
            Wszystkie
          </Button>
          <Button
            variant={status === "Draft" ? "default" : "outline"}
            size="sm"
            onClick={() => onStatusChange("Draft")}
          >
            Robocze
          </Button>
          <Button
            variant={status === "Locked" ? "default" : "outline"}
            size="sm"
            onClick={() => onStatusChange("Locked")}
          >
            Zablokowane
          </Button>
        </div>
      </div>

      {/* Sort Control */}
      <div className="flex flex-col gap-2">
        <label htmlFor="sort-select" className="text-sm font-medium text-muted-foreground">
          Sortowanie
        </label>
        <select
          id="sort-select"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="flex h-9 w-full sm:w-[200px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="created_at_desc">Najnowsze</option>
          <option value="created_at_asc">Najstarsze</option>
          <option value="name_asc">Nazwa A-Z</option>
          <option value="name_desc">Nazwa Z-A</option>
        </select>
      </div>
    </div>
  );
}
