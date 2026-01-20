import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Eye, Copy, Lock, Trash2, Download } from "lucide-react";
import type { ScenarioListItemDTO } from "@/types";

interface ScenarioCardProps {
  scenario: ScenarioListItemDTO;
  onClick: () => void;
  onDuplicate: () => void;
  onLock: () => void;
  onDelete: () => void;
  onExport: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
}

export function ScenarioCard({ scenario, onClick, onDuplicate, onLock, onDelete, onExport }: ScenarioCardProps) {
  const isDraft = scenario.status === "Draft";
  const isLocked = scenario.status === "Locked";
  const canLock = isDraft;

  const handleCardClick = (e: React.MouseEvent) => {
    // Ignoruj kliknięcia w menu
    if ((e.target as HTMLElement).closest("[data-dropdown-trigger]")) {
      return;
    }
    onClick();
  };

  return (
    <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50" onClick={handleCardClick}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate mb-2">{scenario.name}</h3>
          <Badge variant={isDraft ? "default" : "secondary"}>{scenario.status}</Badge>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild data-dropdown-trigger>
            <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>

            {isLocked && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onExport();
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </DropdownMenuItem>
            )}

            {canLock && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onLock();
                  }}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Lock
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Dataset code:</span>
          <span className="font-medium">{scenario.dataset_code}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Okres:</span>
          <span className="font-medium">
            {formatDate(scenario.start_date)} - {formatDate(scenario.end_date)}
          </span>
        </div>

        {scenario.base_scenario_id && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bazuje na:</span>
            <span className="font-medium">Scenario #{scenario.base_scenario_id}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground pt-3">
        Utworzono: {formatRelativeTime(scenario.created_at)}
      </CardFooter>
    </Card>
  );
}
