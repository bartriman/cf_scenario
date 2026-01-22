import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRegister } from "@/components/hooks/useAuth";
import { registerSchema, type RegisterFormData } from "@/lib/validation/auth.validation";

export function RegisterForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { mutate: registerUser, isPending } = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (data: RegisterFormData) => {
    registerUser(data, {
      onSuccess: (response) => {
        setSuccessMessage(
          response?.message ||
            "Account has been created! Check your email and click the verification link to activate your account."
        );
        reset();
      },
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Fill in the form to start using the application</CardDescription>
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
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              type="text"
              placeholder="My Company Inc."
              disabled={isPending}
              autoComplete="organization"
              {...register("companyName")}
            />
            {errors.companyName && <p className="text-sm text-destructive">{errors.companyName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              disabled={isPending}
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              disabled={isPending}
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
          </div>

          {successMessage && (
            <div className="p-3 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 text-sm">
              {successMessage}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Processing..." : "Register"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <a href="/auth/login" className="text-primary hover:underline font-medium">
              Log in
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
