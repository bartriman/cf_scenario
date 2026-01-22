import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useForgotPassword } from "@/components/hooks/useAuth";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validation/auth.validation";

export function ForgotPasswordForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword(data, {
      onSuccess: () => {
        setSuccessMessage("Password reset link has been sent to your email address");
        reset();
      },
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Enter your email address and we&apos;ll send you a password reset link</CardDescription>
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

          {successMessage && (
            <div className="p-3 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 text-sm">
              {successMessage}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Processing..." : "Send link"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Back to </span>
            <a href="/auth/login" className="text-primary hover:underline font-medium">
              login
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
