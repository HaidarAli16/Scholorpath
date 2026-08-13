"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, CalendarCheck2, Check, FileCheck2, GraduationCap, LoaderCircle, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeInternalPath } from "@/lib/auth/access";

type AuthMode = "sign-in" | "sign-up" | "forgot";

const storySlides = [
  { eyebrow: "Pathway intelligence", title: "Know your strongest route before you spend.", text: "See eligibility, funding and evidence gaps together.", icon: Sparkles, stat: "Explainable matches", tone: "blue" },
  { eyebrow: "Application control", title: "Turn every requirement into a next move.", text: "Deadlines, documents and conditions stay in one clear plan.", icon: CalendarCheck2, stat: "One accountable timeline", tone: "violet" },
  { eyebrow: "Evidence workspace", title: "Build once. Reuse across every application.", text: "Keep verified documents private, current and ready to submit.", icon: FileCheck2, stat: "Private by design", tone: "teal" },
];

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
  const [storyIndex, setStoryIndex] = useState(0);
  const redirectTo = safeInternalPath(searchParams.get("next"));
  const isAssessmentContinue = searchParams.get("reason") === "assessment";
  const story = storySlides[storyIndex];
  const StoryIcon = story.icon;

  useEffect(() => {
    if (isAssessmentContinue) setMode("sign-up");
  }, [isAssessmentContinue]);

  useEffect(() => {
    const timer = window.setInterval(() => setStoryIndex((current) => (current + 1) % storySlides.length), 5600);
    return () => window.clearInterval(timer);
  }, []);

  async function signInWithGoogle() {
    setError(null);
    if (!isSupabaseConfigured) { setError("Connect Supabase before using Google sign-in."); return; }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`;
    const { error: authError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback } });
    if (authError) { setBusy(false); setError(authError.message); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(null); setMessage(null);
    if (!isSupabaseConfigured) { setError("Supabase is not configured yet. Add the project URL and publishable key to .env.local."); return; }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true);
    if (mode === "forgot") {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/auth/update-password?next=${encodeURIComponent(redirectTo)}`)}` });
      setBusy(false); if (authError) setError(authError.message); else setMessage("Password reset instructions have been sent."); return;
    }
    if (mode === "sign-up") {
      const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`, data: { first_name: name } } });
      setBusy(false); if (authError) setError(authError.message); else if (data.session) router.replace(redirectTo); else setMessage("Check your email to confirm the account, then continue your pathway."); return;
    }
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false); if (authError) setError(authError.message); else { router.replace(redirectTo); router.refresh(); }
  }

  return <main className="auth-shell">
    <section className={`auth-story auth-story--${story.tone}`}>
      <Link className="auth-brand" href="/"><span><GraduationCap size={20} /></span> CandidRoute</Link>
      <div className="auth-story__viewport" aria-live="polite"><div className="auth-story__slide" key={storyIndex}><span className="auth-story__icon"><StoryIcon size={21} /></span><span className="product-eyebrow">{story.eyebrow}</span><h1>{story.title}</h1><p>{story.text}</p><span className="auth-story__stat"><Check size={15} /> {story.stat}</span></div></div>
      <div className="auth-story__footer"><div className="auth-story__dots" aria-label="Promotion slides">{storySlides.map((slide, index) => <button key={slide.eyebrow} type="button" className={storyIndex === index ? "active" : ""} onClick={() => setStoryIndex(index)} aria-label={`Show ${slide.eyebrow}`}><i /></button>)}</div><span className="auth-trust"><ShieldCheck size={16} /> Built for ambitious international students</span></div>
    </section>
    <section className="auth-panel"><form onSubmit={submit}>
      <span className="auth-lock"><Lock size={19} /></span>
      <h2>{mode === "sign-up" ? (isAssessmentContinue ? "Save and open your free report" : "Create your workspace") : mode === "forgot" ? "Reset your password" : "Welcome back"}</h2>
      <p>{mode === "sign-up" ? (isAssessmentContinue ? "Your assessment is ready. Create a free account so the report, top routes and next steps stay private and saved." : "Start with your own evidence and keep every route explainable.") : mode === "forgot" ? "We will send a secure recovery link to your email." : "Continue from your saved pathway and next action."}</p>
      {mode !== "forgot" && <><button className="auth-google" type="button" onClick={() => void signInWithGoogle()} disabled={busy}><span aria-hidden="true">G</span> Continue with Google</button><div className="auth-divider"><span>or continue with email</span></div></>}
      {!isSupabaseConfigured && <div className="auth-config-note">Demo mode is active. Configure Supabase in <code>.env.local</code> to enable accounts.</div>}
      {mode === "sign-up" && <label>First name<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} required autoComplete="given-name" placeholder="Haidar" /></label>}
      <label>Email address<div className="auth-input"><Mail size={16} /><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" placeholder="you@example.com" /></div></label>
      {mode !== "forgot" && <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={mode === "sign-up" ? 12 : undefined} autoComplete={mode === "sign-up" ? "new-password" : "current-password"} placeholder={mode === "sign-up" ? "At least 12 characters" : "Your password"} /></label>}
      {error && <div className="auth-message auth-message--error">{error}</div>}{message && <div className="auth-message auth-message--success">{message}</div>}
      <button className="product-button product-button--primary auth-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <>{mode === "sign-up" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}<ArrowRight size={16} /></>}</button>
      <div className="auth-switch">{mode === "sign-in" ? <><button type="button" onClick={() => setMode("forgot")}>Forgot password?</button><span>New to CandidRoute? <button type="button" onClick={() => setMode("sign-up")}>Create account</button></span></> : <button type="button" onClick={() => setMode("sign-in")}>Back to sign in</button>}</div>
      <p className="auth-legal">By continuing, you agree to the <Link href="/terms">Terms</Link> and acknowledge the <Link href="/privacy">Privacy Policy</Link>.</p>
    </form></section>
  </main>;
}
