"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Check, GraduationCap, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { safeInternalPath } from "@/lib/auth/access";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function UpdatePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const next = safeInternalPath(searchParams.get("next"));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 12) return setError("Use at least 12 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return setError("Authentication is not configured.");
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) return setError(updateError.message);
    router.replace(next);
    router.refresh();
  }

  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Link className="auth-brand" href="/"><span><GraduationCap size={20} /></span> CandidRoute</Link>
        <div><span className="product-eyebrow">Secure account recovery</span><h1>Restore access without exposing student evidence.</h1><p>Your recovery link creates a short-lived authenticated session before the password can be changed.</p><ul><li><Check size={16} /> Server-managed recovery session</li><li><Check size={16} /> Minimum 12-character password</li><li><Check size={16} /> Return only to an internal CandidRoute route</li></ul></div>
        <span className="auth-trust"><ShieldCheck size={16} /> Passwords are handled by Supabase Auth</span>
      </section>
      <section className="auth-panel">
        <form onSubmit={submit}>
          <span className="auth-lock"><LockKeyhole size={20} /></span>
          <h2>Set a new password</h2>
          <p>Choose a unique password you do not use on another website.</p>
          <label>New password<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" /></label>
          <label>Confirm password<input type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Repeat your new password" /></label>
          {error && <div className="auth-message auth-message--error" role="alert">{error}</div>}
          <button className="product-button product-button--primary auth-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : "Update password"}</button>
        </form>
      </section>
    </main>
  );
}
