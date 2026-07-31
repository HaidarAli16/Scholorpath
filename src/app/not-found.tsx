import Link from "next/link";
import { ArrowLeft, Compass, GraduationCap } from "lucide-react";

export default function NotFound() {
  return <main className="system-state-page"><div className="system-state-brand"><GraduationCap /> ScholarPath</div><section className="system-state-card"><span><Compass /></span><small>404 · Route not found</small><h1>This pathway does not exist.</h1><p>The page may have moved, or the opportunity is no longer available in this cycle.</p><div><Link className="product-button product-button--primary" href="/today"><ArrowLeft /> Return to Today</Link><Link className="product-button product-button--secondary" href="/discover">Explore opportunities</Link></div></section></main>;
}
