"use client";

import Link from "next/link";
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
  FileCheck2,
  FileText,
  FolderOpen,
  GraduationCap,
  Heart,
  Home,
  LayoutDashboard,
  ListChecks,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Upload,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { applications, documents, opportunities, sourceQueue, tasks } from "@/modules/product/demo-data";

const primaryNav = [
  { href: "/today", label: "Today", icon: Home },
  { href: "/discover", label: "Discover", icon: Search },
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

type ProductAppProps = { module: string };

export function ProductApp({ module }: ProductAppProps) {
  const pathname = usePathname();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [query, setQuery] = useState("");

  const title = pageTitle(module);

  return (
    <div className="product-app">
      <aside className={`product-rail ${mobileMenu ? "is-open" : ""}`}>
        <div className="product-rail__head">
          <Link className="product-brand" href="/today">
            <span className="product-brand__mark"><GraduationCap size={16} /></span>
            <span>ScholarPath<small>Verified admissions</small></span>
          </Link>
          <button className="icon-control rail-close" onClick={() => setMobileMenu(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <nav className="product-nav" aria-label="Primary navigation">
          <span className="nav-caption">Student workspace</span>
          {primaryNav.map((item) => <NavLink key={item.href} {...item} pathname={pathname} />)}
          <span className="nav-caption nav-caption--second">Workspace tools</span>
          {workspaceNav.slice(1).map((item) => <NavLink key={item.href} {...item} pathname={pathname} />)}
        </nav>
        <div className="product-rail__bottom">
          <Link href="/help"><CircleHelp size={16} /> Help & corrections</Link>
          <Link href="/profile"><UserRound size={16} /> Profile & evidence</Link>
          <div className="rail-trust"><ShieldCheck size={17} /><span><strong>Sources visible</strong><small>No invented probability</small></span></div>
        </div>
      </aside>

      {mobileMenu && <button className="rail-scrim" onClick={() => setMobileMenu(false)} aria-label="Close navigation overlay" />}

      <main className="product-main">
        <header className="product-topbar">
          <div className="product-topbar__left">
            <button className="icon-control menu-trigger" onClick={() => setMobileMenu(true)} aria-label="Open navigation"><Menu size={19} /></button>
            <span className="mobile-product-mark"><GraduationCap size={16} /></span>
            <div><small>ScholarPath</small><strong>{title}</strong></div>
          </div>
          <div className="product-topbar__right">
            <button className="command-button"><Search size={15} /><span>Search anything</span><kbd><Command size={10} /> K</kbd></button>
            <Link className="icon-control notification-control" href="/notifications" aria-label="Notifications"><Bell size={17} /><i /></Link>
            <Link className="profile-chip" href="/profile"><span>HA</span><strong>Haidar<small>Profile 72%</small></strong><ChevronDown size={14} /></Link>
          </div>
        </header>

        <div className="product-mobile-tabs">
          {primaryNav.map((item) => <NavLink key={item.href} {...item} pathname={pathname} />)}
        </div>

        <div className="product-page">
          {module === "today" && <Today />}
          {module === "discover" && <Discover query={query} setQuery={setQuery} />}
          {module === "portfolio" && <Portfolio />}
          {module === "applications" && <Applications />}
          {module === "workspace" && <Tasks />}
          {module === "documents" && <Documents />}
          {module === "writing" && <Writing />}
          {module === "funding" && <Funding />}
          {module === "offers" && <Offers />}
          {module === "profile" && <Profile />}
          {module === "notifications" && <Notifications />}
          {module === "help" && <Help />}
          {module === "operations" && <Operations />}
          {module === "admin" && <Admin />}
        </div>
      </main>
    </div>
  );
}

function NavLink({ href, label, icon: Icon, pathname }: { href: string; label: string; icon: typeof Home; pathname: string }) {
  const exact = href === "/workspace" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return <Link className={exact ? "active" : ""} href={href}><Icon size={17} /><span>{label}</span>{label === "Applications" && <b>3</b>}</Link>;
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="page-intro">
      <div><span className="product-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      {action}
    </div>
  );
}

function Today() {
  const [guideView, setGuideView] = useState<"why" | "missing" | "next">("why");

  const guideContent = {
    why: {
      eyebrow: "Why this is first",
      title: "One document can unblock two routes",
      body: "Leeds and Saarland both require module-level mathematics evidence. Your transcript names the modules but does not show their content.",
    },
    missing: {
      eyebrow: "Evidence missing",
      title: "A syllabus or official module description",
      body: "Upload an official course outline showing calculus, linear algebra, statistics, or discrete mathematics. ScholarPath will attach it to both requirement checks.",
    },
    next: {
      eyebrow: "After you upload",
      title: "We re-check the affected requirements",
      body: "The rules engine will compare the document against both programme requirements and show Confirmed, Still conditional, or Needs review—never a hidden probability.",
    },
  }[guideView];

  return (
    <>
      <PageIntro eyebrow="Thursday, 30 July" title="Here is what moves your plan forward." description="ScholarPath has checked your deadlines, requirements, evidence, and funding dependencies. One action has the highest impact today." action={<Link className="product-button product-button--secondary" href="/profile"><UserRound size={18} /> Profile evidence: 72%</Link>} />
      <div className="today-layout">
        <div className="today-main">
          <section className="next-action-card">
            <span className="next-action-card__icon"><Target size={24} /></span>
            <div><small>Highest-impact action · about 12 minutes</small><h2>Verify your mathematics module coverage</h2><p>Upload one official document to resolve the same evidence gap across two active applications.</p><span className="next-action-card__impact"><Sparkles size={14} /> Affects Leeds and Saarland</span></div>
            <Link href="/applications" className="product-button product-button--light">Resolve evidence <ArrowRight size={17} /></Link>
          </section>

          <div className="path-pulse" aria-label="Pathway changes since your last visit">
            <div><span className="path-pulse__icon path-pulse__icon--amber"><AlertCircle size={18} /></span><p><strong>2 routes need evidence</strong><small>The same academic gap affects both.</small></p></div>
            <div><span className="path-pulse__icon path-pulse__icon--green"><ShieldCheck size={18} /></span><p><strong>1 source reverified</strong><small>Chevening timeline is current.</small></p></div>
            <div><span className="path-pulse__icon path-pulse__icon--blue"><Sparkles size={18} /></span><p><strong>3 new routes</strong><small>Added after your profile update.</small></p></div>
          </div>
      <div className="dashboard-grid">
        <section className="panel">
          <PanelHead title="Your next actions" meta="Ordered by impact and deadline" />
          <div className="task-list-ui">{tasks.slice(0, 3).map((task) => <TaskRow key={task.title} task={task} />)}</div>
          <Link className="panel-link" href="/workspace">Open your full plan <ArrowRight size={16} /></Link>
        </section>
      </div>
        </div>

        <aside className="path-guide" aria-live="polite">
          <div className="path-guide__head"><span><Sparkles size={17} /> Path Guide</span><em>Using 8 profile facts</em></div>
          <div className="path-guide__status"><i /><span><strong>Evidence-backed guidance</strong><small>Rules checked 30 Jul 2026</small></span></div>
          <div className="path-guide__content" key={guideView}>
            <span className="product-eyebrow">{guideContent.eyebrow}</span>
            <h2>{guideContent.title}</h2>
            <p>{guideContent.body}</p>
          </div>
          <div className="path-guide__facts">
            <span>Data used</span>
            <button>BS Computer Science <Check size={13} /></button>
            <button>Transcript uploaded <Check size={13} /></button>
            <button className="is-missing">Module descriptions missing <AlertCircle size={13} /></button>
          </div>
          <div className="path-guide__actions" role="tablist" aria-label="Explain this guidance">
            <button className={guideView === "why" ? "active" : ""} onClick={() => setGuideView("why")}>Why first?</button>
            <button className={guideView === "missing" ? "active" : ""} onClick={() => setGuideView("missing")}>What’s missing?</button>
            <button className={guideView === "next" ? "active" : ""} onClick={() => setGuideView("next")}>What happens next?</button>
          </div>
          <Link href="/applications" className="path-guide__source"><Database size={15} /> View rules and official sources <ArrowRight size={15} /></Link>
        </aside>
      </div>
      <section className="section-block">
        <div className="section-heading"><div><span className="product-eyebrow">New verified routes</span><h2>Worth reviewing this week</h2></div><Link href="/discover">Discover all <ArrowRight size={14} /></Link></div>
        <div className="opportunity-grid">{opportunities.slice(0, 3).map((item) => <OpportunityCard key={item.id} item={item} />)}</div>
      </section>
    </>
  );
}

function Discover({ query, setQuery }: { query: string; setQuery: (value: string) => void }) {
  const [kind, setKind] = useState("All");
  const filtered = useMemo(() => opportunities.filter((item) => (kind === "All" || item.kind === kind) && `${item.title} ${item.provider} ${item.country}`.toLowerCase().includes(query.toLowerCase())), [kind, query]);
  return (
    <>
      <PageIntro eyebrow="Verified discovery" title="Find routes you can actually act on." description="Search programmes and scholarships with visible rules, conditions, deadlines, and source freshness." />
      <div className="discover-search">
        <Search size={20} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search subject, institution, scholarship, or country" />
        <button className="product-button product-button--primary">Search</button>
      </div>
      <div className="discovery-toolbar">
        <div className="segment-control">{["All", "Programme", "Scholarship"].map((value) => <button key={value} className={kind === value ? "active" : ""} onClick={() => setKind(value)}>{value}</button>)}</div>
        <div><button className="filter-button"><SlidersHorizontal size={15} /> Filters <b>3</b></button><button className="filter-button">Best fit <ChevronDown size={14} /></button></div>
      </div>
      <div className="active-filters"><span>Pakistan eligible <X size={12} /></span><span>2027 intake <X size={12} /></span><span>Funding available <X size={12} /></span><button>Clear all</button></div>
      <div className="results-meta"><strong>{filtered.length} researched routes</strong><span>Based on your current profile · Updated 25 Jul 2026</span></div>
      <div className="opportunity-grid opportunity-grid--results">{filtered.map((item) => <OpportunityCard key={item.id} item={item} detailed />)}</div>
      {filtered.length === 0 && <EmptyState icon={Search} title="No routes match this search" text="Try removing a filter or search a broader subject. Your saved filters will stay intact." action="Clear search" onAction={() => setQuery("")} />}
    </>
  );
}

function Portfolio() {
  return (
    <>
      <PageIntro eyebrow="Decision workspace" title="Your application portfolio." description="Balance academic ambition, verification confidence, deadlines, and funding dependency—without pretending any route is guaranteed." action={<button className="product-button product-button--primary"><Plus size={16} /> Add opportunity</button>} />
      <div className="portfolio-summary">
        <div><span>4</span><p><strong>Saved routes</strong><small>2 programmes · 2 scholarships</small></p></div>
        <div><span>2</span><p><strong>Funding-first</strong><small>Both remain conditional</small></p></div>
        <div><span>1</span><p><strong>Review due</strong><small>Cycle source needs refresh</small></p></div>
        <button className="product-button product-button--secondary">Compare selected</button>
      </div>
      {["Realistic", "Funding-first", "Needs research"].map((group, groupIndex) => (
        <section className="portfolio-group" key={group}>
          <div className="portfolio-group__head"><div><h2>{group}</h2><span>{groupIndex === 0 ? "Good evidence alignment; conditions remain" : groupIndex === 1 ? "Awards are essential to affordability" : "Promising, but source evidence is incomplete"}</span></div><button><MoreHorizontal size={18} /></button></div>
          <div className="portfolio-rows">{opportunities.slice(groupIndex === 0 ? 0 : groupIndex + 1, groupIndex === 0 ? 2 : groupIndex + 2).map((item) => <PortfolioRow key={item.id} item={item} />)}</div>
        </section>
      ))}
    </>
  );
}

function Applications() {
  const [selected, setSelected] = useState(applications[0]);
  return (
    <>
      <PageIntro eyebrow="Execution" title="Applications." description="Every requirement, document, writing item, reference, and deadline in one auditable place." action={<button className="product-button product-button--primary"><Plus size={16} /> Start application</button>} />
      <div className="application-layout">
        <aside className="application-list-panel">
          <div className="application-list-panel__head"><strong>3 active</strong><button><SlidersHorizontal size={15} /></button></div>
          {applications.map((item) => <button key={item.id} className={selected.id === item.id ? "selected" : ""} onClick={() => setSelected(item)}><span className={`app-dot app-dot--${item.tone}`} /><span><strong>{item.title}</strong><small>{item.provider}</small><em>{item.status} · {item.deadline}</em></span><ArrowRight size={14} /></button>)}
        </aside>
        <section className="application-detail">
          <div className="application-detail__hero"><div><span className="status-pill status-pill--amber">{selected.status}</span><h2>{selected.title}</h2><p>{selected.provider} · September 2027</p></div><button className="icon-control"><MoreHorizontal size={18} /></button></div>
          <div className="readiness-bar"><div><span style={{ width: `${(selected.done / selected.total) * 100}%` }} /></div><p><strong>{selected.done} complete</strong><span>{selected.total - selected.done} action required</span><span>Deadline {selected.deadline} 2027</span></p></div>
          <div className="application-next"><AlertCircle size={19} /><div><small>Blocking requirement</small><strong>{selected.next}</strong><p>This must be resolved before the application can become ready to submit.</p></div><button>Review</button></div>
          <div className="application-tabs"><button className="active">Overview</button><button>Requirements <b>5</b></button><button>Documents</button><button>Writing</button><button>References</button><button>Activity</button></div>
          <div className="requirement-list">
            <Requirement title="Academic qualification" detail="Bachelor degree in a related subject" state="Confirmed" />
            <Requirement title="Mathematics preparation" detail="Module-level evidence required" state="Action required" />
            <Requirement title="English language" detail="IELTS 6.5 overall, no component below 6.0" state="Missing" />
            <Requirement title="Personal statement" detail="500–700 words; programme-specific" state="In progress" />
          </div>
        </section>
      </div>
    </>
  );
}

function Tasks() {
  return (
    <>
      <WorkspaceTabs active="Tasks" />
      <PageIntro eyebrow="Workspace · Tasks" title="Keep the plan moving." description="System-generated requirements and your personal tasks, ordered by deadline and dependency." action={<button className="product-button product-button--primary"><Plus size={16} /> Add task</button>} />
      <div className="task-filters"><button className="active">To do <b>4</b></button><button>Upcoming</button><button>Blocked <b>1</b></button><button>Completed</button><button><CalendarDays size={15} /> Calendar</button></div>
      <section className="panel task-board">
        <div className="task-day"><span>Today</span><small>1 task · about 12 min</small></div>
        <TaskRow task={tasks[0]} large />
        <div className="task-day"><span>Next 7 days</span><small>3 tasks</small></div>
        {tasks.slice(1).map((task) => <TaskRow key={task.title} task={task} large />)}
      </section>
    </>
  );
}

function Documents() {
  return (
    <>
      <WorkspaceTabs active="Documents" />
      <PageIntro eyebrow="Workspace · Documents" title="One secure document library." description="Upload once, version carefully, and track acceptance separately for every application." action={<button className="product-button product-button--primary"><Upload size={16} /> Upload document</button>} />
      <div className="document-summary">
        <Metric label="Uploaded" value="7" note="Across 5 categories" tone="green" />
        <Metric label="Missing" value="4" note="2 block applications" tone="amber" />
        <Metric label="Needs review" value="1" note="Transcript mapping" tone="blue" />
      </div>
      <div className="document-layout">
        <section className="panel">
          <PanelHead title="Document library" meta="8 files" />
          <div className="table-toolbar"><div><Search size={15} /><input placeholder="Search documents" /></div><button>All categories <ChevronDown size={14} /></button></div>
          <div className="document-table">{documents.map((doc) => <div key={doc.name}><span className="file-icon"><FileText size={17} /></span><span><strong>{doc.name}</strong><small>{doc.category} · Updated {doc.updated}</small></span><span>{doc.used}</span><Status text={doc.status} /><button><MoreHorizontal size={17} /></button></div>)}</div>
        </section>
        <aside className="upload-card"><span><Upload size={20} /></span><h3>Drop files to upload</h3><p>PDF, JPG, or PNG up to 15 MB. Documents stay private by default.</p><button className="product-button product-button--secondary">Choose files</button><small><ShieldCheck size={13} /> Protected storage path planned</small></aside>
      </div>
    </>
  );
}

function Writing() {
  return (
    <>
      <WorkspaceTabs active="Writing" />
      <PageIntro eyebrow="Workspace · Writing" title="Write with evidence, not templates." description="Break prompts into claims, build a reusable evidence bank, and keep every final draft application-specific." action={<button className="product-button product-button--primary"><Plus size={16} /> New writing item</button>} />
      <div className="writing-layout">
        <section className="panel writing-list">
          <PanelHead title="Active writing" meta="3 items" />
          <WritingRow title="Personal statement" app="University of Leeds" progress="Outline complete" words="0 / 700" />
          <WritingRow title="Leadership essay" app="Chevening" progress="Draft in progress" words="412 / 500" />
          <WritingRow title="Motivation letter" app="Saarland University" progress="Prompt captured" words="0 / 1,000" />
        </section>
        <section className="writing-preview">
          <div className="writing-preview__top"><span className="status-pill status-pill--blue">Outline</span><button><MoreHorizontal size={18} /></button></div>
          <h2>Personal statement</h2><p className="writing-prompt">Explain your academic preparation, motivation for data science, and how this programme supports your plans.</p>
          <div className="outline-step"><span>01</span><div><strong>Academic foundation</strong><p>Connect BS Computer Science modules to statistics, programming, and data systems.</p></div><Check size={16} /></div>
          <div className="outline-step"><span>02</span><div><strong>Evidence story</strong><p>Add one project where your analysis changed a technical decision.</p></div><Plus size={16} /></div>
          <div className="outline-step"><span>03</span><div><strong>Programme connection</strong><p>Name specific modules only after checking the current programme page.</p></div><Plus size={16} /></div>
          <button className="product-button product-button--primary">Open editor <ArrowRight size={15} /></button>
        </section>
      </div>
    </>
  );
}

function Funding() {
  return (
    <>
      <WorkspaceTabs active="Funding" />
      <PageIntro eyebrow="Workspace · Funding" title="Know the gap before you commit." description="Separate confirmed funding from conditional awards and editable cost assumptions." action={<button className="product-button product-button--primary"><Plus size={16} /> New scenario</button>} />
      <div className="funding-hero">
        <div><span>Current first-year gap</span><strong>PKR 5.8m</strong><small>Leeds · without a confirmed award</small></div>
        <div className="funding-bar"><span style={{ width: "38%" }} /><i style={{ left: "67%" }} /></div>
        <div className="funding-legend"><span><i className="funded" /> Documented contribution · PKR 3.4m</span><span><i className="gap" /> Remaining gap · PKR 5.8m</span></div>
      </div>
      <div className="scenario-grid">
        <Scenario title="Leeds · self-funded baseline" cost="PKR 9.2m" gap="PKR 5.8m gap" state="Funding unresolved" />
        <Scenario title="Leeds + Chevening" cost="PKR 9.2m" gap="Award not confirmed" state="Conditional" />
        <Scenario title="Saarland baseline" cost="PKR 3.1m" gap="Within contribution" state="Potentially covered" />
      </div>
      <section className="panel assumptions"><PanelHead title="Cost assumptions" meta="Last reviewed 25 Jul" /><div><Assumption label="Tuition" value="£31,000" source="University fee page" /><Assumption label="Living costs" value="£12,500" source="Planning assumption" /><Assumption label="Travel & setup" value="£1,600" source="Student estimate" /><Assumption label="Exchange rate" value="PKR 376 / GBP" source="Display assumption" /></div></section>
    </>
  );
}

function Offers() {
  return (
    <>
      <WorkspaceTabs active="Offers" />
      <PageIntro eyebrow="Workspace · Offers" title="Decide with the full picture." description="Conditions, confirmed funding, deposits, response dates, and your priorities—side by side." action={<button className="product-button product-button--primary"><Plus size={16} /> Add offer</button>} />
      <EmptyState icon={GraduationCap} title="No offers recorded yet" text="When an institution responds, add the offer and ScholarPath will turn its conditions and response date into tasks." action="View active applications" />
      <div className="offer-preview"><span className="product-eyebrow">What will appear here</span><div><OfferFeature icon={BookOpenCheck} title="Offer conditions" text="Track academic, language, deposit, and document conditions." /><OfferFeature icon={WalletCards} title="Net cost" text="Compare confirmed awards and the remaining first-year gap." /><OfferFeature icon={Clock3} title="Decision dates" text="Keep response and deposit deadlines visible in your timezone." /></div></div>
    </>
  );
}

function Profile() {
  return (
    <>
      <PageIntro eyebrow="Profile & evidence" title="What your plan can prove." description="Keep facts separate from assumptions. Updating a high-impact answer shows which routes and rules need re-evaluation." action={<Link className="product-button product-button--primary" href="/"><Sparkles size={16} /> Reassess pathway</Link>} />
      <div className="profile-layout">
        <aside className="profile-score"><div className="score-ring"><strong>72%</strong></div><h3>Profile completeness</h3><p>Three evidence gaps affect current applications.</p><button className="product-button product-button--secondary">Review gaps</button></aside>
        <section className="profile-sections">
          <ProfileSection icon={UserRound} title="Identity & origin" state="Complete" detail="Pakistan · Pakistani citizen · Lahore timezone" />
          <ProfileSection icon={GraduationCap} title="Academic record" state="Needs evidence" detail="BS Computer Science · 3.42/4.00 · transcript uploaded" />
          <ProfileSection icon={FileCheck2} title="English evidence" state="Missing" detail="Planned IELTS · no test record uploaded" />
          <ProfileSection icon={Target} title="Goals & intake" state="Complete" detail="Master’s · Data/AI · 2027 intake · UK/Germany/Europe" />
          <ProfileSection icon={WalletCards} title="Funding reality" state="Review" detail="Major funding required · PKR 3.4m contribution" />
        </section>
      </div>
    </>
  );
}

function Notifications() {
  return (
    <>
      <PageIntro eyebrow="Updates" title="Notifications." description="Deadline, source, requirement, and security changes—not engagement noise." action={<button className="product-button product-button--secondary"><Settings size={16} /> Preferences</button>} />
      <section className="panel notification-list">
        <Notice icon={AlertCircle} tone="amber" title="Leeds requirement needs your review" text="The official programme page and catalogue describe mathematics preparation differently." time="18 min ago" />
        <Notice icon={Database} tone="blue" title="Chevening 2027–28 timeline verified" text="Applications open 4 August 2026 and close 6 October 2026 at 11:00 UTC." time="2 hours ago" />
        <Notice icon={Clock3} tone="slate" title="Transcript request due in 3 days" text="This task is assigned to you and blocks two active applications." time="Yesterday" />
        <Notice icon={ShieldCheck} tone="green" title="New sign-in confirmed" text="Windows · Pakistan · 24 July at 21:14 PKT." time="Yesterday" />
      </section>
    </>
  );
}

function Help() {
  return (
    <>
      <PageIntro eyebrow="Support & corrections" title="Get help without losing context." description="Ask about the product or report a specific programme, scholarship, deadline, or rule that looks wrong." />
      <div className="help-search"><Search size={20} /><input placeholder="Search help articles" /></div>
      <div className="help-grid">
        <HelpCard icon={CircleHelp} title="Using ScholarPath" text="Profiles, match states, portfolios, applications, and tasks." />
        <HelpCard icon={Database} title="Sources & verification" text="How facts are captured, reviewed, corrected, and refreshed." />
        <HelpCard icon={ShieldCheck} title="Privacy & documents" text="Document access, sharing, exports, and account deletion." />
      </div>
      <section className="correction-card"><div><span className="product-eyebrow">Found incorrect information?</span><h2>Report it from the exact fact.</h2><p>Corrections enter a review queue and remain visible in your ticket history.</p></div><button className="product-button product-button--light">Start correction report</button></section>
    </>
  );
}

function Operations() {
  return (
    <>
      <PageIntro eyebrow="Research operations" title="Truth system control room." description="Capture, normalize, review, publish, and refresh source-backed admissions facts." action={<button className="product-button product-button--primary"><Plus size={16} /> Capture source</button>} />
      <div className="metric-strip">
        <Metric label="Review queue" value="23" note="6 high impact" tone="blue" />
        <Metric label="Conflicts" value="7" note="Oldest 4 days" tone="amber" />
        <Metric label="Review due" value="41" note="Next 14 days" tone="slate" />
        <Metric label="Published today" value="18" note="2,140 students checked" tone="green" />
      </div>
      <div className="operations-layout">
        <section className="panel">
          <PanelHead title="Priority queue" meta="Impact ordered" />
          <div className="ops-table"><div className="ops-table__head"><span>Record</span><span>Type</span><span>State</span><span>Impact</span><span /></div>{sourceQueue.map((row) => <div key={row.record}><span><strong>{row.record}</strong><small>Updated 25 Jul 2026</small></span><span>{row.type}</span><Status text={row.state} /><span>{row.impact}</span><button><ArrowRight size={15} /></button></div>)}</div>
        </section>
        <aside className="panel freshness-panel"><PanelHead title="Freshness" meta="This month" /><div className="freshness-ring"><strong>87%</strong><span>Primary facts current</span></div><p><span><i className="green" /> 1,284 verified</span><span><i className="amber" /> 41 review due</span><span><i className="red" /> 7 conflicting</span></p><button className="product-button product-button--secondary">Open freshness calendar</button></aside>
      </div>
      <section className="section-block"><div className="section-heading"><div><span className="product-eyebrow">Operating domains</span><h2>Research modules</h2></div></div><div className="admin-module-grid"><AdminModule icon={Database} title="Source registry" meta="612 sources" /><AdminModule icon={GraduationCap} title="Programmes" meta="284 published" /><AdminModule icon={WalletCards} title="Scholarships" meta="93 current cycles" /><AdminModule icon={ListChecks} title="Atomic rules" meta="2,418 facts" /><AdminModule icon={AlertCircle} title="Conflict queue" meta="7 unresolved" /><AdminModule icon={ClipboardCheck} title="Review queue" meta="23 waiting" /></div></section>
    </>
  );
}

function Admin() {
  return (
    <>
      <PageIntro eyebrow="Platform administration" title="ScholarPath operations." description="User safety, support quality, data health, notification delivery, and accountable access." />
      <div className="metric-strip">
        <Metric label="Active students" value="2,418" note="+184 this month" tone="blue" />
        <Metric label="Support SLA" value="94%" note="Within 24 hours" tone="green" />
        <Metric label="Corrections" value="18" note="5 need review" tone="amber" />
        <Metric label="Security events" value="2" note="No critical events" tone="slate" />
      </div>
      <div className="admin-module-grid">
        <AdminModule icon={UserRound} title="Users" meta="Accounts, access, and profile state" />
        <AdminModule icon={CircleHelp} title="Support queue" meta="14 open tickets" />
        <AdminModule icon={AlertCircle} title="Corrections" meta="5 awaiting research review" />
        <AdminModule icon={Bell} title="Notifications" meta="99.2% delivery" />
        <AdminModule icon={LayoutDashboard} title="Product analytics" meta="Funnel and outcome health" />
        <AdminModule icon={ShieldCheck} title="Security events" meta="2 require acknowledgement" />
        <AdminModule icon={FileText} title="Audit log" meta="Immutable admin actions" />
        <AdminModule icon={Settings} title="Platform settings" meta="Roles, flags, and policies" />
      </div>
      <section className="panel admin-activity"><PanelHead title="Recent accountable activity" meta="All admin actions are logged" /><Notice icon={Database} tone="blue" title="Scholarship cycle published" text="Chevening 2027–28 · reviewed by Research Reviewer 02" time="10:42 PKT" /><Notice icon={UserRound} tone="slate" title="Support context viewed" text="Ticket SP-2041 · access reason: document upload failure" time="09:18 PKT" /><Notice icon={ShieldCheck} tone="green" title="Role permission updated" text="Research operators can request publication but cannot self-approve." time="Yesterday" /></section>
    </>
  );
}

function WorkspaceTabs({ active }: { active: string }) {
  return <nav className="workspace-tabs" aria-label="Workspace sections">{workspaceNav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={active === label ? "active" : ""}><Icon size={15} /> {label}</Link>)}</nav>;
}

function OpportunityCard({ item, detailed = false }: { item: (typeof opportunities)[number]; detailed?: boolean }) {
  return (
    <article className={`opportunity-card ${detailed ? "opportunity-card--detailed" : ""}`}>
      <div className="opportunity-card__top"><span className="country-mark">{item.flag}</span><span className={`verification verification--${item.freshness === "Verified" ? "verified" : "due"}`}><i /> {item.freshness}</span><button aria-label={item.saved ? "Remove from portfolio" : "Save to portfolio"}><Heart size={17} fill={item.saved ? "currentColor" : "none"} /></button></div>
      <span className="product-eyebrow">{item.kind} · {item.country}</span>
      <h3>{item.title}</h3><p className="provider">{item.provider}</p>
      <div className="opportunity-card__facts"><span><WalletCards size={14} /> {item.value}</span><span><CalendarDays size={14} /> {item.deadline}</span></div>
      <span className={`match-pill match-pill--${item.match.toLowerCase().replaceAll(" ", "-")}`}>{item.match}</span>
      {detailed && <><ul>{item.reasons.map((reason) => <li key={reason}><Check size={13} /> {reason}</li>)}</ul><div className="condition-note"><AlertCircle size={14} /><span><strong>Still to verify</strong>{item.condition}</span></div></>}
      <div className="opportunity-card__footer"><small>{item.deadlineNote}</small><button>View details <ArrowRight size={14} /></button></div>
    </article>
  );
}

function PortfolioRow({ item }: { item: (typeof opportunities)[number] }) {
  return <div className="portfolio-row"><input type="checkbox" aria-label={`Select ${item.title}`} /><span className="country-mark">{item.flag}</span><span><strong>{item.title}</strong><small>{item.provider} · {item.country}</small></span><span className={`match-pill match-pill--${item.match.toLowerCase().replaceAll(" ", "-")}`}>{item.match}</span><span><strong>{item.deadline}</strong><small>{item.value}</small></span><button><MoreHorizontal size={17} /></button></div>;
}

function Metric({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return <div className={`metric metric--${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function PanelHead({ title, meta }: { title: string; meta: string }) {
  return <div className="panel-head"><h3>{title}</h3><span>{meta}</span></div>;
}

function TaskRow({ task, large = false }: { task: (typeof tasks)[number]; large?: boolean }) {
  return <div className={`task-row ${large ? "task-row--large" : ""}`}><button className="task-check" aria-label={`Complete ${task.title}`}><Check size={13} /></button><span><strong>{task.title}</strong><small>{task.context}</small></span><Status text={task.state} /><time>{task.due}</time><button className="icon-control"><MoreHorizontal size={16} /></button></div>;
}

function MiniApplication({ item }: { item: (typeof applications)[number] }) {
  const progress = Math.round((item.done / item.total) * 100);
  return <Link href="/applications"><span className={`app-dot app-dot--${item.tone}`} /><span><strong>{item.title}</strong><small>{item.provider}</small><div><i style={{ width: `${progress}%` }} /></div></span><em>{progress}%</em></Link>;
}

function Status({ text }: { text: string }) {
  const tone = text.includes("Uploaded") || text.includes("Confirmed") || text.includes("covered") ? "green" : text.includes("Missing") || text.includes("Blocked") || text.includes("Conflict") || text.includes("Action") ? "red" : text.includes("review") || text.includes("Waiting") || text.includes("Conditional") ? "amber" : "blue";
  return <span className={`status-pill status-pill--${tone}`}>{text}</span>;
}

function Requirement({ title, detail, state }: { title: string; detail: string; state: string }) {
  return <div><span className="requirement-icon">{state === "Confirmed" ? <Check size={15} /> : <AlertCircle size={15} />}</span><span><strong>{title}</strong><small>{detail}</small></span><Status text={state} /><button><ArrowRight size={15} /></button></div>;
}

function WritingRow({ title, app, progress, words }: { title: string; app: string; progress: string; words: string }) {
  return <button><span className="file-icon"><FileText size={17} /></span><span><strong>{title}</strong><small>{app}</small><em>{progress}</em></span><span>{words}</span><ArrowRight size={15} /></button>;
}

function EmptyState({ icon: Icon, title, text, action, onAction }: { icon: typeof Search; title: string; text: string; action: string; onAction?: () => void }) {
  return <section className="empty-state"><span><Icon size={24} /></span><h2>{title}</h2><p>{text}</p><button onClick={onAction} className="product-button product-button--secondary">{action}</button></section>;
}

function Scenario({ title, cost, gap, state }: { title: string; cost: string; gap: string; state: string }) {
  return <article className="scenario-card"><div><span className="scenario-icon"><WalletCards size={18} /></span><button><MoreHorizontal size={17} /></button></div><h3>{title}</h3><strong>{cost}</strong><p>{gap}</p><Status text={state} /><button className="scenario-open">Open scenario <ArrowRight size={14} /></button></article>;
}

function Assumption({ label, value, source }: { label: string; value: string; source: string }) {
  return <div><span>{label}<small>{source}</small></span><strong>{value}</strong><button>Edit</button></div>;
}

function OfferFeature({ icon: Icon, title, text }: { icon: typeof BookOpenCheck; title: string; text: string }) {
  return <article><span><Icon size={18} /></span><h3>{title}</h3><p>{text}</p></article>;
}

function ProfileSection({ icon: Icon, title, state, detail }: { icon: typeof UserRound; title: string; state: string; detail: string }) {
  return <button><span><Icon size={18} /></span><span><strong>{title}</strong><small>{detail}</small></span><Status text={state} /><ArrowRight size={15} /></button>;
}

function Notice({ icon: Icon, tone, title, text, time }: { icon: typeof Bell; tone: string; title: string; text: string; time: string }) {
  return <div className="notice"><span className={`notice__icon notice__icon--${tone}`}><Icon size={17} /></span><span><strong>{title}</strong><p>{text}</p><small>{time}</small></span><button><MoreHorizontal size={17} /></button></div>;
}

function HelpCard({ icon: Icon, title, text }: { icon: typeof CircleHelp; title: string; text: string }) {
  return <button><span><Icon size={19} /></span><h3>{title}</h3><p>{text}</p><ArrowRight size={15} /></button>;
}

function AdminModule({ icon: Icon, title, meta }: { icon: typeof Database; title: string; meta: string }) {
  return <button><span><Icon size={19} /></span><div><strong>{title}</strong><small>{meta}</small></div><ArrowRight size={15} /></button>;
}

function pageTitle(module: string) {
  const titles: Record<string, string> = { today: "Today", discover: "Discover", portfolio: "Portfolio", applications: "Applications", workspace: "Tasks", documents: "Documents", writing: "Writing", funding: "Funding", offers: "Offers", profile: "Profile & evidence", notifications: "Notifications", help: "Help & corrections", operations: "Research operations", admin: "Administration" };
  return titles[module] ?? "ScholarPath";
}
