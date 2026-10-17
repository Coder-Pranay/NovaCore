"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { ROUTES } from "@/constants";
import { useLogin } from "@/features/auth/hooks/use-login";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";
import { cn } from "@/utils";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe");

  const onSubmit = handleSubmit(async (values) => {
    await loginMutation.mutateAsync(values);
  });

  const isLoading = isSubmitting || loginMutation.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="emailOrUsername">Email or username</Label>
          <Input
            id="emailOrUsername"
            type="text"
            autoComplete="username"
            placeholder="you@company.com"
            aria-invalid={Boolean(errors.emailOrUsername)}
            aria-describedby={
              errors.emailOrUsername ? "emailOrUsername-error" : undefined
            }
            disabled={isLoading}
            {...register("emailOrUsername")}
          />
          {errors.emailOrUsername ? (
            <p id="emailOrUsername-error" className="text-destructive text-sm" role="alert">
              {errors.emailOrUsername.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">Password</Label>
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-primary text-sm hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
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
            <p id="password-error" className="text-destructive text-sm" role="alert">
              {errors.password.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="rememberMe"
          checked={rememberMe}
          onCheckedChange={(checked) =>
            setValue("rememberMe", checked === true, { shouldDirty: true })
          }
          disabled={isLoading}
        />
        <Label htmlFor="rememberMe" className="font-normal">
          Remember me
        </Label>
      </div>

      <Button type="submit" className={cn("w-full")} disabled={isLoading}>
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader size="sm" label="Signing in" />
            Signing in...
          </span>
        ) : (
          "Sign in"
        )}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href={ROUTES.REGISTER} className="text-primary hover:underline">
          Create account
        </Link>
      </p>
    </form>
  );
}
