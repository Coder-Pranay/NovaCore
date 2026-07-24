"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { ROUTES } from "@/constants";
import { useResetPassword } from "@/features/auth/hooks/use-reset-password";
import {
  resetPasswordSchema,
  validatePasswordRules,
  type ResetPasswordFormValues,
} from "@/features/auth/schemas";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const resetPasswordMutation = useResetPassword();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password");
  const rules = useMemo(() => validatePasswordRules(passwordValue ?? ""), [passwordValue]);
  const isLoading = isSubmitting || resetPasswordMutation.isPending;

  return (
    <form
      onSubmit={handleSubmit((values) =>
        resetPasswordMutation.mutateAsync({ ...values, token }),
      )}
      className="space-y-6"
      noValidate
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              disabled={isLoading}
              className="pr-10"
              {...register("password")}
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
          {errors.password ? (
            <p className="text-destructive text-sm" role="alert">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
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

      <Button type="submit" className="w-full" disabled={isLoading || !token}>
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader size="sm" label="Resetting password" />
            Resetting...
          </span>
        ) : (
          "Reset password"
        )}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        <Link href={ROUTES.LOGIN} className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
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
