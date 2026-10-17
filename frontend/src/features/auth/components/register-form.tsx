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
import { useRegister } from "@/features/auth/hooks/use-register";
import {
  registerSchema,
  validatePasswordRules,
  type RegisterFormValues,
} from "@/features/auth/schemas";
import { parseApiError } from "@/utils";
import { cn } from "@/utils";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const rules = useMemo(
    () => validatePasswordRules(passwordValue),
    [passwordValue],
  );
  const isLoading = isSubmitting || registerMutation.isPending;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      await registerMutation.mutateAsync(values);
    } catch (error) {
      const apiError = parseApiError(error, "Unable to create account");
      const message =
        apiError.errors?.[0] || apiError.message || "Unable to create account";

      setFormError(message);

      if (apiError.status === 409) {
        const lower = message.toLowerCase();
        if (lower.includes("email")) {
          setError("email", { type: "server", message });
        } else if (lower.includes("username")) {
          setError("username", { type: "server", message });
        }
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {formError ? (
        <p
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border px-3 py-2 text-sm"
          role="alert"
          data-testid="register-form-error"
        >
          {formError}
        </p>
      ) : null}

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              autoComplete="given-name"
              placeholder="Ada"
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={errors.firstName ? "firstName-error" : undefined}
              disabled={isLoading}
              {...register("firstName")}
            />
            {errors.firstName ? (
              <p id="firstName-error" className="text-destructive text-sm" role="alert">
                {errors.firstName.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              autoComplete="family-name"
              placeholder="Lovelace"
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={errors.lastName ? "lastName-error" : undefined}
              disabled={isLoading}
              {...register("lastName")}
            />
            {errors.lastName ? (
              <p id="lastName-error" className="text-destructive text-sm" role="alert">
                {errors.lastName.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            autoComplete="username"
            placeholder="adalovelace"
            aria-invalid={Boolean(errors.username)}
            aria-describedby={errors.username ? "username-error" : undefined}
            disabled={isLoading}
            {...register("username")}
          />
          {errors.username ? (
            <p id="username-error" className="text-destructive text-sm" role="alert">
              {errors.username.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            disabled={isLoading}
            {...register("email")}
          />
          {errors.email ? (
            <p id="email-error" className="text-destructive text-sm" role="alert">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : "password-rules"}
              disabled={isLoading}
              className="pr-10"
              {...register("password", {
                onChange: (event) => setPasswordValue(event.target.value),
              })}
            />
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" />
              ) : (
                <EyeIcon className="size-4" />
              )}
            </button>
          </div>
          {errors.password ? (
            <p id="password-error" className="text-destructive text-sm" role="alert">
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
            placeholder="Re-enter your password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword ? "confirmPassword-error" : undefined
            }
            disabled={isLoading}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword ? (
            <p
              id="confirmPassword-error"
              className="text-destructive text-sm"
              role="alert"
            >
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>
      </div>

      <ul
        id="password-rules"
        className="text-muted-foreground space-y-1 text-xs"
        aria-live="polite"
      >
        <RuleItem met={rules.minLength} label="At least 8 characters" />
        <RuleItem met={rules.uppercase} label="One uppercase letter" />
        <RuleItem met={rules.lowercase} label="One lowercase letter" />
        <RuleItem met={rules.number} label="One number" />
        <RuleItem met={rules.specialCharacter} label="One special character" />
      </ul>

      <Button type="submit" className={cn("w-full")} disabled={isLoading}>
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader size="sm" label="Creating account" />
            Creating account...
          </span>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href={ROUTES.LOGIN} className="text-primary hover:underline">
          Sign in
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
