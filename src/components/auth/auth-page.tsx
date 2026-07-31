"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Check, GraduationCap, LoaderCircle, Lock, Mail, ShieldCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type AuthMode = "sign-in" | "sign-up" | "forgot";

export function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get("next") || "/today";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured yet. Add the project URL and publishable key to .env.local.");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);

    if (mode === "forgot") {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
      });
      setBusy(false);
      if (authError) setError(authError.message);
      else setMessage("Password reset instructions have been sent.");
      return;
    }

    if (mode === "sign-up") {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          data: { first_name: name },
        },
      });
      setBusy(false);
      if (authError) setError(authError.message);
      else if (data.session) router.replace(redirectTo);
      else setMessage("Check your email to confirm the account, then continue your pathway.");
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (authError) setError(authError.message);
    else {
      router.replace(redirectTo);
      router.refresh();
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Link className="auth-brand" href="/"><span><GraduationCap size={20} /></span> ScholarPath</Link>
        <div><span className="product-eyebrow">Evidence-backed admissions</span><h1>Your plan, sources, documents, and deadlines—in one private workspace.</h1><p>ScholarPath guides progress without selling consultation or inventing acceptance probabilities.</p><ul><li><Check size={16} /> Explainable programme and scholarship matches</li><li><Check size={16} /> Private reusable evidence library</li><li><Check size={16} /> Requirements converted into accountable tasks</li></ul></div>
        <span className="auth-trust"><ShieldCheck size={16} /> Built for students from Pakistan, India, and Bangladesh</span>
      </section>
      <section className="auth-panel">
        <form onSubmit={submit}>
          <span className="auth-lock"><Lock size={19} /></span>
          <h2>{mode === "sign-up" ? "Create your workspace" : mode === "forgot" ? "Reset your password" : "Welcome back"}</h2>
          <p>{mode === "sign-up" ? "Start with your own evidence and keep every route explainable." : mode === "forgot" ? "We will send a secure recovery link to your email." : "Continue from your saved pathway and next action."}</p>
          {!isSupabaseConfigured && <div className="auth-config-note">Demo mode is active. Configure Supabase in <code>.env.local</code> to enable accounts.</div>}
          {mode === "sign-up" && <label>First name<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} required autoComplete="given-name" placeholder="Haidar" /></label>}
          <label>Email address<div><Mail size={16} /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" placeholder="you@example.com" /></div></label>
          {mode !== "forgot" && <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={8} autoComplete={mode === "sign-up" ? "new-password" : "current-password"} placeholder="At least 8 characters" /></label>}
          {error && <div className="auth-message auth-message--error">{error}</div>}
          {message && <div className="auth-message auth-message--success">{message}</div>}
          <button className="product-button product-button--primary auth-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <>{mode === "sign-up" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}<ArrowRight size={16} /></>}</button>
          <div className="auth-switch">{mode === "sign-in" ? <><button type="button" onClick={() => setMode("forgot")}>Forgot password?</button><span>New to ScholarPath? <button type="button" onClick={() => setMode("sign-up")}>Create account</button></span></> : <button type="button" onClick={() => setMode("sign-in")}>Back to sign in</button>}</div>
          <Link className="auth-demo-link" href="/today">Continue in local demo mode</Link>
        </form>
      </section>
    </main>
  );
}

