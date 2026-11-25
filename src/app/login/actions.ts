"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isFreeRegistrationEnabled } from "@/lib/subscription-runtime";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) redirect("/login?error=Complet%C3%A1%20tu%20email%20y%20contrase%C3%B1a");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect("/login?error=No%20se%20pudo%20iniciar%20sesi%C3%B3n.%20Revis%C3%A1%20tus%20datos.");
  redirect("/app");
}

export async function signUp(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (fullName.length < 2 || !email || password.length < 8) {
    redirect("/login?error=Ingres%C3%A1%20tu%20nombre%2C%20un%20email%20v%C3%A1lido%20y%20una%20contrase%C3%B1a%20de%208%20caracteres%20o%20m%C3%A1s");
  }

  if (!isFreeRegistrationEnabled()) {
    redirect("/login?error=El registro gratuito no está disponible para nuevas cuentas.");
  }

  const supabase = await createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) redirect("/login?error=No%20se%20pudo%20crear%20la%20cuenta.%20Prob%C3%A1%20con%20otro%20email.");
  if (data.session) redirect("/app");
  redirect("/login?checkEmail=1");
}
