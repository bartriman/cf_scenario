import { useState, type FormEvent } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { UpdatePasswordRequestDTO, ErrorResponseDTO } from "../../types";
import { validateField } from "../../lib/validation/auth.validation";

// Stan formularza aktualizacji hasła
interface UpdatePasswordFormState {
  password: string;
  confirmPassword: string;
  isSubmitting: boolean;
  apiError: string | null;
  isSuccess: boolean;
}

// Błędy walidacji formularza
interface UpdatePasswordFormErrors {
  password: string | null;
  confirmPassword: string | null;
}

export function UpdatePasswordForm() {
  const [formState, setFormState] = useState<UpdatePasswordFormState>({
    password: "",
    confirmPassword: "",
    isSubmitting: false,
    apiError: null,
    isSuccess: false,
  });

  const [errors, setErrors] = useState<UpdatePasswordFormErrors>({
    password: null,
    confirmPassword: null,
  });

  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });

  const handlePasswordChange = (value: string) => {
    setFormState((prev) => ({ ...prev, password: value, apiError: null }));

    // Walidacja w czasie rzeczywistym po dotknięciu pola
    if (touched.password) {
      const error = validateField("password", value);
      setErrors((prev) => ({ ...prev, password: error }));
    }

    // Rewalidacja confirmPassword jeśli zostało dotknięte
    if (touched.confirmPassword) {
      const confirmError = validateField("confirmPassword", formState.confirmPassword, value);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setFormState((prev) => ({ ...prev, confirmPassword: value, apiError: null }));

    // Walidacja w czasie rzeczywistym po dotknięciu pola
    if (touched.confirmPassword) {
      const error = validateField("confirmPassword", value, formState.password);
      setErrors((prev) => ({ ...prev, confirmPassword: error }));
    }
  };

  const handleBlur = (field: "password" | "confirmPassword") => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    const value = field === "password" ? formState.password : formState.confirmPassword;
    const compareValue = field === "confirmPassword" ? formState.password : undefined;
    const error = validateField(field, value, compareValue);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validateForm = (): boolean => {
    const passwordError = validateField("password", formState.password);
    const confirmPasswordError = validateField("confirmPassword", formState.confirmPassword, formState.password);

    setErrors({
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });

    setTouched({
      password: true,
      confirmPassword: true,
    });

    return !passwordError && !confirmPasswordError;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // 1. Walidacja formularza
    const isValid = validateForm();
    if (!isValid) return;

    // 2. Ustawienie stanu loading
    setFormState((prev) => ({ ...prev, isSubmitting: true, apiError: null }));

    try {
      // 3. Wywołanie API Update Password
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: formState.password,
        } as UpdatePasswordRequestDTO),
      });

      // 4. Obsługa odpowiedzi
      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();

        // Obsługa błędów walidacji (400)
        if (response.status === 400 && errorData.error.details) {
          const newErrors: UpdatePasswordFormErrors = {
            password: null,
            confirmPassword: null,
          };
          errorData.error.details.forEach((detail) => {
            if (detail.field === "password") newErrors.password = detail.message;
            if (detail.field === "confirmPassword") newErrors.confirmPassword = detail.message;
          });
          setErrors(newErrors);
        } else if (response.status === 401) {
          // Brak autoryzacji - sesja wygasła
          setFormState((prev) => ({
            ...prev,
            apiError: "Sesja wygasła. Proszę ponownie zresetować hasło.",
          }));
        } else {
          // Obsługa innych błędów
          setFormState((prev) => ({
            ...prev,
            apiError: errorData.error.message || "Wystąpił błąd. Spróbuj ponownie.",
          }));
        }

        setFormState((prev) => ({ ...prev, isSubmitting: false }));
        return;
      }

      // 5. Sukces
      await response.json();
      setFormState((prev) => ({
        ...prev,
        isSubmitting: false,
        isSuccess: true,
      }));

      // Przekierowanie po krótkiej chwili
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch {
      setFormState((prev) => ({
        ...prev,
        apiError: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
        isSubmitting: false,
      }));
    }
  };

  // Wyświetlanie komunikatu sukcesu
  if (formState.isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Hasło zostało zmienione</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <div className="flex items-start">
              <svg className="mr-2 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-medium">Hasło zostało pomyślnie zmienione</p>
                <p className="mt-1">Za chwilę zostaniesz przekierowany do strony logowania...</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Ustaw nowe hasło</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Alert z błędem API */}
        {formState.apiError && (
          <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-start">
              <svg className="mr-2 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{formState.apiError}</span>
              <button
                type="button"
                onClick={() => setFormState((prev) => ({ ...prev, apiError: null }))}
                className="ml-auto -mr-1 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                aria-label="Zamknij alert"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        <p className="mb-4 text-sm text-gray-600">Wprowadź swoje nowe hasło poniżej.</p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Password field */}
          <div className="mb-4">
            <Label htmlFor="password">Nowe hasło</Label>
            <Input
              id="password"
              type="password"
              value={formState.password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onBlur={() => handleBlur("password")}
              disabled={formState.isSubmitting}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              placeholder="••••••••"
              className={errors.password && touched.password ? "border-red-500" : ""}
            />
            {errors.password && touched.password && (
              <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password field */}
          <div className="mb-6">
            <Label htmlFor="confirmPassword">Powtórz nowe hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formState.confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              onBlur={() => handleBlur("confirmPassword")}
              disabled={formState.isSubmitting}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              placeholder="••••••••"
              className={errors.confirmPassword && touched.confirmPassword ? "border-red-500" : ""}
            />
            {errors.confirmPassword && touched.confirmPassword && (
              <p id="confirmPassword-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit button */}
          <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Aktualizowanie...
              </span>
            ) : (
              "Zmień hasło"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
