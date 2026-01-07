import { useState, useId, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type AuthFormMode = "login" | "register" | "forgot-password" | "update-password";

interface LoginFormProps {
  mode: AuthFormMode;
  redirectTo?: string;
  onSuccess?: (redirectUrl?: string) => void;
}

export function LoginForm({ mode, redirectTo, onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const companyNameId = useId();

  const getFormConfig = () => {
    switch (mode) {
      case "login":
        return {
          title: "Zaloguj się",
          description: "Wprowadź swoje dane, aby uzyskać dostęp do konta",
          submitText: "Zaloguj się",
          footerLinks: [
            { text: "Nie masz konta?", linkText: "Zarejestruj się", href: "/auth/register" },
            { text: "Zapomniałeś hasła?", linkText: "Zresetuj hasło", href: "/auth/forgot-password" },
          ],
        };
      case "register":
        return {
          title: "Utwórz konto",
          description: "Wypełnij formularz, aby rozpocząć korzystanie z aplikacji",
          submitText: "Zarejestruj się",
          footerLinks: [{ text: "Masz już konto?", linkText: "Zaloguj się", href: "/auth/login" }],
        };
      case "forgot-password":
        return {
          title: "Zresetuj hasło",
          description: "Podaj swój adres email, a wyślemy Ci link do resetowania hasła",
          submitText: "Wyślij link",
          footerLinks: [{ text: "Wróć do", linkText: "logowania", href: "/auth/login" }],
        };
      case "update-password":
        return {
          title: "Ustaw nowe hasło",
          description: "Wprowadź nowe hasło dla swojego konta",
          submitText: "Zmień hasło",
          footerLinks: [],
        };
      default:
        return {
          title: "",
          description: "",
          submitText: "",
          footerLinks: [],
        };
    }
  };

  const validateForm = (): boolean => {
    setError(null);

    // Email validation for all modes except update-password
    if (mode !== "update-password" && !email) {
      setError("Adres email jest wymagany");
      return false;
    }

    if (mode !== "update-password" && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Wprowadź poprawny adres email");
      return false;
    }

    // Password validation for login, register, and update-password
    if (mode !== "forgot-password" && !password) {
      setError("Hasło jest wymagane");
      return false;
    }

    // Password strength validation for register and update-password
    if ((mode === "register" || mode === "update-password") && password.length < 8) {
      setError("Hasło musi zawierać co najmniej 8 znaków");
      return false;
    }

    // Confirm password validation
    if ((mode === "register" || mode === "update-password") && password !== confirmPassword) {
      setError("Hasła nie są identyczne");
      return false;
    }

    // Company name validation for register
    if (mode === "register" && !companyName.trim()) {
      setError("Nazwa firmy jest wymagana");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      let endpoint = "";
      let body: Record<string, string> = {};

      switch (mode) {
        case "login":
          endpoint = "/api/auth/login";
          body = { email, password };
          break;
        case "register":
          endpoint = "/api/auth/register";
          body = { email, password, companyName };
          break;
        case "forgot-password":
          endpoint = "/api/auth/forgot-password";
          body = { email };
          break;
        case "update-password":
          endpoint = "/api/auth/update-password";
          body = { password };
          break;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Wystąpił błąd. Spróbuj ponownie.");
      }

      // Handle success based on mode
      if (mode === "forgot-password") {
        setSuccessMessage("Link do resetowania hasła został wysłany na Twój adres email");
        setEmail("");
      } else if (mode === "update-password") {
        setSuccessMessage("Hasło zostało zmienione pomyślnie");
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 2000);
      } else {
        // For login and register, redirect to specified URL or default
        const finalRedirectUrl = redirectTo || data.redirectUrl || "/scenarios";
        if (onSuccess) {
          onSuccess(finalRedirectUrl);
        } else {
          window.location.href = finalRedirectUrl;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieznany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  const config = getFormConfig();

  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{config.title}</CardTitle>
          <CardDescription>{config.description}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Email field - for login, register, and forgot-password */}
          {mode !== "update-password" && (
            <div className="space-y-2">
              <Label htmlFor={emailId}>Adres email</Label>
              <Input
                id={emailId}
                type="email"
                placeholder="twoj@email.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="email"
              />
            </div>
          )}

          {/* Company name - only for register */}
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor={companyNameId}>Nazwa firmy</Label>
              <Input
                id={companyNameId}
                type="text"
                placeholder="Moja Firma Sp. z o.o."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="organization"
              />
            </div>
          )}

          {/* Password field - for login, register, and update-password */}
          {mode !== "forgot-password" && (
            <div className="space-y-2">
              <Label htmlFor={passwordId}>{mode === "update-password" ? "Nowe hasło" : "Hasło"}</Label>
              <Input
                id={passwordId}
                type="password"
                placeholder={mode === "login" ? "••••••••" : "Co najmniej 8 znaków"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>
          )}

          {/* Confirm password - for register and update-password */}
          {(mode === "register" || mode === "update-password") && (
            <div className="space-y-2">
              <Label htmlFor={confirmPasswordId}>Potwierdź hasło</Label>
              <Input
                id={confirmPasswordId}
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="p-3 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 text-sm">
              {successMessage}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Przetwarzanie..." : config.submitText}
          </Button>

          {/* Footer links */}
          {config.footerLinks.length > 0 && (
            <div className="text-center text-sm space-y-2">
              {config.footerLinks.map((link, index) => (
                <div key={index}>
                  <span className="text-muted-foreground">{link.text} </span>
                  <a href={link.href} className="text-primary hover:underline font-medium">
                    {link.linkText}
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
