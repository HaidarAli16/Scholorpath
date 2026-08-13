import Link from "next/link";
import { GraduationCap, LockKeyhole, ShieldCheck } from "lucide-react";

export default function AccessDeniedPage() {
  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Link className="auth-brand" href="/"><span><GraduationCap size={20} /></span> CandidRoute</Link>
        <div><span className="product-eyebrow">Protected workspace</span><h1>Administrative access is role-controlled.</h1><p>Student accounts cannot view research operations, platform controls, or other users&apos; records.</p></div>
        <span className="auth-trust"><ShieldCheck size={16} /> Access checks run on the server and database</span>
      </section>
      <section className="auth-panel">
        <div className="access-denied-card">
          <span className="auth-lock"><LockKeyhole size={20} /></span>
          <h2>Access denied</h2>
          <p>This signed-in account does not have the required role.</p>
          <Link className="product-button product-button--primary auth-submit" href="/today">Return to student workspace</Link>
          <form action="/auth/signout" method="post"><button className="product-button product-button--secondary auth-submit" type="submit">Sign in with another account</button></form>
        </div>
      </section>
    </main>
  );
}
