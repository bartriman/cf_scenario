import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useUpdatePassword } from "@/components/hooks/useAuth";
import { updatePasswordSchema, type UpdatePasswordFormData } from "@/lib/validation/auth.validation";

export function UpdatePasswordForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { mutate: updatePassword, isPending } = useUpdatePassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = (data: UpdatePasswordFormData) => {
    updatePassword(data, {
      onSuccess: () => {
        setSuccessMessage("Password has been changed successfully");
      },
    });
  };

  // Redirect to login after successful password update
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Set new password</CardTitle>
          <CardDescription>Enter a new password for your account</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
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

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Processing..." : "Change password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
