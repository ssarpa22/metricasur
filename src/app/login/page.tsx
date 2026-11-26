import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; checkEmail?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect("/app");
  }

  return (
    <main className="flex min-h-screen flex-col bg-[var(--background-secondary)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent)] text-white"><BarChart3 size={22} /></span>
          <span className="text-xl font-bold tracking-tight text-[var(--foreground-secondary)]">métrica<span className="text-[var(--accent)]">sur</span></span>
        </Link>
        <Link href="/" className="text-sm font-medium text-[var(--muted-light)] hover:text-[var(--accent)]">Volver al inicio</Link>
      </header>
      <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-16">
        <div className="mb-7 text-center">
          <p className="text-xs font-bold tracking-[0.16em] text-[var(--accent)]">TU NEGOCIO, MÁS SIMPLE</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground-secondary)]">Tu espacio empieza acá.</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-light)]">Ingresá o creá tu cuenta para organizar tus negocios desde un solo lugar.</p>
        </div>

        {!isSupabaseConfigured() ? (
          <div className="rounded-2xl border border-[var(--warning-light)] bg-[var(--warning-light)]/50 p-5 text-sm leading-6 text-[var(--warning)]">
            <p className="font-semibold">Falta conectar Supabase</p>
            <p className="mt-2">Configurá <code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en tu archivo <code>.env.local</code> para habilitar el acceso.</p>
          </div>
        ) : (
          <>
            {params.error && <p role="alert" className="mb-4 rounded-xl border border-[var(--error-light)] bg-[var(--error-light)]/50 px-4 py-3 text-sm text-[var(--error)]">{params.error}</p>}
            {params.checkEmail && <p role="status" className="mb-4 rounded-xl border border-[var(--success-light)] bg-[var(--success-light)]/50 px-4 py-3 text-sm leading-6 text-[var(--success)]">¡Cuenta creada! Revisá tu email y confirmá la dirección para poder ingresar.</p>}
            <LoginForm />
          </>
        )}
      </section>
      <footer className="pb-7 text-center text-xs text-[var(--muted-light)]">© {new Date().getFullYear()} MétricaSur</footer>
    </main>
  );
}
