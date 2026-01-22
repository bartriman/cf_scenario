import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLogin } from "@/components/hooks/useAuth";
import { loginSchema, type LoginFormData } from "@/lib/validation/auth.validation";

interface LoginFormNewProps {
  redirectTo?: string;
  onSuccess?: (redirectUrl?: string) => void;
}

export function LoginFormNew({ redirectTo, onSuccess }: LoginFormNewProps) {
  const { mutate: login, isPending } = useLogin();
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (shouldRedirect) {
      window.location.href = shouldRedirect;
    }
  }, [shouldRedirect]);

  const onSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: (response) => {
        const finalRedirectUrl = redirectTo || response?.redirectUrl || "/scenarios";
        if (onSuccess) {
          onSuccess(finalRedirectUrl);
        } else {
          setShouldRedirect(finalRedirectUrl);
        }
      },
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              disabled={isPending}
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              disabled={isPending}
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Processing..." : "Log in"}
          </Button>

          <div className="text-center text-sm space-y-2">
            <div>
              <span className="text-muted-foreground">Don&apos;t have an account? </span>
              <a href="/auth/register" className="text-primary hover:underline font-medium">
                Register
              </a>
            </div>
            <div>
              <span className="text-muted-foreground">Forgot password? </span>
              <a href="/auth/forgot-password" className="text-primary hover:underline font-medium">
                Reset password
              </a>
            </div>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
