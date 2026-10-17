"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { ROUTES } from "@/constants";
import {
  useResendVerification,
  useVerifyEmail,
} from "@/features/auth/hooks/use-verify-email";
import {
  resendVerificationSchema,
  type ResendVerificationFormValues,
} from "@/features/auth/schemas";
import { cn } from "@/utils";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerification();
  const [verified, setVerified] = useState(false);
  const [verifyFailed, setVerifyFailed] = useState(false);
  const autoStarted = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResendVerificationFormValues>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (!token || autoStarted.current) {
      return;
    }
    autoStarted.current = true;
    void verifyMutation
      .mutateAsync(token)
      .then(() => setVerified(true))
      .catch(() => setVerifyFailed(true));
    // Intentionally run once per token mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verifying =
    Boolean(token) && verifyMutation.isPending && !verified && !verifyFailed;
  const resendLoading = isSubmitting || resendMutation.isPending;

  if (verified) {
    return (
      <div className="space-y-6 text-center">
        <p className="text-sm">
          Your email is verified. You can sign in to NovaCore.
        </p>
        <Link
          href={ROUTES.LOGIN}
          className={cn(buttonVariants(), "inline-flex w-full justify-center")}
        >
          Continue to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {token ? (
        <div className="space-y-3 text-center">
          {verifying ? (
            <span className="inline-flex items-center gap-2 text-sm">
              <Loader size="sm" label="Verifying email" />
              Verifying your email...
            </span>
          ) : verifyFailed ? (
            <p className="text-muted-foreground text-sm">
              Verification failed or the link expired. Request a new email
              below.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Open the link from your inbox, or resend a verification email.
        </p>
      )}

      <form
        onSubmit={handleSubmit((values) => resendMutation.mutateAsync(values))}
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
            disabled={resendLoading}
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-destructive text-sm" role="alert">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={resendLoading}>
          {resendLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader size="sm" label="Sending verification email" />
              Sending...
            </span>
          ) : (
            "Resend verification email"
          )}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        Already verified?{" "}
        <Link href={ROUTES.LOGIN} className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
