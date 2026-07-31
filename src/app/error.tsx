"use client";

import Link from "next/link";
import { AlertTriangle, GraduationCap, RefreshCw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="system-state-page"><div className="system-state-brand"><GraduationCap /> ScholarPath</div><section className="system-state-card"><span className="error"><AlertTriangle /></span><small>Workspace interruption</small><h1>We could not load this view.</h1><p>Your saved information has not been changed. Retry the request or return to your dashboard.</p><div><button className="product-button product-button--primary" onClick={reset}><RefreshCw /> Try again</button><Link className="product-button product-button--secondary" href="/today">Return to Today</Link></div></section></main>;
}
