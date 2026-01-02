import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateScenarioRequestDTO } from "@/types";

interface CreateScenarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateScenarioRequestDTO) => Promise<void>;
}

export default function CreateScenarioDialog({ open, onOpenChange, onSubmit }: CreateScenarioDialogProps) {
  const [formData, setFormData] = useState<CreateScenarioRequestDTO>({
    name: "",
    dataset_code: "",
    start_date: "",
    end_date: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nazwa jest wymagana";
    } else if (formData.name.length > 255) {
      newErrors.name = "Nazwa nie może przekraczać 255 znaków";
    }

    if (!formData.dataset_code.trim()) {
      newErrors.dataset_code = "Kod zestawu danych jest wymagany";
    } else if (formData.dataset_code.length > 100) {
      newErrors.dataset_code = "Kod nie może przekraczać 100 znaków";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.dataset_code)) {
      newErrors.dataset_code = "Kod może zawierać tylko litery, cyfry i podkreślenia";
    }

    if (!formData.start_date) {
      newErrors.start_date = "Data rozpoczęcia jest wymagana";
    }

    if (!formData.end_date) {
      newErrors.end_date = "Data zakończenia jest wymagana";
    } else if (formData.start_date && formData.end_date < formData.start_date) {
      newErrors.end_date = "Data zakończenia musi być późniejsza niż data rozpoczęcia";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset formularza po sukcesie
      setFormData({
        name: "",
        dataset_code: "",
        start_date: "",
        end_date: "",
      });
      setErrors({});
    } catch (_error) {
      // Błąd jest obsługiwany w komponencie nadrzędnym
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      dataset_code: "",
      start_date: "",
      end_date: "",
    });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Utwórz nowy scenariusz</DialogTitle>
          <DialogDescription>Wypełnij formularz, aby utworzyć nowy scenariusz bazowy.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nazwa scenariusza *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="np. Scenariusz Q1 2026"
                maxLength={255}
                disabled={isSubmitting}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dataset_code">Kod zestawu danych *</Label>
              <Input
                id="dataset_code"
                value={formData.dataset_code}
                onChange={(e) => setFormData({ ...formData, dataset_code: e.target.value })}
                placeholder="np. MAIN_2026_Q1"
                maxLength={100}
                disabled={isSubmitting}
              />
              {errors.dataset_code && <p className="text-sm text-red-600">{errors.dataset_code}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="start_date">Data rozpoczęcia *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                disabled={isSubmitting}
              />
              {errors.start_date && <p className="text-sm text-red-600">{errors.start_date}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="end_date">Data zakończenia *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                disabled={isSubmitting}
              />
              {errors.end_date && <p className="text-sm text-red-600">{errors.end_date}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Tworzenie..." : "Utwórz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
