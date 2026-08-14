"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  BookOpenCheck,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  Command,
  Database,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Filter,
  FolderOpen,
  GraduationCap,
  Globe2,
  Heart,
  Home,
  Info,
  LayoutDashboard,
  Landmark,
  ListChecks,
  LogOut,
  Lock,
  Mail,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Upload,
  UserRound,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applications, documents, opportunities, type Opportunity } from "@/modules/product/demo-data";
import { useWorkspace, type WorkspacePayload } from "@/lib/use-workspace";
import { useOpportunities, type OpportunitiesBootstrap } from "@/lib/use-opportunities";
import { loadAssessmentHandoff, saveAssessmentHandoff, type AssessmentHandoff } from "@/lib/assessment-handoff";
import { uploadStudentDocument } from "@/lib/upload-document";
import { useOperations } from "@/lib/use-operations";
import type { RecommendationResponse } from "@/components/recommendations/recommendations-page";
import { CountryFlag } from "@/components/country/country-flag";
import { ContextHelp } from "@/components/ui/contextual-help";
import type { DirectoryBootstrap } from "@/lib/use-education-directory";
import { FREE_REPORT_LIMITS, hasProAccess, type ProductAccess } from "@/lib/product/entitlements";

const TaskCommandCenter = dynamic(() => import("@/components/tasks/task-command-center").then((module) => module.TaskCommandCenter));
const OpportunityDetail = dynamic(() => import("@/components/product/frontend-completion").then((module) => module.OpportunityDetail));
const SettingsCenter = dynamic(() => import("@/components/product/frontend-completion").then((module) => module.SettingsCenter));
const StudentProfileCenter = dynamic(() => import("@/components/product/frontend-completion").then((module) => module.StudentProfileCenter));
const CountryIntelligenceCenter = dynamic(() => import("@/components/directory/education-directory").then((module) => module.CountryIntelligenceCenter));
const InstitutionDirectoryCenter = dynamic(() => import("@/components/directory/education-directory").then((module) => module.InstitutionDirectoryCenter));
const AdminControlPlane = dynamic(() => import("@/components/admin/admin-control-plane").then((module) => module.AdminControlPlane));
const RecommendationsPage = dynamic(() => import("@/components/recommendations/recommendations-page").then((module) => module.RecommendationsPage));

const primaryNav = [
  { href: "/today", label: "Today", icon: Home },
  { href: "/discover", label: "Discover", icon: Search },
  { href: "/recommendations", label: "Recommendations", icon: Sparkles },
  { href: "/countries", label: "Countries", icon: Globe2 },
  { href: "/institutions", label: "Institutions", icon: Landmark },
  { href: "/portfolio", label: "Portfolio", icon: Heart },
  { href: "/applications", label: "Applications", icon: ClipboardCheck },
  { href: "/workspace", label: "Workspace", icon: FolderOpen },
];

const workspaceNav = [
  { href: "/workspace", label: "Tasks", icon: ListChecks },
  { href: "/workspace/documents", label: "Documents", icon: FileCheck2 },
  { href: "/workspace/writing", label: "Writing", icon: FileText },
  { href: "/workspace/funding", label: "Funding", icon: WalletCards },
  { href: "/workspace/offers", label: "Offers", icon: GraduationCap },
];

type ProductAppProps = { module: string; viewerRoles?: string[]; initialAccess?: ProductAccess; initialWorkspace?: WorkspacePayload; initialHandoff?: AssessmentHandoff | null; initialOpportunities?: OpportunitiesBootstrap; initialRecommendations?: RecommendationResponse | null; initialDirectory?: DirectoryBootstrap };

export function ProductApp({ module, viewerRoles = [], ...initial }: ProductAppProps) {
  if (module === "admin") return <SuperAdminApp viewerRoles={viewerRoles} />;
  return <StudentProductApp module={module} viewerRoles={viewerRoles} {...initial} />;
}

function StudentProductApp({ module, viewerRoles = [], initialAccess = { plan: "free", active: false }, initialWorkspace, initialHandoff, initialOpportunities, initialRecommendations, initialDirectory }: ProductAppProps) {
  const pathname = usePathname();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [assessmentHandoff, setAssessmentHandoff] = useState<AssessmentHandoff | null>(initialHandoff ?? null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const claimStarted = useRef(false);
  const backend = useWorkspace(initialWorkspace, module);
  const catalogue = useOpportunities(backend.data?.portfolios, initialOpportunities);
  const opportunityItems = catalogue.items;
  const workspaceName = backend.data?.profile?.first_name || assessmentHandoff?.profile.firstName || "Student";
  const workspaceInitials = workspaceName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SP";
  const canOperate = viewerRoles.some((role) => ["research_operator", "research_reviewer", "support", "admin"].includes(role));
  const isAdmin = viewerRoles.includes("admin");
  const isPro = hasProAccess(initialAccess);
  const premiumModules = new Set(["discover", "recommendations", "countries", "institutions", "portfolio", "applications", "workspace", "documents", "writing", "funding", "offers", "opportunity"]);
  const showSubscriptionGate = backend.authenticated && !isPro && premiumModules.has(module);
  const publicCatalogueLive = !backend.authenticated && (catalogue.mode === "live" || catalogue.mode === "live-discovery");

  useEffect(() => {
    const local = loadAssessmentHandoff();
    if (local) { setAssessmentHandoff(local); return; }
    if (initialHandoff !== undefined) return;
    const controller = new AbortController();
    fetch("/api/report/latest", { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<{ report?: AssessmentHandoff["report"] | null; profile?: AssessmentHandoff["profile"] | null }> : null)
      .then((payload) => { if (payload?.report) setAssessmentHandoff({ report: payload.report, profile: payload.profile ?? {}, createdAt: payload.report.generatedAt }); })
      .catch(() => undefined);
    return () => controller.abort();
  }, [initialHandoff]);

  useEffect(() => {
    if (!backend.authenticated || !assessmentHandoff?.requiresClaim || claimStarted.current) return;
    claimStarted.current = true;
    fetch("/api/assessment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": assessmentHandoff.idempotencyKey ?? crypto.randomUUID(),
      },
      body: JSON.stringify(assessmentHandoff.profile),
    })
      .then(async (response) => {
        const payload = await response.json() as AssessmentHandoff["report"] & { error?: string };
        if (!response.ok) throw new Error(payload.error || "Your report could not be saved.");
        const claimed = { ...assessmentHandoff, report: payload, requiresClaim: false };
        saveAssessmentHandoff(claimed.profile, claimed.report, { requiresClaim: false, idempotencyKey: claimed.idempotencyKey });
        setAssessmentHandoff(claimed);
      })
      .catch(() => { claimStarted.current = false; });
  }, [assessmentHandoff, backend.authenticated]);

  useEffect(() => {
    if (!backend.authenticated) return;
    const controller = new AbortController();
    fetch("/api/notifications?unread_only=true&limit=1", { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<{ unread_count?: number }> : null)
      .then((payload) => setUnreadNotificationCount(payload?.unread_count ?? 0))
      .catch(() => undefined);
    return () => controller.abort();
  }, [backend.authenticated]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
      if (event.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const title = pageTitle(module);
  const topSection = module === "today" ? "overview" : ["discover", "recommendations", "countries", "institutions", "portfolio", "opportunity"].includes(module) ? "pathways" : module === "applications" ? "applications" : module === "documents" ? "documents" : "plan";

  return (
    <div className="product-app product-app--dashboard">
      <aside className={`product-rail ${mobileMenu ? "is-open" : ""}`}>
        <div className="product-rail__head">
            <Link prefetch={false} className="product-brand" href="/today">
            <span className="product-brand__mark"><Sparkles size={16} /></span>
            <span>CandidRoute<small>Pathway intelligence</small></span>
          </Link>
          <button className="icon-control rail-close" onClick={() => setMobileMenu(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <nav className="product-nav" aria-label="Primary navigation">
          <span className="nav-caption">Student workspace</span>
          {primaryNav.map((item) => <NavLink key={item.href} {...item} pathname={pathname} />)}
          <span className="nav-caption nav-caption--second">Workspace tools</span>
          {workspaceNav.slice(1).map((item) => <NavLink key={item.href} {...item} pathname={pathname} />)}
          {canOperate && <><span className="nav-caption nav-caption--second">Staff workspace</span><NavLink href="/operations" label="Research operations" icon={Database} pathname={pathname} />{isAdmin && <NavLink href="/admin" label="Administration" icon={ShieldCheck} pathname={pathname} />}</>}
        </nav>
        <div className="product-rail__bottom">
          <Link href="/help" title="Help & corrections" aria-label="Help & corrections"><CircleHelp size={16} /> <span>Help & corrections</span></Link>
          <Link href="/profile" title="Profile & evidence" aria-label="Profile & evidence"><UserRound size={16} /> <span>Profile & evidence</span></Link>
          <Link href="/settings" title="Settings" aria-label="Settings"><Settings size={16} /> <span>Settings</span></Link>
          <div className="rail-trust"><ShieldCheck size={17} /><span><strong>Sources visible</strong><small>No invented probability</small></span></div>
        </div>
      </aside>

      {mobileMenu && <button className="rail-scrim" onClick={() => setMobileMenu(false)} aria-label="Close navigation overlay" />}

      <main className="product-main">
        <header className="product-topbar">
          <div className="product-topbar__left">
            <button className="icon-control menu-trigger" onClick={() => setMobileMenu(true)} aria-label="Open navigation"><Menu size={19} /></button>
            <span className="mobile-product-mark"><Sparkles size={16} /></span>
            <div><small>CandidRoute</small><strong>{title}</strong></div>
          </div>
          <nav className="dashboard-topnav" aria-label="Workspace sections"><Link prefetch={false} className={topSection === "overview" ? "active" : ""} href="/today">Overview</Link><Link prefetch={false} className={topSection === "pathways" ? "active" : ""} href="/discover">Pathways</Link><Link prefetch={false} className={topSection === "applications" ? "active" : ""} href="/applications">Applications</Link><Link prefetch={false} className={topSection === "plan" ? "active" : ""} href="/workspace">Plan</Link><Link prefetch={false} className={topSection === "documents" ? "active" : ""} href="/workspace/documents">Documents</Link></nav>
          <div className="product-topbar__right">
            <button className="command-button" onClick={() => setCommandOpen(true)}><Search size={15} /><span>Search anything</span><kbd><Command size={10} /> K</kbd></button>
            <Link className="icon-control notification-control" href="/notifications" aria-label={unreadNotificationCount ? `${unreadNotificationCount} unread notifications` : "Notifications"}><Bell size={17} />{unreadNotificationCount > 0 && <i>{unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}</i>}</Link>
            <span className={`backend-state backend-state--${publicCatalogueLive ? "live" : backend.mode}`} title={publicCatalogueLive ? "Official catalogue data is live; sign in to save private work" : backend.mode === "live" ? "Changes are saved to Supabase" : backend.mode === "loading" ? "Checking data connection" : "Private workspace requires sign in"}><i />{publicCatalogueLive ? "Catalogue live" : backend.mode === "live" ? "Live" : backend.mode === "loading" ? "Checking" : backend.mode === "unauthenticated" ? "Guest" : "Unavailable"}</span>
            <Link className="profile-chip" href={backend.authenticated ? "/profile" : "/auth"}><span>{backend.authenticated ? workspaceInitials : <Lock size={14} />}</span><strong>{backend.authenticated ? workspaceName : "Sign in"}<small>{backend.authenticated ? "Private workspace" : "Save your progress"}</small></strong><ChevronDown size={14} /></Link>
          </div>
        </header>

        <div className="product-mobile-tabs">
          {primaryNav.map((item) => <NavLink key={item.href} {...item} pathname={pathname} />)}
        </div>

        <div className="product-page">
          {module === "today" && <Today items={opportunityItems} profile={backend.data?.profile} completion={backend.data?.assessment?.completion_percent} handoff={assessmentHandoff} />}
          {module === "report" && <StudentReport handoff={assessmentHandoff} directory={initialDirectory} isPro={isPro} />}
          {!showSubscriptionGate && module === "discover" && <Discover query={query} setQuery={setQuery} items={opportunityItems} catalogueMode={catalogue.mode} catalogueError={catalogue.error} backend={backend} origin={backend.data?.profile?.nationality} intake={backend.data?.assessment?.answers?.intake} />}
          {showSubscriptionGate && <SubscriptionGate />}
          {!showSubscriptionGate && module === "recommendations" && <RecommendationsPage handoff={assessmentHandoff} initialData={initialRecommendations} />}
          {!showSubscriptionGate && module === "countries" && <CountryIntelligenceCenter initialData={initialDirectory} />}
          {!showSubscriptionGate && module === "institutions" && <InstitutionDirectoryCenter initialData={initialDirectory} />}
          {!showSubscriptionGate && module === "portfolio" && <Portfolio items={opportunityItems} live={catalogue.mode === "live"} />}
          {!showSubscriptionGate && module === "applications" && <Applications workspace={backend} />}
          {!showSubscriptionGate && module === "workspace" && <Tasks />}
          {!showSubscriptionGate && module === "documents" && <Documents workspace={backend} />}
          {!showSubscriptionGate && module === "writing" && <Writing workspace={backend} />}
          {!showSubscriptionGate && module === "funding" && <Funding />}
          {!showSubscriptionGate && module === "offers" && <Offers />}
          {module === "profile" && <StudentProfileCenter />}
          {!showSubscriptionGate && module === "opportunity" && <OpportunityDetail id={pathname.split("/").pop() || ""} opportunity={opportunityItems.find((item) => item.id === pathname.split("/").pop())} />}
          {module === "settings" && <SettingsCenter />}
          {module === "settings-notifications" && <SettingsCenter section="notifications" />}
          {module === "settings-privacy" && <SettingsCenter section="privacy" />}
          {module === "settings-plan" && <SettingsCenter section="plan" />}
          {module === "notifications" && <Notifications />}
          {module === "help" && <Help />}
          {module === "operations" && <Operations />}
        </div>
      </main>
      {commandOpen && <CommandPalette viewerRoles={viewerRoles} onClose={() => setCommandOpen(false)} />}
    </div>
  );
}

function SuperAdminApp({ viewerRoles }: { viewerRoles: string[] }) {
  return (
    <div className="super-admin-app">
      <aside className="super-admin-rail">
        <Link className="product-brand" href="/admin"><span className="product-brand__mark"><ShieldCheck size={16} /></span><span>CandidRoute<small>Super Admin</small></span></Link>
        <div className="super-admin-identity"><span>HA</span><div><strong>Platform owner</strong><small>{viewerRoles.join(" · ")}</small></div></div>
        <nav aria-label="Super admin navigation">
          <span>Control centre</span>
          <Link href="/admin?tab=overview"><LayoutDashboard size={17} /> Overview</Link>
          <Link href="/admin?tab=access"><Users size={17} /> Access & plans</Link>
          <span>Content management</span>
          <Link href="/admin?tab=programmes"><GraduationCap size={17} /> Programmes</Link>
          <Link href="/admin?tab=scholarships"><WalletCards size={17} /> Scholarships</Link>
          <Link href="/admin?tab=countries"><Globe2 size={17} /> Countries</Link>
          <Link href="/admin?tab=institutions"><Landmark size={17} /> Institutions</Link>
          <span>Opportunity pipeline</span>
          <Link href="/admin?tab=sources"><Database size={17} /> Official sources</Link>
          <Link href="/admin?tab=review"><ClipboardCheck size={17} /> Review queue</Link>
          <Link href="/admin?tab=publish"><Upload size={17} /> Publishing</Link>
          <Link href="/admin?tab=health"><AlertCircle size={17} /> Source health</Link>
          <Link href="/admin?tab=runs"><Clock3 size={17} /> Fetch history</Link>
          <span>Governance</span>
          <Link href="/admin?tab=support"><CircleHelp size={17} /> Support</Link>
          <Link href="/admin?tab=audit"><ShieldCheck size={17} /> Audit history</Link>
          <Link href="/admin?tab=settings"><Settings size={17} /> Settings</Link>
        </nav>
        <div className="super-admin-rail__bottom">
          <Link href="/today"><ArrowRight size={16} /> Open student product</Link>
          <form action="/auth/signout" method="post"><button type="submit"><LogOut size={16} /> Sign out</button></form>
        </div>
      </aside>
      <main className="super-admin-main">
        <header><div><span className="product-eyebrow">Restricted platform workspace</span><h1>Super Admin</h1></div><span className="super-admin-secure"><ShieldCheck size={15} /> Server-authorized</span></header>
        <AdminControlPlane />
      </main>
    </div>
  );
}

type DetailSection = { title: string; items: string[] };
type DetailData = { eyebrow: string; title: string; description: string; status?: string; sections: DetailSection[]; primary?: string };

const commandItems = [
  { href: "/today", label: "Today", detail: "Priority action and pathway changes", icon: Home },
  { href: "/discover", label: "Discover", detail: "Verified programmes and scholarships", icon: Search },
  { href: "/countries", label: "Countries", detail: "Visa, cost, work, housing and city intelligence", icon: Globe2 },
  { href: "/institutions", label: "Institutions", detail: "Universities, rankings and qualification equivalence", icon: Landmark },
  { href: "/portfolio", label: "Portfolio", detail: "Saved routes and comparison", icon: Heart },
  { href: "/applications", label: "Applications", detail: "Requirements, evidence, and progress", icon: ClipboardCheck },
  { href: "/workspace", label: "Tasks", detail: "Deadline and dependency plan", icon: ListChecks },
  { href: "/workspace/documents", label: "Documents", detail: "Private evidence library", icon: FileCheck2 },
];

function CommandPalette({ onClose, viewerRoles }: { onClose: () => void; viewerRoles: string[] }) {
  const [search, setSearch] = useState("");
  const staff = viewerRoles.some((role) => ["research_operator", "research_reviewer", "support", "admin"].includes(role));
  const availableItems = [
    ...commandItems,
    ...(staff ? [{ href: "/operations", label: "Research operations", detail: "Sources, review, and publication", icon: Database }] : []),
    ...(viewerRoles.includes("admin") ? [{ href: "/admin", label: "Administration", detail: "Security, support, platform, and access controls", icon: ShieldCheck }] : []),
  ];
  const results = availableItems.filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="command-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="Search CandidRoute">
        <div className="command-palette__input"><Search size={20} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search routes, applications, documents, or tools" /><kbd>ESC</kbd></div>
        <div className="command-palette__label">Navigate</div>
        <div className="command-palette__results">{results.map(({ href, label, detail, icon: Icon }) => <Link key={href} href={href} onClick={onClose}><span><Icon size={18} /></span><p><strong>{label}</strong><small>{detail}</small></p><ArrowRight size={16} /></Link>)}</div>
        {results.length === 0 && <div className="command-palette__empty"><Search size={22} /><strong>No matching workspace</strong><small>Try “documents”, “applications”, or “research”.</small></div>}
        <footer><span><Command size={12} /> K to open</span><span>Evidence-backed navigation</span></footer>
      </section>
    </div>
  );
}

function DetailDrawer({ data, onClose, onPrimary }: { data: DetailData; onClose: () => void; onPrimary?: () => void }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", close); };
  }, [onClose]);
  return (
    <div className="detail-drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="detail-drawer-title">
        <header><div><span className="product-eyebrow">{data.eyebrow}</span><h2 id="detail-drawer-title">{data.title}</h2></div><button className="icon-control" onClick={onClose} aria-label="Close details"><X size={20} /></button></header>
        <div className="detail-drawer__summary">{data.status && <Status text={data.status} />}<p>{data.description}</p></div>
        <div className="detail-drawer__sections">{data.sections.map((section) => <section key={section.title}><h3>{section.title}</h3>{section.items.map((item) => <p key={item}><Check size={15} /> <span>{item}</span></p>)}</section>)}</div>
        <div className="detail-drawer__trust"><ShieldCheck size={18} /><span><strong>Transparent by design</strong><small>Evidence, uncertainty, and affected actions stay visible.</small></span></div>
        <footer><button className="product-button product-button--secondary" onClick={onClose}>Close</button>{data.primary && <button className="product-button product-button--primary" onClick={onPrimary}>{data.primary} <ArrowRight size={16} /></button>}</footer>
      </aside>
    </div>
  );
}
function NavLink({ href, label, icon: Icon, pathname }: { href: string; label: string; icon: typeof Home; pathname: string }) {
  const exact = href === "/workspace" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return <Link prefetch={false} className={exact ? "active" : ""} href={href} title={label} aria-label={label}><Icon size={17} /><span>{label}</span></Link>;
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="page-intro">
      <div><span className="product-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      {action}
    </div>
  );
}

function Today({ items, profile, completion, handoff }: { items: Opportunity[]; profile?: { first_name?: string; nationality?: string; current_country?: string } | null; completion?: number; handoff?: AssessmentHandoff | null }) {
  const [todayLabel, setTodayLabel] = useState("Today");
  const [selectedFit, setSelectedFit] = useState<Opportunity | null>(null);
  const studentName = profile?.first_name || handoff?.profile.firstName || "Student";
  const profileCompletion = completion ?? handoff?.report.profileCompleteness ?? 0;
  const origin = profile?.nationality || profile?.current_country || handoff?.profile.nationality || handoff?.profile.currentCountry || "Profile in progress";
  const studentInitials = studentName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SP";
  const verifiedRoutes = items.filter((item) => item.match === "Confirmed match").length;
  const openRoutes = items.filter((item) => item.match !== "Confirmed match").length;
  const readiness = handoff?.report.readiness ?? [];
  const readinessById = new Map(readiness.map((item) => [item.id, item]));
  const evidenceScore = readinessById.get("evidence")?.score ?? 0;
  const pathwayReadiness = readiness.length ? Math.round(readiness.reduce((total, item) => total + item.score, 0) / readiness.length) : 0;
  const priorityAction = handoff?.report.actionPlan.find((item) => !item.complete);
  const todayMoves = (handoff?.report.actionPlan ?? []).slice(0, 3).map((item) => ({ title: item.title, context: `${item.horizon} · ${item.impact} impact`, due: item.horizon, state: item.complete ? "Complete" : "To do" }));
  const alignment = (["academic", "language", "funding", "evidence"] as const).map((id) => readinessById.get(id)).filter(Boolean) as NonNullable<AssessmentHandoff>["report"]["readiness"];

  useEffect(() => { setTodayLabel(new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(new Date())); }, []);

  useEffect(() => {
    if (!selectedFit) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setSelectedFit(null);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", close);
    };
  }, [selectedFit]);

  return (
    <>
      <header className="reference-dashboard-head"><div><span className="product-eyebrow">{todayLabel}</span><h1>Welcome, {studentName}</h1><p>{handoff?.report.headline || "Your personal scholarship dashboard"}</p></div><span className="fit-freshness"><i /> Intelligence updated today</span></header>

      <div className="reference-dashboard-layout">
        <div className="reference-dashboard-main">
          <section className="reference-overview-grid">
            <article className="student-profile-card">
              <div className="student-profile-card__head"><span>Profile</span><Link href="/profile"><Settings size={17} /></Link></div>
              <div className="student-profile-card__portrait" style={{ background: `conic-gradient(#155eef ${profileCompletion}%,#eaecf0 0)` }}><span className="student-profile-card__initials">{studentInitials}</span><i>{profileCompletion}%</i></div>
              <h2>{studentName}</h2><p>{origin}</p>
              <div className="student-profile-card__stats"><span><strong>{verifiedRoutes}</strong><small>Confirmed</small></span><span><strong>{openRoutes}</strong><small>Open checks</small></span><span><strong>{items.length}</strong><small>Routes</small></span></div>
            </article>
            <div className="reference-gradient-stack">
              <div className="reference-gradient-pair">
                <article className="reference-gradient-card reference-gradient-card--warm"><div><span>Evidence<br />coverage <ContextHelp title="Evidence coverage" summary="The current strength of the evidence declared in your pathway profile." details={["Coverage can differ by application.", "Expired or route-incompatible evidence may not count.", "Open checks remain visible until resolved."]} /></span><FileCheck2 size={19} /></div><strong>{evidenceScore}%</strong><small>{readinessById.get("evidence")?.summary || "Complete your profile to calculate this"}</small></article>
                <article className="reference-gradient-card reference-gradient-card--cool"><div><span>Pathway<br />readiness <ContextHelp title="Pathway readiness" summary="The average of your academic, language, funding, evidence and execution signals—not an admission probability." details={["Programme-specific requirements still determine eligibility.", "Blocking evidence reduces readiness.", "The score recalculates when your profile changes."]} /></span><ClipboardCheck size={19} /></div><strong>{pathwayReadiness}%</strong><small>{readiness.length ? `${readiness.length} decision areas assessed` : "Complete your profile to calculate this"}</small></article>
              </div>
              <article className="reference-priority-strip"><div><span><Target size={17} /></span><p><strong>Priority move</strong><small>{priorityAction?.title || "Complete your profile"}</small></p></div><Link href="/workspace">Open task <ArrowRight size={14} /></Link></article>
            </div>
          </section>

          <section className="evidence-landscape-card">
            <div className="evidence-landscape-card__head"><div><h2>Evidence landscape</h2><p>How your pathway strength is distributed</p></div><Link href="/profile">Current profile <ArrowRight size={14} /></Link></div>
            <div className="evidence-landscape-chart">
              <span className="chart-label chart-label--one">Academic</span><span className="chart-label chart-label--two">Subject</span><span className="chart-label chart-label--three">Funding</span><span className="chart-label chart-label--four">Evidence</span>
              <svg viewBox="0 0 760 250" preserveAspectRatio="none" aria-label="Evidence category visualization">
                <defs><pattern id="dotPattern" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#d0d5dd" /></pattern></defs>
                <rect width="760" height="250" fill="url(#dotPattern)" opacity=".45" />
                <path className="evidence-line evidence-line--blue" d="M30 168 C130 48 205 208 292 102 S475 32 560 118 S675 162 730 74" />
                <path className="evidence-line evidence-line--coral" d="M30 132 C142 188 206 38 304 148 S482 220 556 138 S664 58 730 116" />
                <circle cx="292" cy="102" r="7" className="evidence-point" />
              </svg>
              <div className="evidence-chart-summary"><strong>{handoff?.report.pathways.length ?? 0}</strong><span>research pathways<br />from current evidence</span></div>
            </div>
            <div className="evidence-chart-legend"><span><i className="blue" /> Verified alignment</span><span><i className="coral" /> Conditional evidence</span><small>No admission probability inferred</small></div>
          </section>
        </div>

        <aside className="reference-dashboard-aside">
          <section className="upcoming-deadlines-card"><div className="reference-aside-head"><h2>Upcoming deadlines</h2><CalendarDays size={18} /></div>{items.slice(0, 4).map((item) => <button key={item.id} onClick={() => setSelectedFit(item)}><time><small>{item.deadline === "Deadline not confirmed" ? "Open" : item.deadline.split(" ")[1] || ""}</small><strong>{item.deadline === "Deadline not confirmed" ? "—" : item.deadline.split(" ")[0]}</strong></time><span><strong>{item.title}</strong><small>{item.provider}</small></span><ArrowRight size={15} /></button>)}{!items.length && <p>No verified deadlines are published yet.</p>}<Link href="/workspace">See full calendar <ArrowRight size={14} /></Link></section>
          <section className="developed-areas-card"><div className="reference-aside-head"><div><h2>Profile alignment</h2><p>Evidence by decision area</p></div><Sparkles size={18} /></div>{alignment.map((item) => <AlignmentBar key={item.id} label={item.label.replace(" foundation", "").replace(" evidence", "").replace(" feasibility", "").replace(" coverage", "")} state={item.state === "ready" ? "Ready" : item.state === "blocked" ? "Needs attention" : "Building"} width={`${item.score}%`} tone={item.state === "ready" ? "blue" : item.state === "blocked" ? "coral" : "amber"} />)}{!alignment.length && <p>Complete your profile to calculate each decision area.</p>}</section>
        </aside>
      </div>

      <section className="route-radar-card route-radar-card--wide">
        <div className="decision-card-head"><div><span className="product-eyebrow">Recommendation engine</span><h2>How your profile becomes a pathway</h2><p>Facts pass through evidence gates before a route is surfaced.</p></div><Link href="/discover">Explore all <ArrowRight size={14} /></Link></div>
        <div className="recommendation-flow">
          <svg className="recommendation-flow__lines" viewBox="0 0 760 330" preserveAspectRatio="none" aria-hidden="true"><path className="flow-line flow-line--blue" d="M176 165 C235 165 228 70 292 70" /><path className="flow-line flow-line--green" d="M176 165 C235 165 228 165 292 165" /><path className="flow-line flow-line--amber" d="M176 165 C235 165 228 260 292 260" /><path className="flow-line flow-line--blue" d="M445 70 C505 70 496 58 552 58" /><path className="flow-line flow-line--green" d="M445 165 C505 165 496 165 552 165" /><path className="flow-line flow-line--amber" d="M445 260 C505 260 496 272 552 272" /><circle cx="176" cy="165" r="4" /><circle cx="292" cy="70" r="4" /><circle cx="292" cy="165" r="4" /><circle cx="292" cy="260" r="4" /><circle cx="552" cy="58" r="4" /><circle cx="552" cy="165" r="4" /><circle cx="552" cy="272" r="4" /></svg>
          <div className="flow-column flow-column--profile"><span className="flow-column__label">Your profile</span><article className="flow-profile-node"><div className="flow-profile-node__ring">{profileCompletion}%</div><h3>{studentName}</h3><p>{origin}</p><div><span><Check size={13} /> {verifiedRoutes} confirmed</span><span><AlertCircle size={13} /> {openRoutes} open</span></div></article></div>
          <div className="flow-column flow-column--evidence"><span className="flow-column__label">Evidence gates</span><FlowGate icon={GraduationCap} title="Academic fit" detail="Degree aligned" state="Verified" tone="green" /><FlowGate icon={FileCheck2} title="Mathematics" detail="Module proof needed" state="Review" tone="amber" /><FlowGate icon={WalletCards} title="Funding" detail="Award dependent" state="Conditional" tone="blue" /></div>
          <div className="flow-column flow-column--routes"><span className="flow-column__label">Live pathways</span>{items.slice(0, 3).map((item, index) => <FlowRoute key={item.id} item={item} rank={index + 1} onOpen={() => setSelectedFit(item)} />)}</div>
        </div>
      </section>

      <section className="today-plan-card">
        <div className="decision-card-head"><div><span className="product-eyebrow">Momentum plan</span><h2>Three moves. One clearer pathway.</h2></div><Link href="/workspace">Open full plan <ArrowRight size={14} /></Link></div>
        <div className="today-plan-grid">{todayMoves.map((task, index) => <PlanMove key={task.title} task={task} index={index + 1} />)}{!todayMoves.length && <p>Complete your profile to create your first three moves.</p>}</div>
      </section>
      {selectedFit && <FitDetailModal item={selectedFit} onClose={() => setSelectedFit(null)} />}
    </>
  );
}

function Discover({ query, setQuery, items, catalogueMode, catalogueError, backend, origin, intake }: { query: string; setQuery: (value: string) => void; items: Opportunity[]; catalogueMode: "loading" | "live" | "live-discovery" | "unavailable"; catalogueError: string | null; backend: ReturnType<typeof useWorkspace>; origin?: string; intake?: string }) {
  const [kind, setKind] = useState("All");
  const [sort, setSort] = useState("Recommended");
  const [fundingOnly, setFundingOnly] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [searchSaved, setSearchSaved] = useState(false);
  const [saved, setSaved] = useState(() => new Set(items.filter((item) => item.saved).map((item) => item.id)));
  useEffect(() => { setSaved(new Set(items.filter((item) => item.saved).map((item) => item.id))); }, [items]);
  const filtered = useMemo(() => {
    const rows = items.filter((item) => (kind === "All" || item.kind === kind) && `${item.title} ${item.provider} ${item.country}`.toLowerCase().includes(query.toLowerCase()) && (!fundingOnly || item.kind === "Scholarship" || item.value.toLowerCase().includes("no tuition")) && (!verifiedOnly || item.freshness === "Verified"));
    return [...rows].sort((a, b) => sort === "Deadline" ? new Date(a.deadlineAt ?? "9999-12-31").getTime() - new Date(b.deadlineAt ?? "9999-12-31").getTime() : sort === "Funding" ? Number(b.value.toLowerCase().includes("fund")) - Number(a.value.toLowerCase().includes("fund")) : items.indexOf(a) - items.indexOf(b));
  }, [fundingOnly, items, kind, query, sort, verifiedOnly]);
  const toggleSaved = async (item: Opportunity) => {
    const wasSaved = saved.has(item.id);
    setSaved((current) => { const next = new Set(current); if (wasSaved) next.delete(item.id); else next.add(item.id); return next; });
    if (catalogueMode !== "live") return;
    if (!backend.authenticated) { window.location.href = "/auth?next=/discover"; return; }
    try { await backend.act({ resource: "portfolio", action: wasSaved ? "remove" : "save", entityType: item.kind === "Programme" ? "programme" : "scholarship", entityId: item.id }); }
    catch { setSaved((current) => { const next = new Set(current); if (wasSaved) next.add(item.id); else next.delete(item.id); return next; }); }
  };
  return (
    <>
      <PageIntro eyebrow="Official-source discovery" title="Find a route that fits." description="Search programmes and scholarships. We keep open checks visible." action={<div className="page-intro__actions"><ContextHelp title="Source quality" summary="Every published route links to an official source and shows how complete its details are." details={["Verified means all displayed details passed the current review workflow—not that an outcome is guaranteed.", "Provisional means the official opportunity is valid but some funding, award, deadline, or application details still need confirmation.", "Recommended sorting uses eligibility and feasibility before prestige."]} /><button className="product-button product-button--secondary" onClick={() => { setSearchSaved(true); window.setTimeout(() => setSearchSaved(false), 2400); }}><Bell size={16} /> {searchSaved ? "Search saved" : "Save search"}</button></div>} />
      <div className="discover-search"><Search size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search subject, institution, scholarship, or country" /><button className="product-button product-button--primary" onClick={() => setFiltersOpen(false)}>Search</button></div>
      <div className="discovery-toolbar">
        <div className="segment-control">{["All", "Programme", "Scholarship"].map((value) => <button key={value} className={kind === value ? "active" : ""} onClick={() => setKind(value)}>{value}</button>)}</div>
        <div><button className={`filter-button ${filtersOpen ? "active" : ""}`} onClick={() => setFiltersOpen((value) => !value)}><SlidersHorizontal size={15} /> Filters <b>{Number(fundingOnly) + Number(verifiedOnly) + 1}</b></button><label className="sort-select">Sort <select value={sort} onChange={(event) => setSort(event.target.value)}><option>Recommended</option><option>Deadline</option><option>Funding</option></select><ChevronDown size={14} /></label></div>
      </div>
      {filtersOpen && <section className="filter-panel">
        <div><span className="filter-panel__icon"><Filter size={18} /></span><p><strong>Refine verified routes</strong><small>Changes apply immediately to the result set.</small></p></div>
        <label><input type="checkbox" checked={fundingOnly} onChange={(event) => setFundingOnly(event.target.checked)} /><span><strong>Funding available</strong><small>Scholarships or tuition-light routes</small></span></label>
        <label><input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} /><span><strong>Current sources only</strong><small>Hide records with review due</small></span></label>
        <label><input type="checkbox" checked readOnly /><span><strong>{origin ? `${origin} profile` : "Origin eligibility"}</strong><small>Based on citizenship profile</small></span></label>
        <button onClick={() => { setFundingOnly(false); setVerifiedOnly(false); }}>Reset</button>
      </section>}
      <div className="active-filters"><span>{origin ? `${origin} profile` : "Origin eligibility"} <Check size={12} /></span>{fundingOnly && <span>Funding available <button onClick={() => setFundingOnly(false)}><X size={12} /></button></span>}{verifiedOnly && <span>Current sources <button onClick={() => setVerifiedOnly(false)}><X size={12} /></button></span>}{intake && <span>{intake} <Check size={12} /></span>}</div>
      <div className="results-meta"><strong>{filtered.length} researched routes</strong><span>{catalogueMode === "live" ? "Live catalogue · ranked after eligibility checks" : catalogueMode === "live-discovery" ? "Live discovery feed · third-party leads require official verification" : catalogueMode === "loading" ? "Loading verified catalogue…" : "Verified catalogue is currently unavailable"}</span></div>
      {catalogueError && <div className="auth-message auth-message--error">{catalogueError}</div>}
      <div className="opportunity-grid opportunity-grid--results">{filtered.map((item) => <OpportunityCard key={item.id} item={item} detailed saved={saved.has(item.id)} onSave={() => void toggleSaved(item)} onOpen={() => setSelected(item)} />)}</div>
      {filtered.length === 0 && <EmptyState icon={Search} title="No routes match these filters" text="Remove one condition or broaden the subject. CandidRoute will preserve the rest of your search." action="Reset filters" onAction={() => { setQuery(""); setFundingOnly(false); setVerifiedOnly(false); setKind("All"); }} />}
      {selected && <FitDetailModal item={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function StudentReport({ handoff, directory, isPro }: { handoff: AssessmentHandoff | null; directory?: DirectoryBootstrap; isPro: boolean }) {
  const [simulationId, setSimulationId] = useState("academic-evidence");
  const [storedHandoff, setStoredHandoff] = useState<AssessmentHandoff | null>(null);
  const [loadingReport, setLoadingReport] = useState(!handoff);
  const [reportError, setReportError] = useState("");
  const [exportState, setExportState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [reportView, setReportView] = useState<"summary" | "details">("summary");
  useEffect(() => {
    if (handoff) { setLoadingReport(false); return; }
    const controller = new AbortController();
    fetch("/api/report/latest", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as { report?: AssessmentHandoff["report"] | null; profile?: AssessmentHandoff["profile"] | null; error?: string };
        if (!response.ok) throw new Error(payload.error || "Your saved report could not be loaded.");
        if (payload.report) setStoredHandoff({ report: payload.report, profile: payload.profile ?? {}, createdAt: payload.report.generatedAt });
      })
      .catch((error) => { if ((error as Error).name !== "AbortError") setReportError(error instanceof Error ? error.message : "Your saved report could not be loaded."); })
      .finally(() => setLoadingReport(false));
    return () => controller.abort();
  }, [handoff]);
  const activeHandoff = handoff ?? storedHandoff;
  if (loadingReport) return <EmptyState icon={RefreshCw} title="Loading your pathway report" text="Reading the latest completed assessment and its source versions." action="Return to assessment" onAction={() => { window.location.href = "/"; }} />;
  if (!activeHandoff) return <EmptyState icon={ClipboardCheck} title="Your pathway report starts with your profile" text={reportError || "Complete the guided assessment so CandidRoute can validate your answers, expose uncertainty, and build an evidence-led action plan."} action="Start assessment" onAction={() => { window.location.href = "/"; }} />;

  const { profile, report } = activeHandoff;
  const priority = report.actionPlan.find((item) => !item.complete) ?? report.actionPlan[0];
  const intelligence = report.intelligence;
  const selectedSimulation = intelligence?.simulations.find((item) => item.id === simulationId) ?? intelligence?.simulations[0];
  const downloadPdf = async () => {
    setExportState("working");
    try {
      const response = await fetch("/api/report/pdf", { method: "POST" });
      if (!response.ok) { const payload = await response.json().catch(() => null) as { error?: string } | null; throw new Error(payload?.error || "The PDF could not be generated."); }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CandidRoute-${profile.firstName || "Student"}-Pathway-Report.pdf`;
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      setExportState("done");
      window.setTimeout(() => setExportState("idle"), 2400);
    } catch { setExportState("error"); }
  };
  return (
    <div className={`student-report student-report--${reportView}`}>
      <header className="student-report__hero">
        <div>
          <span className="product-eyebrow">Your pathway intelligence report</span>
          <h1>{report.headline}</h1>
          <p>Here is the clearest route based on what you told us. We will keep every open check visible and help you handle them one at a time.</p>
          <div className="student-report__hero-actions"><Link className="product-button product-button--primary" href="/workspace">Start action plan <ArrowRight size={16} /></Link><button className="product-button product-button--secondary" disabled={exportState === "working"} onClick={() => void downloadPdf()}><Download size={15} /> {exportState === "working" ? "Building PDF…" : exportState === "done" ? "PDF downloaded" : exportState === "error" ? "Retry PDF" : "Download PDF"}</button><button className="report-print-button" onClick={() => window.print()}>Print</button></div>
        </div>
        <div className="report-score" style={{ "--report-score": `${report.profileCompleteness * 3.6}deg` } as React.CSSProperties}>
          <span><strong>{report.profileCompleteness}%</strong><small>evidence profile</small></span>
          <p><ShieldCheck size={15} /> {report.confidence} confidence</p>
        </div>
      </header>

      <div className="report-view-toggle" role="group" aria-label="Report detail level"><button className={reportView === "summary" ? "active" : ""} onClick={() => setReportView("summary")}><Sparkles size={15} /> Quick view</button><button className={reportView === "details" ? "active" : ""} onClick={() => setReportView("details")}><Database size={15} /> Full evidence</button></div>

      <nav className="report-index" aria-label="Report sections"><span>Jump to</span><a href="#readiness">Readiness</a><a href="#pathways">Recommendations</a><a href="#actions">Action plan</a><ContextHelp title="Report snapshot" summary="This report is tied to the assessment answers, rules and source versions shown in its audit trail." details={["Reassessing creates a new version rather than silently changing this result.", "PDF export uses the same saved report data.", "Always recheck time-sensitive deadlines on the official source."]} /></nav>

      <section className="report-priority">
        <span><Target size={20} /></span>
        <div><small>Highest-impact move</small><h2>{priority?.title}</h2><p>{priority?.detail}</p></div>
        <Link href="/workspace">Open task <ArrowRight size={15} /></Link>
      </section>

      <section className="report-section" id="readiness">
        <div className="report-section__head"><div><span className="product-eyebrow">Decision profile</span><h2>Where you are ready—and what is holding you back</h2></div><p>These are preparation signals, not admission probabilities.</p></div>
        <div className="readiness-grid">
          {(report.readiness ?? []).map((dimension) => <article key={dimension.id}>
            <header><span>{dimension.label}</span><strong>{dimension.score}<small>/100</small></strong></header>
            <i><b style={{ width: `${dimension.score}%` }} /></i>
            <div><Status text={dimension.state === "ready" ? "Ready" : dimension.state === "blocked" ? "Needs attention" : "Building"} /><small className="readiness-next">{dimension.nextMove}</small></div>
          </article>)}
        </div>
      </section>

      {intelligence && <section className="report-section intelligence-map" id="pathways">
        <div className="report-section__head"><div><span className="product-eyebrow">Your recommendations</span><h2>One ranked list, with every open condition visible</h2></div><p>{intelligence.audit.evaluatedRules} rules evaluated · {intelligence.audit.unknownRules} remain open</p></div>
        <div className="intelligence-opportunities">{intelligence.opportunities.slice(0, isPro ? undefined : FREE_REPORT_LIMITS.opportunities).map((item, index) => <article key={item.id}>
          <header><span>{String(index + 1).padStart(2, "0")}</span><div><small>{item.country} · {item.kind}</small><h3>{item.title}</h3><p>{item.provider}</p></div><div className="intelligence-priority"><strong>{item.researchPriority}</strong><small>research priority</small><Status text={item.state === "aligned" ? "Aligned" : item.state === "blocked" ? "Blocked" : item.state === "stale" ? "Source review due" : "Conditional"} /></div></header>
          <div className="intelligence-components">{Object.entries(item.components).map(([key, value]) => <span key={key}><small>{key}</small><i><b style={{ width: `${value}%` }} /></i><strong>{value}</strong></span>)}</div>
          <div className="requirement-list-compact">{item.requirements.map((requirement) => <div key={requirement.id} className={`requirement-compact requirement-compact--${requirement.outcome}`}><span>{requirement.outcome === "pass" ? <Check size={14} /> : <AlertCircle size={14} />}</span><p><strong>{requirement.label}</strong><small>{requirement.actual} · expected: {requirement.expected}</small></p><em>{requirement.hard ? "Gate" : requirement.impact}</em></div>)}</div>
          <footer><span><strong>{item.confidence}% evidence confidence</strong><small>{item.source.state.replaceAll("_", " ")} · {item.source.version}</small></span><a href={item.source.url} target="_blank" rel="noreferrer">Open source <ExternalLink size={14} /></a></footer>
        </article>)}</div>
      </section>}

      {isPro && intelligence && <section className="report-section evidence-confidence-section">
        <div className="report-section__head"><div><span className="product-eyebrow">Evidence confidence</span><h2>A claim is not proof until a document supports it</h2></div><p>{intelligence.evidenceConfidence}% weighted confidence across the current profile</p></div>
        <div className="evidence-confidence-grid">{intelligence.evidenceClaims.map((claim) => <article key={claim.id}><header><span>{claim.category}</span><Status text={claim.state === "verified" ? "Verified" : claim.state === "declared" ? "Declared" : "Missing"} /></header><h3>{claim.label}</h3><div><i><b style={{ width: `${claim.confidence}%` }} /></i><strong>{claim.confidence}%</strong></div><p>{claim.sourceNeeded}</p><small>Affects: {claim.affects.join(", ")}</small></article>)}</div>
      </section>}

      {isPro && intelligence && selectedSimulation && <section className="report-section simulation-lab">
        <div className="report-section__head"><div><span className="product-eyebrow">What changes if…</span><h2>Test improvements before spending time or money</h2></div><p>Impact is recalculated from rules and evidence—not outcome probability.</p></div>
        <div className="simulation-layout"><nav aria-label="Improvement simulations">{intelligence.simulations.map((simulation) => <button key={simulation.id} className={selectedSimulation.id === simulation.id ? "active" : ""} onClick={() => setSimulationId(simulation.id)}><span><SlidersHorizontal size={16} /></span><p><strong>{simulation.title}</strong><small>{simulation.change}</small></p><ArrowRight size={15} /></button>)}</nav><article><span className="product-eyebrow">Simulated impact</span><h3>{selectedSimulation.title}</h3><p>{selectedSimulation.explanation}</p><div className="simulation-deltas"><span><strong>+{selectedSimulation.readinessDelta}</strong><small>readiness points</small></span><span><strong>+{selectedSimulation.confidenceDelta}</strong><small>confidence points</small></span><span><strong>{selectedSimulation.affectedRoutes.length}</strong><small>routes affected</small></span></div><div className="simulation-routes">{selectedSimulation.affectedRoutes.map((route) => <span key={route}><Check size={13} />{route}</span>)}</div><Link href="/workspace">{selectedSimulation.action} <ArrowRight size={14} /></Link></article></div>
      </section>}

      {isPro && intelligence && <section className="report-section portfolio-intelligence">
        <div className="report-section__head"><div><span className="product-eyebrow">Portfolio optimizer</span><h2>Balance preference, cost, funding and verification risk</h2></div><span className="portfolio-health"><strong>{intelligence.portfolio.coverage}%</strong> role coverage</span></div>
        <div>{intelligence.portfolio.slots.map((slot) => { const item = intelligence.opportunities.find((candidate) => candidate.id === slot.opportunityId); return item ? <article key={slot.opportunityId}><span>{slot.role.replaceAll("-", " ")}</span><h3>{item.title}</h3><p>{slot.reason}</p><small>{item.state} · {item.confidence}% evidence confidence</small></article> : null; })}</div>
      </section>}

      {isPro && intelligence && <details className="report-audit"><summary><span><Database size={18} /><strong>Recommendation audit trail</strong><small>{intelligence.engineVersion} · reproducible source versions</small></span><ChevronDown size={18} /></summary><div><div>{intelligence.audit.trace.map((line) => <p key={line}><Check size={14} />{line}</p>)}</div><aside><strong>Run totals</strong><span>{intelligence.audit.passedRules} passed</span><span>{intelligence.audit.unknownRules} unresolved</span><span>{intelligence.audit.failedRules} failed</span><small>Generated {new Date(intelligence.evaluatedAt).toLocaleString()}</small></aside></div></details>}

      <section className="report-section report-snapshot-section">
        <div className="report-section__head"><div><span className="product-eyebrow">Validated understanding</span><h2>The facts driving this report</h2></div><Link href="/">Reassess <RefreshCw size={14} /></Link></div>
        <div className="report-snapshot">{Object.entries(report.snapshot).map(([key, value]) => <article key={key}><span>{key}</span><strong>{value}</strong><small>{key === "academic" ? profile.institution : key === "goal" ? profile.destinationPreference === "suggest" ? "Destination selected by evidence" : `${profile.destinationPreference} preference` : "Student-declared fact"}</small></article>)}</div>
      </section>

      {isPro && <section className="report-section report-live-section">
        <div className="report-section__head"><div><span className="product-eyebrow">Live funding radar</span><h2>Scholarships worth verifying next</h2></div><span className="live-feed-label"><i /> Live discovery</span></div>
        {report.liveScholarships?.length ? <div className="live-scholarship-grid">{report.liveScholarships.map((item) => <article key={item.id}>
          <header><span>{item.country}</span><Status text="Needs verification" /></header><h3>{item.title}</h3><p>{item.provider}</p><strong>{item.value}</strong><small>{item.fundingType}</small>
          <div>{item.fitReasons.map((reason) => <p key={reason}><Check size={13} />{reason}</p>)}</div>
          <footer><a href={item.sourceUrl} target="_blank" rel="noreferrer">Verify with provider <ExternalLink size={14} /></a></footer>
        </article>)}</div> : <div className="report-feed-empty"><Database size={20} /><span><strong>Live feed unavailable</strong><small>Your validated pathway and tasks are still ready. Refresh Discover later.</small></span></div>}
        <p className="report-live-notice"><Info size={16} />{report.liveDataNotice ?? "Every live discovery item must be checked against the provider’s current official scholarship page."}</p>
      </section>}

      {!isPro && <section className="report-section free-preview-section">
        <div className="report-section__head"><div><span className="product-eyebrow">Included in your free report</span><h2>Three destinations and universities to explore first</h2></div><p>Previews only. Pro unlocks every verified record and full comparison.</p></div>
        <div className="free-preview-grid">
          <div><h3>Country previews</h3>{(directory?.countries ?? []).slice(0, FREE_REPORT_LIMITS.countries).map((country) => <article key={country.code}><CountryFlag code={country.code} name={country.name} /><span><strong>{country.name}</strong><small>{country.currencyCode} · {country.studentRoute}</small></span></article>)}</div>
          <div><h3>University previews</h3>{(directory?.institutions ?? []).slice(0, FREE_REPORT_LIMITS.institutions).map((institution) => <article key={institution.id}><CountryFlag code={institution.countryCode} name={institution.countryName} compact /><span><strong>{institution.name}</strong><small>{institution.city || institution.countryName} · {institution.programmeCount} live programmes</small></span></article>)}</div>
        </div>
      </section>}

      <section className="report-bottom-grid" id="actions">
        <article className="report-section report-actions"><div className="report-section__head"><div><span className="product-eyebrow">Action plan</span><h2>What to do next</h2></div></div>{report.actionPlan.slice(0, isPro ? undefined : 3).map((action, index) => <div key={action.id}><span>{index + 1}</span><p><small>{action.horizon} · {action.impact} impact</small><strong>{action.title}</strong><em>{action.detail}</em></p></div>)}</article>
        <article className="report-section student-report__gaps"><span className="product-eyebrow">Evidence gaps</span><h2>What prevents confirmation</h2>{report.evidenceGaps.slice(0, isPro ? undefined : FREE_REPORT_LIMITS.gaps).map((gap) => <p key={gap}><AlertCircle size={15} />{gap}</p>)}<footer><Lock size={15} /> Missing evidence becomes a task, never a guessed answer.</footer></article>
      </section>

      {!isPro && <section className="subscription-offer"><div><span className="product-eyebrow">Continue with CandidRoute Pro</span><h2>Turn this report into a complete application system.</h2><p>Unlock every eligible route, complete country and university intelligence, tasks, deadlines, applications, documents and refreshed recommendations.</p></div><Link className="product-button product-button--primary" href="/settings/plan">See Pro access <ArrowRight size={16} /></Link></section>}

      <section className="student-report__method"><ShieldCheck size={21} /><div><strong>Transparent by design</strong><p>{report.assumptions.join(" ")}</p></div></section>
    </div>
  );
}

function Portfolio({ items, live }: { items: Opportunity[]; live: boolean }) {
  const portfolioItems = live ? items.filter((item) => item.saved) : items;
  const [selected, setSelected] = useState(() => new Set(portfolioItems.slice(0, 2).map((item) => item.id)));
  const [compareOpen, setCompareOpen] = useState(false);
  const [detail, setDetail] = useState<Opportunity | null>(null);
  useEffect(() => { setSelected((current) => current.size ? current : new Set(portfolioItems.slice(0, 2).map((item) => item.id))); }, [portfolioItems]);
  const toggle = (id: string) => setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else if (next.size < 4) next.add(id); return next; });
  const selectedItems = portfolioItems.filter((item) => selected.has(item.id));
  return (
    <>
      <PageIntro eyebrow="Decision workspace" title="Build a balanced application portfolio." description="Compare academic alignment, funding dependence, deadlines, and unresolved evidence without pretending any route is guaranteed." action={<Link href="/discover" className="product-button product-button--primary"><Plus size={16} /> Add opportunity</Link>} />
      <div className="portfolio-summary">
        <div><span>{portfolioItems.length}</span><p><strong>Saved routes</strong><small>{portfolioItems.filter((item) => item.kind === "Programme").length} programmes · {portfolioItems.filter((item) => item.kind === "Scholarship").length} scholarships</small></p></div>
        <div><span>2</span><p><strong>Funding-first</strong><small>Both remain conditional</small></p></div>
        <div><span>1</span><p><strong>Review due</strong><small>Cycle source needs refresh</small></p></div>
        <button disabled={selected.size < 2} onClick={() => setCompareOpen(true)} className="product-button product-button--secondary">Compare {selected.size || "selected"}</button>
      </div>
      <div className="portfolio-guidance"><Info size={18} /><span><strong>Your shortlist is concentrated in Data and AI.</strong><small>Add one lower-cost route with current academic rules to reduce funding and source risk.</small></span><Link href="/discover">Find alternatives <ArrowRight size={15} /></Link></div>
      {live && portfolioItems.length === 0 && <EmptyState icon={Heart} title="Your portfolio is ready for its first route" text="Save a programme or scholarship from Discover. It will appear here with its live eligibility, deadline, and evidence state." action="Explore verified routes" onAction={() => { window.location.href = "/discover"; }} />}
      {["Realistic", "Funding-first", "Needs research"].map((group, groupIndex) => (
        portfolioItems.length > 0 && <section className="portfolio-group" key={group}>
          <div className="portfolio-group__head"><div><h2>{group}</h2><span>{groupIndex === 0 ? "Evidence is broadly aligned; conditions remain" : groupIndex === 1 ? "Award success is essential to affordability" : "Promising, but source evidence is incomplete"}</span></div><Status text={groupIndex === 0 ? "2 routes" : "1 route"} /></div>
          <div className="portfolio-rows">{portfolioItems.slice(groupIndex === 0 ? 0 : groupIndex + 1, groupIndex === 0 ? 2 : groupIndex + 2).map((item) => <PortfolioRow key={item.id} item={item} checked={selected.has(item.id)} onToggle={() => toggle(item.id)} onOpen={() => setDetail(item)} />)}</div>
        </section>
      ))}
      {compareOpen && <PortfolioCompare items={selectedItems} onClose={() => setCompareOpen(false)} />}
      {detail && <FitDetailModal item={detail} onClose={() => setDetail(null)} />}
    </>
  );
}

type LiveApplication = { id: string; title: string; provider_name: string; state: string; deadline_at?: string | null; official_portal_url?: string | null };
function Applications({ workspace }: { workspace: ReturnType<typeof useWorkspace> }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const applicationItems = useMemo(() => (workspace.data?.applications ?? []) as LiveApplication[], [workspace.data?.applications]);
  const selected = applicationItems.find((item) => item.id === selectedId) ?? applicationItems[0] ?? null;
  useEffect(() => { if (!selectedId && applicationItems[0]) setSelectedId(applicationItems[0].id); }, [applicationItems, selectedId]);
  return <>
    <PageIntro eyebrow="Execution" title="Move every application toward ready." description="Only applications saved in your private workspace appear here." action={<div className="page-intro__actions"><ContextHelp title="Application readiness" summary="Readiness tracks known requirements, linked evidence and required actions for one application." details={["It is recalculated from the stored application checklist.", "A missing official requirement stays visible as an open check.", "Ready to submit is not the same as likely to be admitted."]} /><button onClick={() => setCreateOpen(true)} className="product-button product-button--primary"><Plus size={16} /> Start application</button></div>} />
    {workspace.loading ? <EmptyState icon={RefreshCw} title="Loading applications" text="Reading your protected workspace." action="Refresh" onAction={() => void workspace.refresh()} /> : workspace.error ? <EmptyState icon={AlertCircle} title="Applications unavailable" text={workspace.error} action={workspace.mode === "unauthenticated" ? "Sign in" : "Retry"} onAction={() => workspace.mode === "unauthenticated" ? window.location.assign("/auth?next=/applications") : void workspace.refresh()} /> : !applicationItems.length ? <EmptyState icon={ClipboardCheck} title="No applications yet" text="Start from a verified opportunity or create a private application record." action="Start application" onAction={() => setCreateOpen(true)} /> : <div className="application-layout">
      <aside className="application-list-panel"><div className="application-list-panel__head"><strong>{applicationItems.length} applications</strong></div>{applicationItems.map((item) => <button key={item.id} className={selected?.id === item.id ? "selected" : ""} onClick={() => setSelectedId(item.id)}><span className="app-dot app-dot--blue" /><span><strong>{item.title}</strong><small>{item.provider_name}</small><em>{item.state.replaceAll("_", " ")} · {item.deadline_at ? new Date(item.deadline_at).toLocaleDateString() : "Deadline not recorded"}</em></span><ArrowRight size={14} /></button>)}</aside>
      {selected && <section className="application-detail"><div className="application-detail__hero"><div><Status text={selected.state.replaceAll("_", " ")} /><h2>{selected.title}</h2><p>{selected.provider_name}</p></div></div><div className="application-overview-grid"><section><span className="product-eyebrow">Current record</span><h3>Application data is live</h3><p>Requirements and readiness appear only after they are generated and stored for this application.</p><Link href="/workspace">Open task plan <ArrowRight size={14} /></Link></section><section><span className="product-eyebrow">Deadline</span><h3>{selected.deadline_at ? new Date(selected.deadline_at).toLocaleString() : "Not recorded"}</h3><p>Verify the final submission time on the official institution portal.</p>{selected.official_portal_url && <a href={selected.official_portal_url} target="_blank" rel="noreferrer">Open official portal <ExternalLink size={14} /></a>}</section></div></section>}
    </div>}
    {createOpen && <CreateRecordDialog kind="application" onClose={() => setCreateOpen(false)} onComplete={() => void workspace.refresh()} />}
  </>;
}

export function LegacyApplications() {
  const [createOpen, setCreateOpen] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [selected, setSelected] = useState(applications[0]);
  const [extraApplication, setExtraApplication] = useState<(typeof applications)[number] | null>(null);
  const applicationItems = extraApplication ? [...applications, extraApplication] : applications;
  const [tab, setTab] = useState("Overview");
  const [drawer, setDrawer] = useState<DetailData | null>(null);
  const requirementData = [
    { title: "Academic qualification", detail: "Bachelor degree in a related subject", state: "Confirmed" },
    { title: "Mathematics preparation", detail: "Module-level evidence required", state: "Action required" },
    { title: "English language", detail: "IELTS 6.5 overall, no component below 6.0", state: "Missing" },
    { title: "Personal statement", detail: "500–700 words; programme-specific", state: "In progress" },
  ];
  const openRequirement = (row: typeof requirementData[number]) => setDrawer({ eyebrow: "Requirement evidence", title: row.title, description: row.detail, status: row.state, sections: [{ title: "What CandidRoute checked", items: ["Published programme requirement", "Your latest profile snapshot", "Documents already linked to this application"] }, { title: "Next action", items: [row.state === "Confirmed" ? "No action required unless your evidence changes" : "Add or verify the missing evidence", "Re-check the application after the evidence is updated"] }], primary: row.state === "Confirmed" ? "View evidence" : "Resolve requirement" });
  return (
    <>
      <PageIntro eyebrow="Execution" title="Move every application toward ready." description="Requirements, evidence, writing, references, deadlines, and activity remain connected to the exact opportunity version." action={<button onClick={() => setCreateOpen(true)} className="product-button product-button--primary"><Plus size={16} /> Start application</button>} />
      <div className="application-layout">
        <aside className="application-list-panel">
          <div className="application-list-panel__head"><strong>{applicationItems.length} active</strong><button aria-label="Filter applications" onClick={() => setDrawer({ eyebrow: "Application filters", title: "Filter active applications", description: "Focus this workspace by state, deadline risk, destination, or unresolved requirement.", sections: [{ title: "Available filters", items: ["Action required or blocked", "Deadline in the next 30 days", "Programme or scholarship application"] }], primary: "Apply filters" })}><SlidersHorizontal size={15} /></button></div>
          {applicationItems.map((item) => <button key={item.id} className={selected.id === item.id ? "selected" : ""} onClick={() => { setSelected(item); setTab("Overview"); }}><span className={`app-dot app-dot--${item.tone}`} /><span><strong>{item.title}</strong><small>{item.provider}</small><em>{item.status} · {item.deadline}</em></span><ArrowRight size={14} /></button>)}
        </aside>
        <section className="application-detail">
          <div className="application-detail__hero"><div><span className="status-pill status-pill--amber">{selected.status}</span><h2>{selected.title}</h2><p>{selected.provider} · September 2027 · {selected.id}</p></div><button className="icon-control" aria-label="Application actions" onClick={() => setDrawer({ eyebrow: "Application actions", title: selected.title, description: "Manage this application without losing its evidence history.", sections: [{ title: "Available actions", items: ["Change application state", "Archive or withdraw", "Export readiness summary"] }], primary: "Update status" })}><MoreHorizontal size={18} /></button></div>
          <div className="readiness-bar"><div><span style={{ width: `${(selected.done / selected.total) * 100}%` }} /></div><p><strong>{selected.done} complete</strong><span>{selected.total - selected.done} action required</span><span>Deadline {selected.deadline} 2027</span></p></div>
          <div className="application-next"><AlertCircle size={19} /><div><small>Blocking requirement</small><strong>{selected.next}</strong><p>This dependency prevents the application from becoming ready to submit.</p></div><button onClick={() => openRequirement(requirementData[1])}>Review</button></div>
          <div className="application-tabs">{["Overview", "Requirements", "Documents", "Writing", "References", "Activity"].map((value) => <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{value}{value === "Requirements" && <b>5</b>}</button>)}</div>
          {tab === "Overview" && <div className="application-overview-grid"><section><span className="product-eyebrow">Readiness summary</span><h3>Two blockers remain</h3><p>Mathematics evidence and an English test record have the greatest effect on submission readiness.</p><button onClick={() => setTab("Requirements")}>Review requirements <ArrowRight size={14} /></button></section><section><span className="product-eyebrow">External submission</span><h3>CandidRoute prepares; you submit</h3><p>Official submission remains on the institution portal. Record the confirmation here afterward.</p><button onClick={() => window.open("https://www.leeds.ac.uk", "_blank", "noopener,noreferrer")}>Open official portal <ExternalLink size={14} /></button></section></div>}
          {tab === "Requirements" && <div className="requirement-list">{requirementData.map((row) => <Requirement key={row.title} {...row} onOpen={() => openRequirement(row)} />)}</div>}
          {tab === "Documents" && <ApplicationDocuments onOpen={() => setDrawer({ eyebrow: "Application documents", title: "Link existing evidence", description: "Reuse a private document without creating a duplicate copy.", sections: [{ title: "Available evidence", items: ["BS Transcript.pdf · needs review", "Degree Certificate.pdf · uploaded", "Passport.pdf · uploaded"] }], primary: "Link document" })} />}
          {tab === "Writing" && <ApplicationWriting />}
          {tab === "References" && <ApplicationReferences onInvite={() => setReferenceOpen(true)} />}
          {tab === "Activity" && <ApplicationActivity />}
        </section>
      </div>
      {drawer && <DetailDrawer data={drawer} onClose={() => setDrawer(null)} onPrimary={() => setDrawer(null)} />}
      {createOpen && <CreateRecordDialog kind="application" onClose={() => setCreateOpen(false)} onComplete={(record) => { if (!record) return; const next = { id: `APP-${Date.now().toString().slice(-4)}`, title: record.title, provider: record.secondary, status: "Considering", deadline: record.date ? new Date(record.date).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "No date", done: 0, total: 8, next: "Review programme requirements", tone: "blue" }; setExtraApplication(next); setSelected(next); }} />}
      {referenceOpen && <CreateRecordDialog kind="reference" onClose={() => setReferenceOpen(false)} />}
    </>
  );
}

function Tasks() {
  return <><WorkspaceTabs active="Tasks" /><TaskCommandCenter /></>;
}

function Documents({ workspace }: { workspace: ReturnType<typeof useWorkspace> }) {
  const [search, setSearch] = useState(""); const [category, setCategory] = useState("All categories"); const [drawer, setDrawer] = useState<DetailData | null>(null); const [uploadOpen, setUploadOpen] = useState(false);
  const liveDocuments = workspace.data?.documents ?? [];
  const docItems = liveDocuments.map((doc) => ({ id: doc.id, name: doc.name, category: doc.category, status: doc.status.replaceAll("_", " ").replace(/^./, (value) => value.toUpperCase()), used: "Private", updated: new Date(doc.updated_at).toLocaleDateString(undefined, { day: "numeric", month: "short" }) }));
  const categories = ["All categories", ...Array.from(new Set(docItems.map((doc) => doc.category)))]; const visible = docItems.filter((doc) => (category === "All categories" || doc.category === category) && doc.name.toLowerCase().includes(search.toLowerCase()));
  const openDocument = (doc: (typeof docItems)[number]) => setDrawer({ eyebrow: `${doc.category} · ${doc.status}`, title: doc.name, description: "Private evidence record with per-application usage and review state.", sections: [{ title: "File record", items: [`Updated ${doc.updated}`, `${doc.used} access scope`, "Original file preserved; new uploads create a version"] }, { title: "Access", items: ["Visible only to this student", "Not shared with institutions by CandidRoute", "Downloads use a short-lived signed URL"] }], primary: doc.id ? "Download file" : "Close" });
  return <><WorkspaceTabs active="Documents" /><PageIntro eyebrow="Workspace · Documents" title="One secure document library." description="Upload once, version carefully, and track acceptance separately for every application." action={<button className="product-button product-button--primary" onClick={() => setUploadOpen(true)}><Upload size={16} /> Upload document</button>} /><div className="document-summary"><Metric label="Uploaded" value={String(docItems.filter((doc) => doc.status === "Uploaded").length)} note="Private evidence" tone="green" /><Metric label="Missing" value={String(docItems.filter((doc) => doc.status === "Missing").length)} note="Requirement gaps" tone="amber" /><Metric label="Needs review" value={String(docItems.filter((doc) => doc.status.toLowerCase().includes("review")).length)} note="Before linking" tone="blue" /></div><div className="document-layout"><section className="panel"><PanelHead title="Document library" meta={`${visible.length} files`} /><div className="table-toolbar"><div><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents" /></div><select aria-label="Document category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div><div className="document-table">{visible.map((doc) => <button key={doc.id || doc.name} onClick={() => openDocument(doc)}><span className="file-icon"><FileText size={17} /></span><span><strong>{doc.name}</strong><small>{doc.category} · Updated {doc.updated}</small></span><span>{doc.used}</span><Status text={doc.status} /><ArrowRight size={16} /></button>)}</div>{!visible.length && <EmptyState icon={Search} title="No documents found" text={workspace.error || "Upload evidence or clear the current filters."} action="Clear filters" onAction={() => { setSearch(""); setCategory("All categories"); }} />}</section><aside className="upload-card" role="button" tabIndex={0} onClick={() => setUploadOpen(true)}><span><Upload size={20} /></span><h3>Drop files to upload</h3><p>PDF, JPG, or PNG up to 15 MB. Documents stay private by default.</p><button className="product-button product-button--secondary" onClick={(event) => { event.stopPropagation(); setUploadOpen(true); }}>Choose files</button><small><ShieldCheck size={13} /> Protected storage · signed access</small></aside></div>{drawer && <DetailDrawer data={drawer} onClose={() => setDrawer(null)} onPrimary={() => { const doc = docItems.find((item) => item.name === drawer.title); if (doc?.id) window.location.href = `/api/documents/${doc.id}/download`; else setDrawer(null); }} />}{uploadOpen && <DocumentUploadDialog onClose={() => setUploadOpen(false)} onComplete={() => { setUploadOpen(false); void workspace.refresh(); }} />}</>;
}

function Writing({ workspace }: { workspace: ReturnType<typeof useWorkspace> }) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const items = [{ title: "Personal statement", app: "University of Leeds", progress: "Outline complete", words: "0 / 700" },{ title: "Leadership essay", app: "Chevening", progress: "Draft in progress", words: "412 / 500" },{ title: "Motivation letter", app: "Saarland University", progress: "Prompt captured", words: "0 / 1,000" }];
  const [selected, setSelected] = useState(items[0]); const [editorOpen, setEditorOpen] = useState(false); const [draft, setDraft] = useState("");
  const save = async () => { setSaveState("saving"); if (!workspace.authenticated) { window.location.href = "/auth?next=/workspace/writing"; return; } try { await workspace.act({ resource: "writing", action: "create", title: selected.title, draft }); setSaveState("saved"); setEditorOpen(false); } catch { setSaveState("error"); } };
  return <><WorkspaceTabs active="Writing" /><PageIntro eyebrow="Workspace · Writing" title="Write with evidence, not templates." description="Break prompts into claims, reuse verified evidence, and keep every final draft application-specific." action={<button className="product-button product-button--primary" onClick={() => setEditorOpen(true)}><Plus size={16} /> New writing item</button>} /><div className="writing-layout"><section className="panel writing-list"><PanelHead title="Active writing" meta="3 items" />{items.map((item) => <WritingRow key={item.title} {...item} active={selected.title === item.title} onOpen={() => { setSelected(item); setEditorOpen(false); }} />)}</section><section className={`writing-preview ${editorOpen ? "writing-preview--editor" : ""}`}><div className="writing-preview__top"><span className="status-pill status-pill--blue">{editorOpen ? "Draft" : "Evidence outline"}</span><button aria-label="Writing actions" onClick={() => setEditorOpen(true)}><MoreHorizontal size={18} /></button></div><h2>{selected.title}</h2><p className="writing-prompt">Explain your preparation, motivation, and how this opportunity supports a specific future plan.</p>{editorOpen ? <><div className="editor-guidance"><Info size={16} /><span><strong>Ground every claim.</strong> Organize your own evidence without inventing achievements.</span></div><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Start with a concrete experience and the result…" /><div className="editor-footer"><span>{draft.trim() ? draft.trim().split(/\s+/).length : 0} words</span><button className="product-button product-button--secondary" disabled={saveState === "saving"} onClick={() => void save()}>{saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Try again" : "Save draft"}</button></div></> : <><div className="outline-step"><span>01</span><div><strong>Academic foundation</strong><p>Connect verified modules to the skills named in the prompt.</p></div><Check size={16} /></div><div className="outline-step"><span>02</span><div><strong>Evidence story</strong><p>Add one project where your work changed a measurable outcome.</p></div><Plus size={16} /></div><div className="outline-step"><span>03</span><div><strong>Programme connection</strong><p>Use only current, source-checked programme details.</p></div><Plus size={16} /></div><button className="product-button product-button--primary" onClick={() => setEditorOpen(true)}>Open editor <ArrowRight size={15} /></button></>}</section></div></>;
}
function Funding() {
  const [createOpen, setCreateOpen] = useState(false);
  const [drawer, setDrawer] = useState<DetailData | null>(null);
  const openScenario = (title: string) => setDrawer({ eyebrow: "Funding scenario", title, description: "Editable planning model. Conditional scholarships do not reduce the confirmed funding gap.", sections: [{ title: "First-year cost", items: ["Tuition · official fee source", "Living costs · editable planning assumption", "Travel, visa, insurance, and setup"] }, { title: "Funding evidence", items: ["Documented family contribution · PKR 3.4m", "Confirmed awards · PKR 0", "Conditional awards shown separately"] }], primary: "Edit assumptions" });
  return (
    <>
      <WorkspaceTabs active="Funding" />
      <PageIntro eyebrow="Workspace · Funding" title="Know the gap before you commit." description="Separate confirmed funding from conditional awards and editable cost assumptions." action={<button className="product-button product-button--primary" onClick={() => setCreateOpen(true)}><Plus size={16} /> New scenario</button>} />
      <div className="funding-hero"><div><span>Current first-year gap</span><strong>PKR 5.8m</strong><small>Leeds · without a confirmed award</small></div><div className="funding-bar"><span style={{ width: "38%" }} /><i style={{ left: "67%" }} /></div><div className="funding-legend"><span><i className="funded" /> Documented contribution · PKR 3.4m</span><span><i className="gap" /> Remaining gap · PKR 5.8m</span></div></div>
      <div className="scenario-grid"><Scenario title="Leeds · self-funded baseline" cost="PKR 9.2m" gap="PKR 5.8m gap" state="Funding unresolved" onOpen={() => openScenario("Leeds · self-funded baseline")} /><Scenario title="Leeds + Chevening" cost="PKR 9.2m" gap="Award not confirmed" state="Conditional" onOpen={() => openScenario("Leeds + Chevening")} /><Scenario title="Saarland baseline" cost="PKR 3.1m" gap="Within contribution" state="Potentially covered" onOpen={() => openScenario("Saarland baseline")} /></div>
      <section className="panel assumptions"><PanelHead title="Cost assumptions" meta="Last reviewed 25 Jul" /><div><Assumption label="Tuition" value="£31,000" source="University fee page" onEdit={() => openScenario("Edit tuition assumption")} /><Assumption label="Living costs" value="£12,500" source="Planning assumption" onEdit={() => openScenario("Edit living-cost assumption")} /><Assumption label="Travel & setup" value="£1,600" source="Student estimate" onEdit={() => openScenario("Edit travel assumption")} /><Assumption label="Exchange rate" value="PKR 376 / GBP" source="Display assumption" onEdit={() => openScenario("Edit exchange-rate assumption")} /></div></section>
      {drawer && <DetailDrawer data={drawer} onClose={() => setDrawer(null)} onPrimary={() => setDrawer(null)} />}
      {createOpen && <CreateRecordDialog kind="funding" onClose={() => setCreateOpen(false)} />}
    </>
  );
}

function Offers() {
  const [createOpen, setCreateOpen] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [drawer, setDrawer] = useState<DetailData | null>(null);
  const addOffer = () => setCreateOpen(true);
  const openOffer = () => setDrawer({ eyebrow: "Conditional offer · Leeds", title: "MSc Data Science and Analytics", description: "Recorded offer with academic, language and deposit conditions separated into trackable actions.", sections: [{ title: "Conditions", items: ["Final transcript and degree certificate", "IELTS 6.5 overall; 6.0 each component", "Accept and pay deposit by 18 March 2027"] }, { title: "Decision context", items: ["First-year funding gap · PKR 5.8m", "Chevening remains conditional", "Response deadline displayed in Asia/Karachi"] }], primary: "Open decision workspace" });
  return (
    <>
      <WorkspaceTabs active="Offers" />
      <PageIntro eyebrow="Workspace · Offers" title="Decide with the full picture." description="Conditions, confirmed funding, deposits, response dates, and priorities—side by side." action={<button className="product-button product-button--primary" onClick={addOffer}><Plus size={16} /> Add offer</button>} />
      {recorded ? <section className="recorded-offer"><header><div><span className="country-mark">GB</span><span><small>Conditional offer</small><h2>MSc Data Science and Analytics</h2><p>University of Leeds · September 2027</p></span></div><Status text="Action required" /></header><div><span><small>Response due</small><strong>18 Mar 2027</strong></span><span><small>Conditions open</small><strong>3</strong></span><span><small>Confirmed funding</small><strong>PKR 3.4m</strong></span><span><small>First-year gap</small><strong>PKR 5.8m</strong></span></div><footer><span><AlertCircle size={15} /> English evidence is the highest-impact condition.</span><button onClick={openOffer}>Review offer <ArrowRight size={14} /></button></footer></section> : <EmptyState icon={GraduationCap} title="No offers recorded yet" text="When an institution responds, add the offer and CandidRoute will turn its conditions and response date into tasks." action="Add first offer" onAction={addOffer} />}
      <div className="offer-preview"><span className="product-eyebrow">Comparison framework</span><div><OfferFeature icon={BookOpenCheck} title="Offer conditions" text="Track academic, language, deposit, and document conditions." /><OfferFeature icon={WalletCards} title="Net cost" text="Compare confirmed awards and the remaining first-year gap." /><OfferFeature icon={Clock3} title="Decision dates" text="Keep response and deposit deadlines visible in your timezone." /></div></div>
      {drawer && <DetailDrawer data={drawer} onClose={() => setDrawer(null)} onPrimary={() => setDrawer(null)} />}
      {createOpen && <CreateRecordDialog kind="offer" onClose={() => setCreateOpen(false)} onComplete={() => setRecorded(true)} />}
    </>
  );
}
// Kept briefly as a visual fallback while the live notification surface owns `/notifications`.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LegacyNotifications() {
  const [filter, setFilter] = useState("All");
  const [read, setRead] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<DetailData | null>(null);
  const notices = [
    { icon: AlertCircle, tone: "amber", category: "Requirements", title: "Leeds requirement needs your review", text: "The official programme page and catalogue describe mathematics preparation differently.", time: "18 min ago" },
    { icon: Database, tone: "blue", category: "Sources", title: "Chevening 2027–28 timeline verified", text: "Applications open 4 August 2026 and close 6 October 2026 at 11:00 UTC.", time: "2 hours ago" },
    { icon: Clock3, tone: "slate", category: "Deadlines", title: "Transcript request due in 3 days", text: "This task is assigned to you and blocks two active applications.", time: "Yesterday" },
    { icon: ShieldCheck, tone: "green", category: "Security", title: "New sign-in confirmed", text: "Windows · Pakistan · 24 July at 21:14 PKT.", time: "Yesterday" },
  ];
  const visible = notices.filter((item) => filter === "All" || item.category === filter);
  return (
    <>
      <PageIntro eyebrow="Updates" title="Notifications." description="Deadline, source, requirement, and security changes—not engagement noise." action={<Link className="product-button product-button--secondary" href="/settings/notifications"><Settings size={16} /> Preferences</Link>} />
      <div className="notice-filters">{["All", "Deadlines", "Requirements", "Sources", "Security"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}<button onClick={() => setRead(new Set(notices.map((item) => item.title)))}>Mark all read</button></div>
      <section className="panel notification-list">{visible.map((item) => <Notice key={item.title} {...item} read={read.has(item.title)} onOpen={() => { setRead((current) => new Set(current).add(item.title)); setDrawer({ eyebrow: `${item.category} · ${item.time}`, title: item.title, description: item.text, sections: [{ title: "Why you received this", items: ["This change affects an active route or account", "The notification keeps its source and event history", "Actions are recorded in your workspace"] }], primary: item.category === "Security" ? "Review security" : "Open affected item" }); }} />)}</section>
      {drawer && <DetailDrawer data={drawer} onClose={() => setDrawer(null)} onPrimary={() => setDrawer(null)} />}
    </>
  );
}

type StudentNotification = { id: string; category: string; title: string; body: string; action_url?: string | null; priority?: string | null; read_at?: string | null; created_at: string };

function Notifications() {
  const [filter, setFilter] = useState("All");
  const [items, setItems] = useState<StudentNotification[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [drawer, setDrawer] = useState<DetailData | null>(null);
  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const payload = await response.json() as { notifications?: StudentNotification[] };
      setItems(payload.notifications ?? []);
      setStatus("ready");
    } catch { setStatus("error"); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const categories = ["All", ...Array.from(new Set(items.map((item) => item.category))).slice(0, 5)];
  const visible = items.filter((item) => filter === "All" || item.category === filter);
  const markRead = async (ids?: string[], all = false) => {
    const response = await fetch("/api/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(all ? { all: true } : { ids }) });
    if (!response.ok) return;
    const now = new Date().toISOString();
    setItems((current) => current.map((item) => all || ids?.includes(item.id) ? { ...item, read_at: item.read_at ?? now } : item));
  };
  return <>
    <PageIntro eyebrow="Updates" title="Notifications." description="Deadline, source, requirement, and security changes—not engagement noise." action={<Link className="product-button product-button--secondary" href="/settings/notifications"><Settings size={16} /> Preferences</Link>} />
    <div className="notice-filters">{categories.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}<button disabled={!items.some((item) => !item.read_at)} onClick={() => void markRead(undefined, true)}>Mark all read</button></div>
    {status === "loading" && <section className="panel notification-list notification-list__state"><RefreshCw className="spin" size={18} /> Loading updates…</section>}
    {status === "error" && <section className="panel notification-list notification-list__state"><AlertCircle size={18} /> Updates could not load.<button onClick={() => void load()}>Try again</button></section>}
    {status === "ready" && <section className="panel notification-list">{visible.length ? visible.map((item) => <LiveNotice key={item.id} item={item} onOpen={() => { if (!item.read_at) void markRead([item.id]); setDrawer({ eyebrow: `${item.category} · ${relativeTime(item.created_at)}`, title: item.title, description: item.body, sections: [{ title: "Why you received this", items: ["This update was generated for your private workspace", "Its source and event history remain recorded", "Open the linked route to act on the change"] }], primary: item.action_url ? "Open affected item" : "Close" }); }} />) : <div className="notification-list__empty"><Bell size={20} /><strong>No updates in this view</strong><span>New source, deadline and pathway changes will appear here.</span></div>}</section>}
    {drawer && <DetailDrawer data={drawer} onClose={() => setDrawer(null)} onPrimary={() => { if (drawer.primary === "Open affected item") { const target = items.find((item) => item.title === drawer.title)?.action_url; if (target) window.location.assign(target); } setDrawer(null); }} />}
  </>;
}

function LiveNotice({ item, onOpen }: { item: StudentNotification; onOpen: () => void }) {
  const category = item.category.toLowerCase();
  const icon = category.includes("deadline") ? Clock3 : category.includes("source") ? Database : category.includes("security") ? ShieldCheck : category.includes("require") ? AlertCircle : Bell;
  const tone = item.priority === "critical" || item.priority === "high" ? "amber" : category.includes("source") ? "blue" : category.includes("security") ? "green" : "slate";
  return <Notice icon={icon} tone={tone} title={item.title} text={item.body} time={relativeTime(item.created_at)} read={Boolean(item.read_at)} onOpen={onOpen} />;
}

function relativeTime(value: string) { const elapsed = Math.max(0, Date.now() - new Date(value).valueOf()); const minutes = Math.round(elapsed / 60000); if (minutes < 1) return "Just now"; if (minutes < 60) return `${minutes}m ago`; const hours = Math.round(minutes / 60); if (hours < 24) return `${hours}h ago`; return `${Math.round(hours / 24)}d ago`; }

function Help() {
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [drawer, setDrawer] = useState<DetailData | null>(null);
  const cards = [
    { icon: CircleHelp, title: "Using CandidRoute", text: "Profiles, match states, portfolios, applications, and tasks." },
    { icon: Database, title: "Sources & verification", text: "How facts are captured, reviewed, corrected, and refreshed." },
    { icon: ShieldCheck, title: "Privacy & documents", text: "Document access, sharing, exports, and account deletion." },
  ];
  const visible = cards.filter((card) => `${card.title} ${card.text}`.toLowerCase().includes(query.toLowerCase()));
  const correction = () => setCorrectionOpen(true);
  return (
    <>
      <PageIntro eyebrow="Support & corrections" title="Get help without losing context." description="Ask about the product or report a specific programme, scholarship, deadline, or rule that looks wrong." />
      <div className="help-search"><Search size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search help articles" /></div>
      <div className="help-grid">{visible.map((card) => <HelpCard key={card.title} {...card} onOpen={() => setDrawer({ eyebrow: "Help guide", title: card.title, description: card.text, sections: [{ title: "Popular guidance", items: ["Understand states and source freshness", "Resolve blockers in the right order", "Keep evidence private and reusable"] }], primary: "Open guide" })} />)}</div>
      {!visible.length && <EmptyState icon={Search} title="No guide matched" text="Try a broader phrase or start a contextual support request." action="Clear search" onAction={() => setQuery("")} />}
      <section className="correction-card"><div><span className="product-eyebrow">Found incorrect information?</span><h2>Report it from the exact fact.</h2><p>Corrections enter a review queue and remain visible in your ticket history.</p></div><button className="product-button product-button--light" onClick={correction}>Start correction report</button></section>
      {drawer && <DetailDrawer data={drawer} onClose={() => setDrawer(null)} onPrimary={() => setDrawer(null)} />}
      {correctionOpen && <CreateRecordDialog kind="correction" onClose={() => setCorrectionOpen(false)} />}
    </>
  );
}
function Operations() {
  const [filter, setFilter] = useState("All states");
  const [drawer, setDrawer] = useState<DetailData | null>(null);
  const operations = useOperations();
  const rows = (operations.data?.facts ?? []).map((fact) => ({ id: fact.id, record: `${fact.entity_key} · ${fact.field_key}`, type: fact.entity_type, state: fact.state.replaceAll("_", " "), source: fact.source_records?.owner_name ?? "Official source", updatedAt: fact.updated_at }));
  const visible = rows.filter((row) => filter === "All states" || row.state === filter);
  const openRecord = (row: (typeof rows)[number]) => setDrawer({ eyebrow: `${row.type} · ${row.state}`, title: row.record, description: `Source: ${row.source}. Atomic fact awaiting a controlled research decision.`, sections: [{ title: "Review evidence", items: ["Open the captured primary source", "Compare normalized value and previous version", "Resolve conflict or request an independent reviewer"] }, { title: "Audit effect", items: ["Affected matches remain visibly provisional", "Publication creates a versioned audit event", `Last updated ${new Intl.DateTimeFormat("en-GB").format(new Date(row.updatedAt))}`] }], primary: row.state === "conflict" ? "Resolve conflict" : "Start review" });
  const openModule = (title: string, meta: string) => setDrawer({ eyebrow: "Research module", title, description: meta, sections: [{ title: "Operating controls", items: ["Impact-ordered work queue", "Saved filters and accountable ownership", "Version history, source excerpts, and review SLA"] }], primary: `Open ${title.toLowerCase()}` });
  if (operations.state !== "live") return <OperationsGate state={operations.state} message={operations.message} onRetry={() => void operations.refresh()} area="Research operations" />;
  return (
    <>
      <PageIntro eyebrow="Research operations" title="Truth system control room." description="Capture, normalize, review, publish, and refresh source-backed admissions facts." action={<button className="product-button product-button--primary" onClick={() => setDrawer({ eyebrow: "Source capture", title: "Capture a primary source", description: "Create an immutable snapshot before extracting atomic facts.", sections: [{ title: "Capture fields", items: ["Official URL and publisher", "Effective cycle and geography", "Page snapshot and cited excerpt"] }, { title: "Guardrails", items: ["Duplicate detection", "Primary/secondary source classification", "Reviewer cannot self-approve high-impact facts"] }], primary: "Capture source" })}><Plus size={16} /> Capture source</button>} />
      <div className="metric-strip"><Metric label="Review queue" value={String(operations.metrics.reviewQueue)} note="Draft, review or stale" tone="blue" /><Metric label="Conflicts" value={String(operations.metrics.conflicts)} note="Require resolution" tone="amber" /><Metric label="Review due" value={String(operations.metrics.due)} note="Within 14 days" tone="slate" /><Metric label="Published catalogue" value={String(operations.metrics.programmes + operations.metrics.scholarships)} note="Programmes and awards" tone="green" /></div>
      <div className="operations-layout">
        <section className="panel"><div className="panel-head panel-head--controls"><div><h3>Priority queue</h3><span>Live source-backed facts</span></div><select aria-label="Queue state" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All states</option>{[...new Set(rows.map((row) => row.state))].map((state) => <option key={state}>{state}</option>)}</select></div><div className="ops-table"><div className="ops-table__head"><span>Record</span><span>Type</span><span>State</span><span>Source</span><span /></div>{visible.map((row) => <button key={row.id} onClick={() => openRecord(row)}><span><strong>{row.record}</strong><small>{new Intl.DateTimeFormat("en-GB").format(new Date(row.updatedAt))}</small></span><span>{row.type}</span><Status text={row.state} /><span>{row.source}</span><ArrowRight size={15} /></button>)}</div>{!visible.length && <EmptyState icon={Database} title="Queue is clear" text="No fact matches this state." action="Show all" onAction={() => setFilter("All states")} />}</section>
        <aside className="panel freshness-panel"><PanelHead title="Freshness" meta="Live database" /><div className="freshness-ring"><strong>{operations.metrics.sources}</strong><span>registered sources</span></div><p><span><i className="green" /> {operations.metrics.facts} queued facts</span><span><i className="amber" /> {operations.metrics.due} reviews due</span><span><i className="red" /> {operations.metrics.conflicts} conflicts</span></p><button className="product-button product-button--secondary" onClick={() => openModule("Freshness calendar", "Prioritize facts by review date, volatility, and student impact.")}>Open freshness calendar</button></aside>
      </div>
      <section className="section-block"><div className="section-heading"><div><span className="product-eyebrow">Operating domains</span><h2>Research modules</h2></div></div><div className="admin-module-grid"><AdminModule icon={Database} title="Source registry" meta={`${operations.metrics.sources} loaded`} onOpen={openModule} /><AdminModule icon={GraduationCap} title="Programmes" meta={`${operations.metrics.programmes} published`} onOpen={openModule} /><AdminModule icon={WalletCards} title="Scholarships" meta={`${operations.metrics.scholarships} published`} onOpen={openModule} /><AdminModule icon={ListChecks} title="Atomic facts" meta={`${operations.metrics.facts} awaiting action`} onOpen={openModule} /><AdminModule icon={AlertCircle} title="Conflict queue" meta={`${operations.metrics.conflicts} unresolved`} onOpen={openModule} /><AdminModule icon={ClipboardCheck} title="Review queue" meta={`${operations.metrics.reviewQueue} waiting`} onOpen={openModule} /></div></section>
      {drawer && <DetailDrawer data={drawer} onClose={() => setDrawer(null)} onPrimary={() => setDrawer(null)} />}
    </>
  );
}

// Kept as a legacy administration view while SuperAdminApp owns the live /admin shell.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Admin() {
  const [drawer, setDrawer] = useState<DetailData | null>(null);
  const [activity, setActivity] = useState("All activity");
  const operations = useOperations();
  const openModule = (title: string, meta: string) => setDrawer({ eyebrow: "Platform administration", title, description: meta, sections: [{ title: "Controls", items: ["Role-scoped access and explicit reason capture", "Search, filters, bulk actions, and reversible states", "Every material action enters the audit log"] }, { title: "Safety", items: ["Least-privilege defaults", "Sensitive document access is never implicit", "High-risk changes require acknowledgement"] }], primary: `Open ${title.toLowerCase()}` });
  if (operations.state !== "live") return <OperationsGate state={operations.state} message={operations.message} onRetry={() => void operations.refresh()} area="Administration" />;
  return (
    <>
      <PageIntro eyebrow="Platform administration" title="CandidRoute operations." description="User safety, support quality, data health, notification delivery, and accountable access." />
      <div className="metric-strip"><Metric label="Published programmes" value={String(operations.metrics.programmes)} note="Current catalogue" tone="blue" /><Metric label="Published scholarships" value={String(operations.metrics.scholarships)} note="Current cycles" tone="green" /><Metric label="Corrections" value={String(operations.metrics.corrections)} note="Open or researching" tone="amber" /><Metric label="Conflicts" value={String(operations.metrics.conflicts)} note="Research action required" tone="slate" /></div>
      <div id="governance" className="admin-module-grid"><AdminModule icon={Database} title="Source registry" meta={`${operations.metrics.sources} source records`} onOpen={openModule} /><AdminModule icon={CircleHelp} title="Support queue" meta="Connect support provider before public release" onOpen={openModule} /><AdminModule icon={AlertCircle} title="Corrections" meta={`${operations.metrics.corrections} awaiting action`} onOpen={openModule} /><AdminModule icon={Bell} title="Notifications" meta="Outbox worker required" onOpen={openModule} /><AdminModule icon={LayoutDashboard} title="Product analytics" meta="Not configured" onOpen={openModule} /><AdminModule icon={ShieldCheck} title="Security" meta="RLS and audit policies active" onOpen={openModule} /><AdminModule icon={FileText} title="Atomic facts" meta={`${operations.metrics.facts} in active queue`} onOpen={openModule} /><AdminModule icon={Settings} title="Platform settings" meta={`Roles: ${operations.data?.roles.join(", ") || "none"}`} onOpen={openModule} /></div>
      <section className="panel admin-activity"><div className="panel-head panel-head--controls"><div><h3>Accountable operating state</h3><span>Live values only; no simulated activity</span></div><select value={activity} onChange={(event) => setActivity(event.target.value)}><option>All activity</option><option>Research</option><option>Support</option><option>Security</option></select></div>{(activity === "All activity" || activity === "Research") && <Notice icon={Database} tone="blue" title="Research truth layer connected" text={`${operations.metrics.sources} sources · ${operations.metrics.programmes} programmes · ${operations.metrics.scholarships} scholarships`} time="Live" onOpen={() => openModule("Research state", "Current values are read from the protected operations API.")} />}{(activity === "All activity" || activity === "Support") && <Notice icon={CircleHelp} tone="amber" title="Support delivery not configured" text="Choose and connect a support inbox before public beta." time="Release gate" onOpen={() => openModule("Support setup", "No support SLA is claimed until a delivery provider is connected.")} />}{(activity === "All activity" || activity === "Security") && <Notice icon={ShieldCheck} tone="green" title="Least-privilege data policies installed" text="Student ownership, staff roles and private storage are enforced by database policy." time="Database" onOpen={() => openModule("Security state", "Run the two-account isolation suite before every production release.")} />}</section>
      {drawer && <DetailDrawer data={drawer} onClose={() => setDrawer(null)} onPrimary={() => setDrawer(null)} />}
    </>
  );
}

function OperationsGate({ state, message, onRetry, area }: { state: "loading" | "setup" | "forbidden" | "error"; message: string; onRetry: () => void; area: string }) {
  const loading = state === "loading";
  const title = loading ? `Loading ${area.toLowerCase()}…` : state === "setup" ? "Connect Supabase to continue" : state === "forbidden" ? "Staff access required" : `${area} is unavailable`;
  const text = loading ? "Reading the protected operations workspace." : state === "setup" ? "This environment has no Supabase keys. No demonstration counts are shown." : message;
  return <><PageIntro eyebrow={area} title={title} description={text} /><section className="panel empty-state"><span>{loading ? <RefreshCw className="spin" size={24} /> : <Lock size={24} />}</span><h2>{title}</h2><p>{text}</p>{!loading && <button className="product-button product-button--secondary" onClick={onRetry}>Retry connection</button>}</section></>;
}
function WorkspaceTabs({ active }: { active: string }) {
  return <nav className="workspace-tabs" aria-label="Workspace sections">{workspaceNav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={active === label ? "active" : ""}><Icon size={15} /> {label}</Link>)}</nav>;
}

function FlowGate({ icon: Icon, title, detail, state, tone }: { icon: typeof GraduationCap; title: string; detail: string; state: string; tone: string }) {
  return <article className={`flow-gate flow-gate--${tone}`}><span><Icon size={16} /></span><div><strong>{title}</strong><small>{detail}</small></div><em>{state}</em></article>;
}

function AlignmentBar({ label, state, width, tone }: { label: string; state: string; width: string; tone: string }) {
  return <div className="alignment-bar"><span><strong>{label}</strong><small>{state}</small></span><i><b className={`alignment-bar--${tone}`} style={{ width }} /></i></div>;
}

function FlowRoute({ item, rank, onOpen }: { item: (typeof opportunities)[number]; rank: number; onOpen: () => void }) {
  const state = item.match === "Confirmed match" ? "aligned" : item.match === "Conditional match" ? "conditional" : "unknown";
  return <button className="flow-route" onClick={onOpen}><span className="flow-route__rank">0{rank}</span><span className="flow-route__copy"><small><CountryFlag code={item.flag} name={item.country} compact /> {item.country} · {rank === 1 ? "Strongest" : rank === 2 ? "Alternative" : "Funding-first"}</small><strong>{item.title}</strong><em>{item.provider}</em></span><span className={`flow-route__state flow-route__state--${state}`}><i /></span><ArrowRight size={15} /></button>;
}

function PlanMove({ task, index }: { task: { title: string; context: string; due: string; state: string }; index: number }) {
  const tone = task.state === "To do" ? "blue" : task.state === "In progress" ? "green" : "amber";
  return <article className="plan-move"><span className={`plan-move__number plan-move__number--${tone}`}>0{index}</span><div><small>{task.context}</small><strong>{task.title}</strong><span>{task.state} · {task.due}</span></div><Link href="/workspace" aria-label={`Open ${task.title}`}><ArrowRight size={15} /></Link></article>;
}

function FitDetailModal({ item, onClose }: { item: (typeof opportunities)[number]; onClose: () => void }) {
  const matchScore = item.matchScore ?? 0;
  return (
    <div className="fit-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="fit-modal" role="dialog" aria-modal="true" aria-labelledby="fit-modal-title">
        <header><div><span className="product-eyebrow">Your route snapshot</span><h2 id="fit-modal-title">Is {item.title} worth your time?</h2></div><button className="icon-control" onClick={onClose} aria-label="Close fit details"><X size={18} /></button></header>
        <div className="fit-modal__summary"><CountryFlag code={item.flag} name={item.country} /><div><strong>{item.provider}</strong><small>{item.country} · {item.kind}</small></div><div className="fit-modal__score"><strong>{matchScore || "—"}{matchScore ? "%" : ""}</strong><small>{matchScore ? "profile match" : "finish profile to score"}</small></div></div>
        <div className="fit-modal__columns">
          <div><span className="fit-modal__icon fit-modal__icon--green"><Check size={17} /></span><h3>Why it may fit</h3><ul>{item.reasons.slice(0,2).map((reason) => <li key={reason}>{reason}</li>)}</ul></div>
          <div><span className="fit-modal__icon fit-modal__icon--amber"><AlertCircle size={17} /></span><h3>Your next check</h3><p>{item.condition}</p></div>
        </div>
        <div className="fit-modal__source"><Database size={16} /><span><strong>Evidence state</strong><small>{item.freshness} source record · no acceptance probability inferred</small></span></div>
        <footer><button className="product-button product-button--secondary" onClick={onClose}>Close</button><Link className="product-button product-button--primary" href={`/discover/${item.id}`}>Open full route <ArrowRight size={15} /></Link></footer>
      </section>
    </div>
  );
}

type CreateKind = "task" | "application" | "funding" | "offer" | "correction" | "reference";
function CreateRecordDialog({ kind, onClose, onComplete }: { kind: CreateKind; onClose: () => void; onComplete?: (record?: { title: string; secondary: string; date: string }) => void }) {
  const workspace = useWorkspace();
  const [title, setTitle] = useState("");
  const [secondary, setSecondary] = useState("");
  const [date, setDate] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [amount, setAmount] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveApplications = (workspace.data?.applications ?? []) as Array<{ id: string; title: string; provider_name: string }>;
  const labels: Record<CreateKind, { eyebrow: string; heading: string; primary: string }> = {
    task: { eyebrow: "Personal action", heading: "Add a task", primary: "Create task" }, application: { eyebrow: "Application workspace", heading: "Start an application", primary: "Create application" }, funding: { eyebrow: "Planning model", heading: "Create a funding scenario", primary: "Save scenario" }, offer: { eyebrow: "Decision evidence", heading: "Record an offer", primary: "Save offer" }, correction: { eyebrow: "Research correction", heading: "Report an incorrect fact", primary: "Create report" }, reference: { eyebrow: "Confidential reference", heading: "Invite a recommender", primary: "Create invitation" },
  };
  const submit = async () => {
    if (!workspace.authenticated) { window.location.href = `/auth?next=${encodeURIComponent(window.location.pathname)}`; return; }
    setBusy(true); setError(null);
    try {
      if (kind === "task") await workspace.act({ resource: "task", action: "create", title, ...(date ? { dueAt: new Date(`${date}T12:00:00Z`).toISOString() } : {}) });
      if (kind === "application") await workspace.act({ resource: "application", action: "create", title, providerName: secondary, ...(date ? { deadlineAt: new Date(`${date}T12:00:00Z`).toISOString() } : {}) });
      if (kind === "funding") await workspace.act({ resource: "funding", action: "create", title, currency, costs: { estimated_total: Number(amount || 0) }, confirmedFunding: {}, conditionalFunding: {}, exchangeRates: {} });
      if (kind === "offer") await workspace.act({ resource: "offer", action: "create", applicationId, offerType: secondary || "conditional", ...(date ? { responseDueAt: new Date(`${date}T12:00:00Z`).toISOString() } : {}), conditions: title ? [title] : [] });
      if (kind === "correction") await workspace.act({ resource: "correction", action: "create", entityType: secondary || "programme", description: title });
      if (kind === "reference") { const response = await fetch("/api/references/invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ applicationId, name: title, email: secondary }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Invitation could not be created."); await navigator.clipboard?.writeText(result.submissionUrl); }
      onComplete?.({ title, secondary, date }); onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The record could not be saved."); setBusy(false); }
  };
  const needsApplication = kind === "offer" || kind === "reference";
  const valid = kind === "offer" ? Boolean(applicationId && secondary) : kind === "reference" ? Boolean(applicationId && title.length >= 2 && secondary.includes("@")) : kind === "application" ? title.length >= 2 && secondary.length >= 2 : kind === "correction" ? title.length >= 10 : title.length >= 2;
  return <div className="fit-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}><section className="create-dialog" role="dialog" aria-modal="true"><header><div><span className="product-eyebrow">{labels[kind].eyebrow}</span><h2>{labels[kind].heading}</h2></div><button className="icon-control" onClick={onClose}><X size={18} /></button></header><div className="create-dialog__body">{needsApplication && <label>Application<select value={applicationId} onChange={(event) => setApplicationId(event.target.value)}><option value="">Choose an application</option>{liveApplications.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.provider_name}</option>)}</select></label>}{kind !== "offer" && <label>{kind === "reference" ? "Recommender name" : kind === "correction" ? "What is incorrect?" : "Title"}{kind === "correction" ? <textarea value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Describe the exact fact and expected correction…" /> : <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={kind === "funding" ? "Leeds · self-funded baseline" : kind === "application" ? "MSc Data Science" : kind === "reference" ? "Dr Ayesha Khan" : "Request official transcript"} />}</label>}{(kind === "application" || kind === "reference" || kind === "correction" || kind === "offer") && <label>{kind === "application" ? "Institution or provider" : kind === "reference" ? "Email address" : kind === "offer" ? "Offer type" : "Record type"}{kind === "offer" ? <select value={secondary} onChange={(event) => setSecondary(event.target.value)}><option value="conditional">Conditional</option><option value="unconditional">Unconditional</option><option value="waitlist">Waitlist</option><option value="rejected">Rejected</option></select> : kind === "correction" ? <select value={secondary} onChange={(event) => setSecondary(event.target.value)}><option value="programme">Programme</option><option value="scholarship">Scholarship</option><option value="deadline">Deadline</option><option value="rule">Eligibility rule</option></select> : <input type={kind === "reference" ? "email" : "text"} value={secondary} onChange={(event) => setSecondary(event.target.value)} />}</label>}{kind === "funding" && <div className="create-dialog__row"><label>Currency<select value={currency} onChange={(event) => setCurrency(event.target.value)}><option>PKR</option><option>INR</option><option>BDT</option><option>GBP</option><option>EUR</option><option>USD</option></select></label><label>Estimated total<input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} /></label></div>}{["task","application","offer"].includes(kind) && <label>{kind === "offer" ? "Response deadline" : "Due date (optional)"}<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>}{needsApplication && !liveApplications.length && <div className="auth-message auth-message--error">Create a live application first. Demo applications cannot receive private offers or references.</div>}{kind === "reference" && <div className="upload-privacy"><Lock size={16} /><span><strong>Confidential by design</strong><small>A 30-day private link is created and copied. The student sees status, never the submitted PDF.</small></span></div>}{error && <div className="auth-message auth-message--error">{error}</div>}</div><footer><button className="product-button product-button--secondary" onClick={onClose}>Cancel</button><button className="product-button product-button--primary" disabled={!valid || busy} onClick={() => void submit()}>{busy ? <><RefreshCw className="spin" size={15} /> Saving</> : labels[kind].primary}</button></footer></section></div>;
}
function DocumentUploadDialog({ onClose, onComplete }: { onClose: () => void; onComplete: (file?: File, category?: string) => void }) {
  const workspace = useWorkspace();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("Academic");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upload = async () => {
    if (!file) { setError("Choose a PDF, JPG, or PNG first."); return; }
    setBusy(true); setError(null);
    if (!workspace.authenticated) { window.location.href = `/auth?next=${encodeURIComponent(window.location.pathname)}`; return; }
    try { await uploadStudentDocument(file, category); onComplete(file, category); }
    catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "Upload failed."); setBusy(false); }
  };
  return <div className="fit-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}><section className="upload-dialog" role="dialog" aria-modal="true" aria-labelledby="upload-title"><header><div><span className="product-eyebrow">Private evidence</span><h2 id="upload-title">Upload a document</h2></div><button className="icon-control" onClick={onClose} disabled={busy}><X size={18} /></button></header><div className="upload-dialog__body"><label className={`upload-dropzone ${file ? "has-file" : ""}`}><Upload size={24} /><strong>{file ? file.name : "Choose a file"}</strong><small>{file ? `${Math.round(file.size / 1024)} KB · ${file.type}` : "PDF, JPG, or PNG · maximum 15 MB"}</small><input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label><label className="upload-field">Document category<select value={category} onChange={(event) => setCategory(event.target.value)}><option>Academic</option><option>Identity</option><option>Language</option><option>Financial</option><option>Experience</option><option>Other</option></select></label><div className="upload-privacy"><Lock size={16} /><span><strong>Private by default</strong><small>The file is stored in your user-scoped bucket and opened only through a 60-second signed link.</small></span></div>{error && <div className="auth-message auth-message--error">{error}</div>}</div><footer><button className="product-button product-button--secondary" onClick={onClose} disabled={busy}>Cancel</button><button className="product-button product-button--primary" onClick={() => void upload()} disabled={busy || !file}>{busy ? <><RefreshCw className="spin" size={15} /> Uploading</> : <><Upload size={15} /> Upload securely</>}</button></footer></section></div>;
}
function OpportunityCard({ item, detailed = false, saved = item.saved, onSave, onOpen }: { item: (typeof opportunities)[number]; detailed?: boolean; saved?: boolean; onSave?: () => void; onOpen?: () => void }) {
  const hasOpenCondition = Boolean(item.condition && item.condition !== "No unresolved condition is recorded.");
  const score = item.matchScore ?? 0;
  return <article className={`opportunity-card opportunity-card--friendly ${detailed ? "opportunity-card--detailed" : ""}`}>
    <div className="opportunity-card__top"><CountryFlag code={item.flag} name={item.country} /><div className="opportunity-card__actions"><span title={item.freshness === "Provisional" ? "Some details require verification from the official source" : "All displayed details are confirmed from the official source"} className={`verification verification--${item.freshness === "Verified" ? "verified" : "due"}`}><i /> {item.freshness}</span><button onClick={onSave} aria-label={saved ? "Remove from portfolio" : "Save to portfolio"}><Heart size={17} fill={saved ? "currentColor" : "none"} /></button></div></div>
    <div className="opportunity-card__identity"><div><span className="product-eyebrow">{item.kind}</span><h3>{item.title}</h3><p className="provider">{item.provider}</p></div><div className="opportunity-match-score" style={{ "--score": score || 8 } as React.CSSProperties}><strong>{score || "—"}{score ? "%" : ""}</strong><small>{score ? "profile match" : "profile needed"}</small></div></div>
    <div className="opportunity-card__facts"><span><WalletCards size={16} /><small>Funding</small><strong>{humanizeAward(item.value)}</strong></span><span><CalendarDays size={16} /><small>Deadline</small><strong>{item.deadline}</strong></span></div>
    {item.freshness === "Provisional" && <div className="opportunity-card__provisional"><AlertCircle size={14} /><span><strong>Official opportunity, partial details</strong><small>{item.disclaimer}</small></span></div>}
    {detailed && <div className="opportunity-card__friend-note"><Sparkles size={15} /><span><strong>{score >= 75 ? "Worth prioritising" : score ? "Worth checking" : "Complete your profile"}</strong><small>{item.reasons[0] || "Open the route to review its evidence."}</small></span></div>}
    {hasOpenCondition && detailed && <details className="condition-note"><summary><AlertCircle size={14} /> One thing to verify</summary><p>{item.condition}</p></details>}
    <div className="opportunity-card__footer"><span className={`match-pill match-pill--${item.match.toLowerCase().replaceAll(" ", "-")}`}>{item.match}</span><button onClick={onOpen}>See why it fits <ArrowRight size={14} /></button></div>
  </article>;
}

function humanizeAward(value: string) { return value.replaceAll("_", " ").replace(/^full award$/i, "Full award").replace(/^full award route$/i, "Full award"); }

function PortfolioRow({ item, checked, onToggle, onOpen }: { item: (typeof opportunities)[number]; checked: boolean; onToggle: () => void; onOpen: () => void }) {
  return <div className="portfolio-row"><input type="checkbox" checked={checked} onChange={onToggle} aria-label={`Select ${item.title}`} /><span className="country-mark">{item.flag}</span><button className="portfolio-row__main" onClick={onOpen}><strong>{item.title}</strong><small>{item.provider} · {item.country}</small></button><span className={`match-pill match-pill--${item.match.toLowerCase().replaceAll(" ", "-")}`}>{item.match}</span><span><strong>{item.deadline}</strong><small>{item.value}</small></span><button onClick={onOpen} aria-label={`Open ${item.title}`}><ArrowRight size={17} /></button></div>;
}

function PortfolioCompare({ items, onClose }: { items: (typeof opportunities)[number][]; onClose: () => void }) {
  return <div className="fit-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="compare-modal" role="dialog" aria-modal="true"><header><div><span className="product-eyebrow">Portfolio comparison</span><h2>Compare verified facts, not rankings</h2></div><button className="icon-control" onClick={onClose}><X size={18} /></button></header><div className="compare-table"><div><strong>Route</strong>{items.map((item) => <span key={item.id}><b>{item.flag} {item.title}</b><small>{item.provider}</small></span>)}</div><div><strong>Match state</strong>{items.map((item) => <span key={item.id}><Status text={item.match} /></span>)}</div><div><strong>Deadline</strong>{items.map((item) => <span key={item.id}>{item.deadline}</span>)}</div><div><strong>Funding</strong>{items.map((item) => <span key={item.id}>{item.value}</span>)}</div><div><strong>Open check</strong>{items.map((item) => <span key={item.id}>{item.condition}</span>)}</div></div><footer><button className="product-button product-button--secondary" onClick={onClose}>Close comparison</button></footer></section></div>;
}

function Metric({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) { return <div className={`metric metric--${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function PanelHead({ title, meta }: { title: string; meta: string }) { return <div className="panel-head"><h3>{title}</h3><span>{meta}</span></div>; }

function Status({ text }: { text: string }) { const tone = text.includes("Uploaded") || text.includes("Confirmed") || text.includes("covered") || text.includes("Complete") ? "green" : text.includes("Missing") || text.includes("Blocked") || text.includes("Conflict") || text.includes("Action") ? "red" : text.includes("review") || text.includes("Waiting") || text.includes("Conditional") ? "amber" : "blue"; return <span className={`status-pill status-pill--${tone}`}>{text}</span>; }
function Requirement({ title, detail, state, onOpen }: { title: string; detail: string; state: string; onOpen?: () => void }) { return <div><span className="requirement-icon">{state === "Confirmed" ? <Check size={15} /> : <AlertCircle size={15} />}</span><span><strong>{title}</strong><small>{detail}</small></span><Status text={state} /><button onClick={onOpen}><ArrowRight size={15} /></button></div>; }

function ApplicationDocuments({ onOpen }: { onOpen: () => void }) { return <div className="application-tab-content"><div className="application-tab-head"><div><span className="product-eyebrow">Linked evidence</span><h3>3 of 4 documents ready</h3></div><button className="product-button product-button--secondary" onClick={onOpen}><Plus size={14} /> Link evidence</button></div>{documents.slice(0, 3).map((doc) => <button className="application-file" key={doc.name} onClick={onOpen}><span className="file-icon"><FileText size={16} /></span><span><strong>{doc.name}</strong><small>{doc.category} · {doc.used} uses</small></span><Status text={doc.status} /><ArrowRight size={15} /></button>)}</div>; }
function ApplicationWriting() { return <div className="application-tab-content"><div className="application-tab-head"><div><span className="product-eyebrow">Application-specific writing</span><h3>Personal statement</h3></div><Link className="product-button product-button--secondary" href="/workspace/writing">Open writing studio</Link></div><div className="writing-readiness"><span><strong>Outline</strong><small>Complete</small></span><i><b style={{ width: "42%" }} /></i><span><strong>0 / 700</strong><small>words</small></span></div><p className="application-tab-note"><Info size={16} /> Evidence bank ready; programme-specific connection still needs current module references.</p></div>; }
function ApplicationReferences({ onInvite }: { onInvite: () => void }) { return <div className="application-tab-content"><div className="application-tab-head"><div><span className="product-eyebrow">Confidential references</span><h3>1 recommender required</h3></div><button className="product-button product-button--primary" onClick={onInvite}><Mail size={14} /> Invite recommender</button></div><div className="reference-state"><Users size={20} /><span><strong>No recommender invited</strong><small>Invite early; you can see delivery status, never confidential content.</small></span></div></div>; }
function ApplicationActivity() { return <div className="application-tab-content activity-timeline"><div><i /><span><strong>Requirement conflict detected</strong><small>Today · mathematics evidence</small></span></div><div><i /><span><strong>Programme source reviewed</strong><small>25 Jul · official catalogue</small></span></div><div><i /><span><strong>Application workspace created</strong><small>24 Jul · from portfolio</small></span></div></div>; }

function WritingRow({ title, app, progress, words, active = false, onOpen }: { title: string; app: string; progress: string; words: string; active?: boolean; onOpen?: () => void }) { return <button className={active ? "active" : ""} onClick={onOpen}><span className="file-icon"><FileText size={17} /></span><span><strong>{title}</strong><small>{app}</small><em>{progress}</em></span><span>{words}</span><ArrowRight size={15} /></button>; }
function SubscriptionGate() {
  return <section className="subscription-gate"><span><Lock size={24} /></span><small className="product-eyebrow">CandidRoute Pro</small><h1>Your free report is saved. This workspace is the next step.</h1><p>Unlock the complete catalogue, country and university intelligence, recommendations, tasks, deadlines, applications and evidence workspace.</p><div><Link className="product-button product-button--primary" href="/settings/plan">View Pro access <ArrowRight size={16} /></Link><Link className="product-button product-button--secondary" href="/report">Return to free report</Link></div></section>;
}

function EmptyState({ icon: Icon, title, text, action, onAction }: { icon: typeof Search; title: string; text: string; action: string; onAction?: () => void }) { return <section className="empty-state"><span><Icon size={24} /></span><h2>{title}</h2><p>{text}</p><button onClick={onAction} className="product-button product-button--secondary">{action}</button></section>; }
function Scenario({ title, cost, gap, state, onOpen }: { title: string; cost: string; gap: string; state: string; onOpen?: () => void }) { return <article className="scenario-card"><div><span className="scenario-icon"><WalletCards size={18} /></span><button onClick={onOpen}><MoreHorizontal size={17} /></button></div><h3>{title}</h3><strong>{cost}</strong><p>{gap}</p><Status text={state} /><button className="scenario-open" onClick={onOpen}>Open scenario <ArrowRight size={14} /></button></article>; }
function Assumption({ label, value, source, onEdit }: { label: string; value: string; source: string; onEdit?: () => void }) { return <div><span>{label}<small>{source}</small></span><strong>{value}</strong><button onClick={onEdit}>Edit</button></div>; }
function OfferFeature({ icon: Icon, title, text }: { icon: typeof BookOpenCheck; title: string; text: string }) { return <article><span><Icon size={18} /></span><h3>{title}</h3><p>{text}</p></article>; }
function Notice({ icon: Icon, tone, title, text, time, read = false, onOpen }: { icon: typeof Bell; tone: string; title: string; text: string; time: string; read?: boolean; onOpen?: () => void }) { return <button className={`notice ${read ? "is-read" : ""}`} onClick={onOpen}><span className={`notice__icon notice__icon--${tone}`}><Icon size={17} /></span><span><strong>{title}</strong><p>{text}</p><small>{time}</small></span><ArrowRight size={17} /></button>; }
function HelpCard({ icon: Icon, title, text, onOpen }: { icon: typeof CircleHelp; title: string; text: string; onOpen?: () => void }) { return <button onClick={onOpen}><span><Icon size={19} /></span><h3>{title}</h3><p>{text}</p><ArrowRight size={15} /></button>; }
function AdminModule({ icon: Icon, title, meta, onOpen }: { icon: typeof Database; title: string; meta: string; onOpen?: (title: string, meta: string) => void }) { return <button onClick={() => onOpen?.(title, meta)}><span><Icon size={19} /></span><div><strong>{title}</strong><small>{meta}</small></div><ArrowRight size={15} /></button>; }
function pageTitle(module: string) {
  const titles: Record<string, string> = { today: "Today", report: "Pathway report", discover: "Discover", recommendations: "Recommendations", countries: "Country intelligence", institutions: "Institution directory", portfolio: "Portfolio", applications: "Applications", workspace: "Tasks", documents: "Documents", writing: "Writing", funding: "Funding", offers: "Offers", profile: "Profile & evidence", notifications: "Notifications", help: "Help & corrections", operations: "Research operations", admin: "Administration", opportunity: "Route details", settings: "Settings", "settings-notifications": "Notification settings", "settings-privacy": "Privacy & data", "settings-plan": "Plan & billing" };
  return titles[module] ?? "CandidRoute";
}
