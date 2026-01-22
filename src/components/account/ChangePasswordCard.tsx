import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useChangePassword } from "@/components/hooks/useAccount";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/lib/validation/account.validation";

export function ChangePasswordCard() {
  const { mutate: changePassword, isPending } = useChangePassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPassword = watch("newPassword");
  const confirmPassword = watch("confirmPassword");

  const onSubmit = (data: ChangePasswordFormValues) => {
    changePassword(data, {
      onSuccess: () => {
        reset();
      },
    });
  };

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Change Password
        </CardTitle>
        <CardDescription>Update your password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input id="currentPassword" type="password" disabled={isPending} {...register("currentPassword")} />
              {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" type="password" disabled={isPending} {...register("newPassword")} />
              {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" type="password" disabled={isPending} {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              Passwords do not match
            </div>
          )}

          {newPassword &&
            confirmPassword &&
            newPassword === confirmPassword &&
            newPassword.length >= 8 &&
            !errors.newPassword && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Passwords match
              </div>
            )}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Changing..." : "Change password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
