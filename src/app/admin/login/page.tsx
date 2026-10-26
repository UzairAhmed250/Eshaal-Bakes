"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Cake, Lock } from "lucide-react";
import { adminLoginSchema } from "@/lib/validation";
import { STRINGS } from "@/lib/strings";
import { SubmitButton, TextInput } from "@/components/shared/form-fields";
import { Container, Section } from "@/components/shared/layouts";
import type { z } from "zod";

type LoginFormValues = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "admin@eshalbakes.pk",
      password: "",
      totpCode: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setServerError(data.error || "Sign in failed.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setServerError(STRINGS.common.genericError);
    }
  };

  return (
    <Section className="flex min-h-dvh items-center justify-center bg-secondary/40">
      <Container className="max-w-md">
        <div className="rounded-2xl border bg-card p-6 shadow-md sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Cake className="h-6 w-6" />
            </span>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {STRINGS.admin.loginTitle}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {STRINGS.admin.loginSubtitle}
            </p>
          </div>

          {serverError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs font-medium text-destructive"
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TextInput
              label={STRINGS.admin.emailLabel}
              type="email"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register("email")}
            />

            <TextInput
              label={STRINGS.admin.passwordLabel}
              type="password"
              autoComplete="current-password"
              placeholder="Enter admin password"
              required
              error={errors.password?.message}
              {...register("password")}
            />

            <TextInput
              label={STRINGS.admin.totpLabel}
              type="text"
              inputMode="numeric"
              placeholder="6-digit TOTP code (if enabled)"
              error={errors.totpCode?.message}
              {...register("totpCode")}
            />

            <SubmitButton
              isLoading={isSubmitting}
              loadingText="Signing in..."
              className="w-full"
            >
              <Lock className="h-4 w-4" />
              <span>{STRINGS.admin.signInButton}</span>
            </SubmitButton>
          </form>

          <div className="mt-6 rounded-lg bg-muted/70 p-3 text-[11px] text-muted-foreground">
            <p className="font-semibold text-foreground">
              Local Demo Admin Credentials:
            </p>
            <p>
              Email: <code>admin@eshalbakes.pk</code>
            </p>
            <p>
              Password: <code>KarachiBaker#2026!</code>
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
