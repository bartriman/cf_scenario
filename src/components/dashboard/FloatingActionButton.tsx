import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FloatingActionButtonProps {
  onCreateScenario: () => void;
}

export default function FloatingActionButton({ onCreateScenario }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Menu rozwojowe */}
      {isOpen && (
        <>
          {/* Overlay do zamknięcia menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsOpen(false);
            }}
            role="button"
            tabIndex={-1}
            aria-label="Zamknij menu"
          />

          {/* Menu opcji */}
          <div className="fixed bottom-24 right-8 z-50 flex flex-col gap-2 animate-in slide-in-from-bottom-2">
            <Button
              onClick={() => {
                setIsOpen(false);
                window.location.href = "/import";
              }}
              className="shadow-lg whitespace-nowrap"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Nowy Import
            </Button>
            <Button
              onClick={() => {
                setIsOpen(false);
                onCreateScenario();
              }}
              className="shadow-lg whitespace-nowrap"
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Nowy Scenariusz
            </Button>
          </div>
        </>
      )}

      {/* Główny FAB */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-50 rounded-full w-14 h-14 shadow-xl hover:shadow-2xl transition-all"
        size="icon"
        aria-label="Szybkie akcje"
      >
        <svg
          className={`w-6 h-6 transition-transform ${isOpen ? "rotate-45" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Button>
    </>
  );
}
