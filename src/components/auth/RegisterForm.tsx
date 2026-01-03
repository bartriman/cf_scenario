import { useState, type FormEvent } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { SignUpRequestDTO, ErrorResponseDTO } from "../../types";
import { validateField } from "../../lib/validation/auth.validation";

// Stan formularza rejestracji
interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  isSubmitting: boolean;
  apiError: string | null;
}

// Błędy walidacji formularza
interface RegisterFormErrors {
  email: string | null;
  password: string | null;
  confirmPassword: string | null;
  companyName: string | null;
}

export function RegisterForm() {
  const [formState, setFormState] = useState<RegisterFormState>({
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    isSubmitting: false,
    apiError: null,
  });

  const [errors, setErrors] = useState<RegisterFormErrors>({
    email: null,
    password: null,
    confirmPassword: null,
    companyName: null,
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
    companyName: false,
  });

  const handleEmailChange = (value: string) => {
    setFormState((prev) => ({ ...prev, email: value, apiError: null }));

    // Walidacja w czasie rzeczywistym po dotknięciu pola
    if (touched.email) {
      const error = validateField("email", value);
      setErrors((prev) => ({ ...prev, email: error }));
    }
  };

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

  const handleCompanyNameChange = (value: string) => {
    setFormState((prev) => ({ ...prev, companyName: value, apiError: null }));
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    let value = "";
    let compareValue: string | undefined = undefined;

    if (field === "email") {
      value = formState.email;
    } else if (field === "password") {
      value = formState.password;
    } else if (field === "confirmPassword") {
      value = formState.confirmPassword;
      compareValue = formState.password;
    } else if (field === "companyName") {
      value = formState.companyName;
    }

    const error = validateField(field, value, compareValue);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validateForm = (): boolean => {
    const emailError = validateField("email", formState.email);
    const passwordError = validateField("password", formState.password);
    const confirmPasswordError = validateField("confirmPassword", formState.confirmPassword, formState.password);
    const companyNameError = validateField("companyName", formState.companyName);

    setErrors({
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
      companyName: companyNameError,
    });

    setTouched({
      email: true,
      password: true,
      confirmPassword: true,
      companyName: true,
    });

    return !emailError && !passwordError && !confirmPasswordError && !companyNameError;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // 1. Walidacja formularza
    const isValid = validateForm();
    if (!isValid) return;

    // 2. Ustawienie stanu loading
    setFormState((prev) => ({ ...prev, isSubmitting: true, apiError: null }));

    try {
      // 3. Wywołanie API Sign Up
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formState.email,
          password: formState.password,
          companyName: formState.companyName || undefined,
        } as SignUpRequestDTO),
      });

      // 4. Obsługa odpowiedzi
      if (!response.ok) {
        const errorData: ErrorResponseDTO = await response.json();

        // Obsługa błędów walidacji (400)
        if (response.status === 400 && errorData.error.details) {
          const newErrors: RegisterFormErrors = {
            email: null,
            password: null,
            confirmPassword: null,
            companyName: null,
          };
          errorData.error.details.forEach((detail) => {
            if (detail.field === "email") newErrors.email = detail.message;
            if (detail.field === "password") newErrors.password = detail.message;
            if (detail.field === "confirmPassword") newErrors.confirmPassword = detail.message;
            if (detail.field === "companyName") newErrors.companyName = detail.message;
          });
          setErrors(newErrors);
        } else {
          // Obsługa innych błędów
          setFormState((prev) => ({
            ...prev,
            apiError: errorData.error.message || "Wystąpił błąd podczas rejestracji",
          }));
        }

        setFormState((prev) => ({ ...prev, isSubmitting: false }));
        return;
      }

      // 5. Sukces - parsowanie odpowiedzi
      const data = await response.json();

      // 6. Przekierowanie (zgodnie z US-001 pkt 7 - automatyczne logowanie po rejestracji)
      if ("session" in data && "user" in data) {
        // Auto-login jest włączony - przekieruj do auth/callback który obsłuży redirect
        window.location.href = "/auth/callback";
      } else {
        // Email confirmation wymagane - pokaż komunikat
        setFormState((prev) => ({
          ...prev,
          apiError: data.message || "Sprawdź swoją skrzynkę email, aby potwierdzić rejestrację",
          isSubmitting: false,
        }));
      }
    } catch {
      setFormState((prev) => ({
        ...prev,
        apiError: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
        isSubmitting: false,
      }));
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Zarejestruj się</CardTitle>
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

        <form onSubmit={handleSubmit} noValidate>
          {/* Email field */}
          <div className="mb-4">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formState.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={() => handleBlur("email")}
              disabled={formState.isSubmitting}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              placeholder="twoj@email.com"
              className={errors.email && touched.email ? "border-red-500" : ""}
            />
            {errors.email && touched.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="mb-4">
            <Label htmlFor="password">Hasło</Label>
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
          <div className="mb-4">
            <Label htmlFor="confirmPassword">Powtórz hasło</Label>
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

          {/* Company Name field (optional) */}
          <div className="mb-6">
            <Label htmlFor="companyName">Nazwa firmy (opcjonalne)</Label>
            <Input
              id="companyName"
              type="text"
              value={formState.companyName}
              onChange={(e) => handleCompanyNameChange(e.target.value)}
              onBlur={() => handleBlur("companyName")}
              disabled={formState.isSubmitting}
              placeholder="Twoja firma"
            />
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
                Tworzenie konta...
              </span>
            ) : (
              "Zarejestruj się"
            )}
          </Button>

          {/* Link to login */}
          <div className="mt-4 text-center text-sm text-gray-600">
            Masz już konto?{" "}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Zaloguj się
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
