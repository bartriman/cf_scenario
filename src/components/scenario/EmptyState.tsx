import { Button } from "@/components/ui/button";
import { FileX, Plus, Upload } from "lucide-react";

interface EmptyStateProps {
  onCreateClick: () => void;
}

export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-muted p-6 mb-6">
        <FileX className="h-12 w-12 text-muted-foreground" />
      </div>

      <h3 className="text-xl font-semibold mb-2">No scenarios</h3>

      <p className="text-muted-foreground text-center mb-8 max-w-md">
        Start by importing data or creating a new scenario to manage your cash flows.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild variant="outline">
          <a href="/import">
            <Upload className="mr-2 h-4 w-4" />
            Import data
          </a>
        </Button>

        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Create scenario
        </Button>
      </div>
    </div>
  );
}
