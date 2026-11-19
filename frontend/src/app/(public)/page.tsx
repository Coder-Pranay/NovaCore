import { ArrowDownRight, ArrowRight, FileText, FolderOpen, Image, LockKeyhole, Search, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { APP_NAME, ROUTES } from "@/constants";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const benefits = [
  {
    icon: FolderOpen,
    title: "Spaces that make sense",
    description: "Keep projects, plans, and personal files together in spaces built around your life.",
  },
  {
    icon: Search,
    title: "Find it in a moment",
    description: "A single search brings your files and spaces back into view, right when you need them.",
  },
  {
    icon: LockKeyhole,
    title: "Sharing on your terms",
    description: "Share with confidence using secure links and controls that stay in your hands.",
  },
];

export default function PublicHomePage() {
  return (
    <main id="main-content" className="relative isolate min-h-screen overflow-hidden bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_68%)]" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href={ROUTES.HOME} className="flex items-center gap-3" aria-label={`${APP_NAME} home`}>
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-bold tracking-tight text-primary-foreground shadow-lg shadow-primary/15">N</span>
          <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link href={ROUTES.LOGIN} className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:inline-flex">Sign in</Link>
          <Link href={ROUTES.REGISTER} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90">
            Get started <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-7xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1fr_0.92fr] lg:gap-16 lg:px-12 lg:pb-28 lg:pt-24">
        <div className="max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" aria-hidden="true" /> A calmer way to manage your digital life
          </div>
          <h1 className="text-5xl leading-[1.06] font-semibold tracking-[-0.045em] sm:text-6xl lg:text-[4.35rem]">
            Everything you need. <span className="text-primary">Right where it belongs.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            Bring your files, projects, and plans into one thoughtful workspace. Stay organized, find things quickly, and share securely.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href={ROUTES.REGISTER} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 hover:opacity-90">
              Create your free account <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href={ROUTES.LOGIN} className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card/60 px-6 text-sm font-semibold transition hover:bg-muted">I already have an account</Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-primary" aria-hidden="true" /> Privacy-minded by design</span>
            <span className="inline-flex items-center gap-2"><LockKeyhole className="size-3.5 text-primary" aria-hidden="true" /> You control what you share</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div aria-hidden="true" className="absolute -inset-8 -z-10 rounded-[3rem] bg-primary/10 blur-3xl" />
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl shadow-foreground/10 ring-1 ring-foreground/[0.03]">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">N</span>
                <div><p className="text-sm font-semibold">Your workspace</p><p className="text-[11px] text-muted-foreground">A little more organized</p></div>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-300"><span className="size-1.5 rounded-full bg-emerald-500" /> All caught up</span>
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex items-end justify-between gap-3">
                <div><p className="text-xs text-muted-foreground">Good morning</p><h2 className="mt-1 text-xl font-semibold tracking-tight">A place for it all.</h2></div>
                <span className="text-xs text-muted-foreground">Today <ArrowDownRight className="ml-1 inline size-3.5" aria-hidden="true" /></span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3">
                <div className="rounded-xl border border-border/70 bg-muted/30 p-3 sm:p-4"><p className="text-[10px] text-muted-foreground">Spaces</p><p className="mt-1 text-xl font-semibold">08</p><div className="mt-3 flex -space-x-1"><span className="size-4 rounded-full border-2 border-card bg-sky-400"/><span className="size-4 rounded-full border-2 border-card bg-violet-400"/><span className="size-4 rounded-full border-2 border-card bg-amber-400"/></div></div>
                <div className="rounded-xl border border-border/70 bg-muted/30 p-3 sm:p-4"><p className="text-[10px] text-muted-foreground">Your files</p><p className="mt-1 text-xl font-semibold">246</p><p className="mt-3 text-[10px] text-muted-foreground">Organized and ready</p></div>
                <div className="rounded-xl border border-border/70 bg-muted/30 p-3 sm:p-4"><p className="text-[10px] text-muted-foreground">Shared with you</p><p className="mt-1 text-xl font-semibold">12</p><p className="mt-3 text-[10px] text-muted-foreground">Across 4 spaces</p></div>
              </div>
              <div className="mt-5 flex items-center justify-between"><p className="text-xs font-semibold">Recently opened</p><span className="text-[10px] text-muted-foreground">View all <ArrowRight className="ml-1 inline size-3" aria-hidden="true" /></span></div>
              <div className="mt-2.5 space-y-2">
                <div className="flex items-center gap-3 rounded-xl border border-border/60 p-3"><span className="flex size-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-300"><FolderOpen className="size-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">Summer plans</p><p className="mt-0.5 text-[10px] text-muted-foreground">Personal · 8 items</p></div><span className="text-[10px] text-muted-foreground">2 min ago</span></div>
                <div className="flex items-center gap-3 rounded-xl border border-border/60 p-3"><span className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300"><FileText className="size-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">Project brief.pdf</p><p className="mt-0.5 text-[10px] text-muted-foreground">Work · Document</p></div><span className="text-[10px] text-muted-foreground">Yesterday</span></div>
                <div className="hidden items-center gap-3 rounded-xl border border-border/60 p-3 sm:flex"><span className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300"><Image className="size-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">Weekend inspiration</p><p className="mt-0.5 text-[10px] text-muted-foreground">Ideas · 16 images</p></div><span className="text-[10px] text-muted-foreground">Monday</span></div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-xl sm:flex lg:-left-8"><span className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><LockKeyhole className="size-4" aria-hidden="true" /></span><div><p className="text-xs font-semibold">Shared securely</p><p className="text-[10px] text-muted-foreground">Your files stay in your control</p></div></div>
        </div>
      </section>

      <section className="border-t border-border/70 bg-muted/20">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="max-w-xl"><p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">Less clutter, more clarity</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Your digital life, in good order.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">A simple home for the things you care about, designed to feel easy from the very first day.</p></div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {benefits.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
                <h3 className="mt-5 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
        <span>© {new Date().getFullYear()} {APP_NAME}. Your space, your pace.</span>
        <Link href={ROUTES.LOGIN} className="transition hover:text-foreground">Already have an account? Sign in <ArrowRight className="ml-1 inline size-3" aria-hidden="true" /></Link>
      </footer>
    </main>
  );
}
