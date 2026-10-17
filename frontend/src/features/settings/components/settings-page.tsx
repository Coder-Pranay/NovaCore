"use client";

import { useState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ROUTES } from "@/constants";
import { NotificationPreferencesDialog } from "@/features/notifications/dialogs";
import { SessionsSection } from "@/features/settings/components/sessions-section";
import {
  usePreferences,
  useUpdatePreferences,
} from "@/features/settings/hooks";
import type {
  SettingsSection,
  UserPreferences,
} from "@/features/settings/types";
import {
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/features/settings/utils";
import { useTheme } from "@/hooks";
import { cn } from "@/utils";

const SECTIONS: Array<{ id: SettingsSection; label: string }> = [
  { id: "general", label: "General" },
  { id: "appearance", label: "Appearance" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "sessions", label: "Sessions" },
  { id: "preferences", label: "Preferences" },
];

export function SettingsPage() {
  const [section, setSection] = useState<SettingsSection>("general");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const preferencesQuery = usePreferences();
  const updatePreferences = useUpdatePreferences();
  const { theme, setTheme } = useTheme();

  const [draftOverride, setDraftOverride] = useState<UserPreferences | null>(
    null,
  );
  const draft = draftOverride ?? preferencesQuery.data ?? null;

  const updateDraft = (next: UserPreferences) => {
    setDraftOverride(next);
  };

  const busy = updatePreferences.isPending;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Account, security, and workspace preferences.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav
          className="flex gap-2 overflow-x-auto lg:w-52 lg:flex-col lg:overflow-visible"
          aria-label="Settings sections"
        >
          {SECTIONS.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={section === item.id ? "default" : "ghost"}
              className="justify-start"
              aria-current={section === item.id ? "page" : undefined}
              onClick={() => setSection(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="bg-card min-w-0 flex-1 rounded-xl border p-5">
          {section === "general" ? (
            <Section
              title="General"
              description="Profile shortcut and organization basics."
            >
              <div className="flex flex-wrap gap-2">
                <Link
                  href={ROUTES.PROFILE}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Open profile
                </Link>
              </div>
              {preferencesQuery.isLoading || !draft ? (
                <Skeleton className="mt-4 h-20 w-full" />
              ) : (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="org-name">Organization name</Label>
                  <Input
                    id="org-name"
                    value={draft.organizationName}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        organizationName: event.target.value,
                      })
                    }
                  />
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() => void updatePreferences.mutateAsync(draft)}
                  >
                    Save organization
                  </Button>
                </div>
              )}
            </Section>
          ) : null}

          {section === "appearance" ? (
            <Section
              title="Appearance"
              description="Theme preference uses next-themes (light / dark / system)."
            >
              <div className="flex flex-wrap items-center gap-3">
                <ThemeToggle />
                <div className="flex gap-2">
                  {(["light", "dark", "system"] as const).map((value) => (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={theme === value ? "default" : "outline"}
                      onClick={() => {
                        setTheme(value);
                        if (draft) {
                          const next = { ...draft, theme: value };
                          updateDraft(next);
                          void updatePreferences.mutateAsync(next);
                        }
                      }}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
            </Section>
          ) : null}

          {section === "security" ? (
            <Section
              title="Security"
              description="Password and account protection."
            >
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">Password</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Change your password from the dedicated security form.
                  </p>
                  <Link
                    href={ROUTES.CHANGE_PASSWORD}
                    className={cn(buttonVariants({ variant: "outline" }), "mt-3 inline-flex")}
                  >
                    Change password
                  </Link>
                </div>
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium">Active sessions</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Review and revoke signed-in devices from the Sessions tab.
                  </p>
                  <Button
                    type="button"
                    className="mt-3"
                    variant="outline"
                    onClick={() => setSection("sessions")}
                  >
                    Manage sessions
                  </Button>
                </div>
              </div>
            </Section>
          ) : null}

          {section === "notifications" ? (
            <Section
              title="Notifications"
              description="Manage in-app notification categories."
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => setNotificationsOpen(true)}
              >
                Open notification preferences
              </Button>
            </Section>
          ) : null}

          {section === "sessions" ? (
            <Section
              title="Sessions"
              description="Devices currently signed in to your NovaCore account."
            >
              <SessionsSection />
            </Section>
          ) : null}

          {section === "preferences" ? (
            <Section
              title="Preferences"
              description="Language, timezone, formats, and accessibility."
            >
              {preferencesQuery.isLoading || !draft ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void updatePreferences.mutateAsync(draft);
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldSelect
                      id="language"
                      label="Language"
                      value={draft.language}
                      onChange={(value) =>
                        updateDraft({ ...draft, language: value })
                      }
                      options={LANGUAGE_OPTIONS.map((o) => ({
                        value: o.value,
                        label: o.label,
                      }))}
                    />
                    <FieldSelect
                      id="timezone"
                      label="Timezone"
                      value={draft.timezone}
                      onChange={(value) =>
                        updateDraft({ ...draft, timezone: value })
                      }
                      options={TIMEZONE_OPTIONS.map((o) => ({
                        value: o.value,
                        label: o.label,
                      }))}
                    />
                    <FieldSelect
                      id="date-format"
                      label="Date format"
                      value={draft.dateFormat}
                      onChange={(value) =>
                        updateDraft({
                          ...draft,
                          dateFormat: value as UserPreferences["dateFormat"],
                        })
                      }
                      options={[
                        { value: "MMM d, yyyy", label: "MMM d, yyyy" },
                        { value: "dd/MM/yyyy", label: "dd/MM/yyyy" },
                        { value: "yyyy-MM-dd", label: "yyyy-MM-dd" },
                      ]}
                    />
                    <FieldSelect
                      id="number-format"
                      label="Number format"
                      value={draft.numberFormat}
                      onChange={(value) =>
                        updateDraft({
                          ...draft,
                          numberFormat: value as UserPreferences["numberFormat"],
                        })
                      }
                      options={[
                        { value: "en-US", label: "1,234.56 (US)" },
                        { value: "en-IN", label: "1,23,456.78 (IN)" },
                        { value: "de-DE", label: "1.234,56 (DE)" },
                      ]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Toggle
                      id="reduce-motion"
                      label="Reduce motion"
                      checked={draft.reduceMotion}
                      onChange={(checked) =>
                        updateDraft({ ...draft, reduceMotion: checked })
                      }
                    />
                    <Toggle
                      id="high-contrast"
                      label="High contrast"
                      checked={draft.highContrast}
                      onChange={(checked) =>
                        updateDraft({ ...draft, highContrast: checked })
                      }
                    />
                    <Toggle
                      id="compact-mode"
                      label="Compact mode"
                      checked={draft.compactMode}
                      onChange={(checked) =>
                        updateDraft({ ...draft, compactMode: checked })
                      }
                    />
                  </div>

                  <Button type="submit" disabled={busy}>
                    {busy ? "Saving..." : "Save preferences"}
                  </Button>
                </form>
              )}
            </Section>
          ) : null}

        </div>
      </div>

      <NotificationPreferencesDialog
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
      />
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {children}
    </div>
  );
}

function FieldSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "border-input bg-background flex h-9 w-full rounded-lg border px-2 text-sm outline-none",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="hover:bg-muted/40 flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm"
    >
      <span>{label}</span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4"
      />
    </label>
  );
}
