import { Button } from '@/components/ui/button';
import { FileX, Plus, Upload } from 'lucide-react';

interface EmptyStateProps {
  onCreateClick: () => void;
}

export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="rounded-full bg-muted p-6 mb-6">
        <FileX className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">Brak scenariuszy</h3>
      
      <p className="text-muted-foreground text-center mb-8 max-w-md">
        Rozpocznij od zaimportowania danych lub stworzenia nowego scenariusza, 
        aby móc zarządzać przepływami pieniężnymi.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild variant="outline">
          <a href="/import">
            <Upload className="mr-2 h-4 w-4" />
            Importuj dane
          </a>
        </Button>
        
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Utwórz scenariusz
        </Button>
      </div>
    </div>
  );
}
