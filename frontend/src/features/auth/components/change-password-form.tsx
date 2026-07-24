"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { useChangePassword } from "@/features/auth/hooks/use-change-password";
import {
  changePasswordSchema,
  validatePasswordRules,
  type ChangePasswordFormValues,
} from "@/features/auth/schemas";

export function ChangePasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const changePasswordMutation = useChangePassword();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPasswordValue = watch("newPassword");
  const rules = useMemo(
    () => validatePasswordRules(newPasswordValue ?? ""),
    [newPasswordValue],
  );
  const isLoading = isSubmitting || changePasswordMutation.isPending;

  return (
    <form
      onSubmit={handleSubmit((values) => changePasswordMutation.mutateAsync(values))}
      className="space-y-6"
      noValidate
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.currentPassword)}
            disabled={isLoading}
            {...register("currentPassword")}
          />
          {errors.currentPassword ? (
            <p className="text-destructive text-sm" role="alert">
              {errors.currentPassword.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.newPassword)}
              disabled={isLoading}
              className="pr-10"
              {...register("newPassword")}
            />
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={isLoading}
            >
              {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
            </button>
          </div>
          {errors.newPassword ? (
            <p className="text-destructive text-sm" role="alert">
              {errors.newPassword.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            disabled={isLoading}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? (
            <p className="text-destructive text-sm" role="alert">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>
      </div>

      <ul className="text-muted-foreground space-y-1 text-xs" aria-live="polite">
        <RuleItem met={rules.minLength} label="At least 8 characters" />
        <RuleItem met={rules.uppercase} label="One uppercase letter" />
        <RuleItem met={rules.lowercase} label="One lowercase letter" />
        <RuleItem met={rules.number} label="One number" />
        <RuleItem met={rules.specialCharacter} label="One special character" />
      </ul>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader size="sm" label="Updating password" />
            Updating...
          </span>
        ) : (
          "Change password"
        )}
      </Button>
    </form>
  );
}

function RuleItem({ met, label }: { met: boolean; label: string }) {
  return (
    <li className={met ? "text-foreground" : undefined}>
      {met ? "✓" : "○"} {label}
    </li>
  );
}
