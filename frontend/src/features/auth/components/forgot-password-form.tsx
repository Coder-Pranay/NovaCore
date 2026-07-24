"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { ROUTES } from "@/constants";
import { useForgotPassword } from "@/features/auth/hooks/use-forgot-password";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/features/auth/schemas";

export function ForgotPasswordForm() {
  const forgotPasswordMutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const isLoading = isSubmitting || forgotPasswordMutation.isPending;

  return (
    <form
      onSubmit={handleSubmit((values) => forgotPasswordMutation.mutateAsync(values))}
      className="space-y-6"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          aria-invalid={Boolean(errors.email)}
          disabled={isLoading}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-destructive text-sm" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader size="sm" label="Sending reset link" />
            Sending...
          </span>
        ) : (
          "Send reset link"
        )}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Remember your password?{" "}
        <Link href={ROUTES.LOGIN} className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
