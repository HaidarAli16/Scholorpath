"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Flag,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  Map,
  Pause,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  clearAssessmentDraft,
  loadAssessmentDraft,
  saveAssessmentDraft,
} from "@/lib/draft-store";
import { saveAssessmentHandoff } from "@/lib/assessment-handoff";
import { getAssessmentStepIssue } from "@/modules/assessment/step-validation";
import { ContextHelp } from "@/components/ui/contextual-help";
import {
  fieldOptions,
  intakeOptions,
  originOptions,
  qualificationOptions,
  residenceOptions,
  type AssessmentInput,
  type AssessmentReport,
  type PathwayLane,
} from "@/modules/assessment/types";

type Mode = "welcome" | "assessment" | "analyzing" | "workspace";
type Draft = Partial<AssessmentInput>;

const budgetCurrencies: AssessmentInput["budgetCurrency"][] = [
  "PKR", "INR", "BDT", "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CNY",
  "KRW", "SGD", "MYR", "TRY", "HUF", "NZD", "SAR", "SEK", "CHF", "NOK",
];

const destinationGroups = [
  { label: "Smart start", options: [["suggest", "Let CandidRoute suggest", "Use your complete profile first"], ["World", "Keep the world open", "Compare the best eligible routes"]] },
  { label: "Europe", options: [["UK", "United Kingdom", "Scholarships and taught master's routes"], ["Germany", "Germany", "Public universities and funded routes"], ["Europe", "Wider Europe", "Include Erasmus and consortium routes"]] },
  { label: "Americas", options: [["US", "United States", "Funding-first university routes"], ["Canada", "Canada", "Study and post-study pathways"]] },
  { label: "Asia-Pacific", options: [["Australia", "Australia", "Scholarships and work-right context"], ["Japan", "Japan", "MEXT and university opportunities"], ["Korea", "South Korea", "GKS and university routes"], ["Singapore", "Singapore", "Research-focused pathways"], ["Malaysia", "Malaysia", "Regional value and funding routes"]] },
] as const;

const countryCurrency: Record<string, AssessmentInput["budgetCurrency"]> = {
  Pakistan: "PKR", India: "INR", Bangladesh: "BDT", "United States": "USD", Canada: "CAD", "United Kingdom": "GBP", Germany: "EUR", France: "EUR", Italy: "EUR", Spain: "EUR", Japan: "JPY", China: "CNY", "South Korea": "KRW", Singapore: "SGD", Malaysia: "MYR", Turkey: "TRY", Hungary: "HUF", "New Zealand": "NZD", "Saudi Arabia": "SAR", Sweden: "SEK", Switzerland: "CHF", Norway: "NOK", Australia: "AUD",
};

const pages = [
  { section: 0, label: "Your name" },
  { section: 0, label: "Citizenship" },
  { section: 0, label: "Residence" },
  { section: 1, label: "Qualification" },
  { section: 1, label: "Academic context" },
  { section: 1, label: "Academic result" },
  { section: 1, label: "Degree status" },
  { section: 2, label: "Target intake" },
  { section: 2, label: "Destination" },
  { section: 2, label: "Funding need" },
  { section: 2, label: "Available budget" },
  { section: 3, label: "English readiness" },
  { section: 3, label: "Experience" },
  { section: 3, label: "Research evidence" },
  { section: 3, label: "Weekly capacity" },
  { section: 3, label: "Biggest blocker" },
  { section: 4, label: "Review" },
] as const;

const pageFeedback = [
  "A name is all we need to make this feel like your plan.",
  "This opens the qualification and scholarship rules relevant to you.",
  "Residence stays separate from citizenship so the guidance remains accurate.",
  "Good—now we know which academic framework to compare.",
  "This keeps recommendations relevant to your actual study background.",
  "Your original result stays visible; any conversion is only a planning aid.",
  "Degree timing helps us identify routes you can pursue now.",
  "Your timeline now has a clear anchor.",
  "Staying flexible can reveal stronger-fit routes you may not have considered.",
  "Funding need is evaluated separately from admission fit.",
  "This helps filter out routes that are attractive but not financially realistic.",
  "A test gap becomes a scheduled action—not a judgment on your potential.",
  "Experience is one signal among many, never the whole profile.",
  "No evidence yet is a valid starting point; we will show what to build first.",
  "Your action plan will now fit the time you actually have.",
  "One last review—then your first explainable pathway is ready.",
  "Everything below remains editable, conditional and transparent.",
] as const;

const initialDraft: Draft = {
  nationality: "Pakistan",
  currentCountry: "Pakistan",
  completionStatus: "completed",
  gradeMaximum: 4,
  graduationYear: new Date().getFullYear(),
  intake: "September 2027",
  fundingNeed: "full",
  budgetCurrency: "PKR",
  availableBudget: 500000,
  destinationPreference: "suggest",
  englishStatus: "not_started",
  experienceRange: "none",
  researchEvidence: ["none"],
  weeklyHours: 7,
  biggestBlocker: "where_to_start",
};

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="CandidRoute home">
      <span className="brand__mark"><Sparkles size={17} /></span>
      <span>CandidRoute</span>
      <span className="brand__beta">Preview</span>
    </a>
  );
}

function Button({
  children,
  variant = "primary",
  disabled,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  variant?: "primary" | "quiet" | "secondary";
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={`button button--${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Choice({
  title,
  description,
  selected,
  onClick,
  compact = false,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`choice ${selected ? "choice--selected" : ""} ${compact ? "choice--compact" : ""}`}
      onClick={onClick}
    >
      <span className="choice__control">{selected && <Check size={12} strokeWidth={3} />}</span>
      <span>
        <strong>{title}</strong>
        {description && <small>{description}</small>}
      </span>
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}

function SystemNote({
  title,
  children,
  tone = "blue",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "blue" | "neutral";
}) {
  return (
    <aside className={`system-note system-note--${tone}`}>
      <span className="system-note__icon"><Lightbulb size={17} /></span>
      <div><strong>{title}</strong><p>{children}</p></div>
    </aside>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <main className="landing" id="top">
      <nav className="topbar">
        <Brand />
        <div className="topbar__actions">
          <span className="trust-chip"><ShieldCheck size={14} /> Source-aware guidance</span>
          <Button onClick={onStart}>Build my pathway <ArrowRight size={17} /></Button>
        </div>
      </nav>
      <section className="hero">
        <div className="hero__copy">
          <span className="eyebrow"><Sparkles size={14} /> Built for global applicants</span>
          <h1>A clearer route from <span>“Can I apply?”</span> to “What do I do next?”</h1>
          <p>
            CandidRoute turns your academic record, funding reality and evidence into
            transparent research lanes and an application execution plan.
          </p>
          <div className="hero__actions">
            <Button onClick={onStart}>Build my free pathway <ArrowRight size={18} /></Button>
            <span><Clock3 size={15} /> First useful result in about 5 minutes</span>
          </div>
          <div className="hero__proof">
            <div><strong>No fake probability</strong><span>Conditional and unknown stay visible</span></div>
            <div><strong>No consultant commission</strong><span>Routes are prioritized around your evidence</span></div>
            <div><strong>No AI API required</strong><span>Rules and suggestions remain explainable</span></div>
          </div>
        </div>
        <div className="hero__visual" aria-label="CandidRoute workspace preview">
          <div className="preview-window">
            <div className="preview-window__bar">
              <span><i /><i /><i /></span>
              <small>Today · Your pathway</small>
              <span className="avatar">HM</span>
            </div>
            <div className="preview-window__body">
              <div className="preview-greeting">
                <span className="eyebrow">Your next best move</span>
                <h2>Complete your academic evidence</h2>
                <p>Two research lanes are waiting on your grading-scale proof.</p>
                <button>Continue task <ArrowRight size={15} /></button>
              </div>
              <div className="preview-lanes">
                <span>Suggested research lanes</span>
                {[
                  ["United Kingdom", "Strong lane", "3 conditions"],
                  ["Germany", "Promising", "2 conditions"],
                  ["Erasmus Mundus", "Explore", "4 conditions"],
                ].map(([name, state, conditions], index) => (
                  <div key={name} style={{ "--delay": `${index * 90}ms` } as React.CSSProperties}>
                    <span className="route-orb">{index + 1}</span>
                    <p><strong>{name}</strong><small>{state} · {conditions}</small></p>
                    <ChevronDown size={15} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <span className="floating-tag floating-tag--one"><CheckCircle2 size={15} /> Answer understood</span>
          <span className="floating-tag floating-tag--two"><Sparkles size={15} /> Route recalculated</span>
        </div>
      </section>
    </main>
  );
}

function StepHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  const guidance = eyebrow === "About you"
    ? { title: "Why CandidRoute asks this", summary: "Citizenship and residence select the correct qualification, funding and immigration rule branches.", details: ["Citizenship and residence are stored separately.", "Changing either will recalculate dependent pathway checks."] }
    : eyebrow === "Academic record"
      ? { title: "How academic answers are used", summary: "Your qualification and result are normalized before they are compared with published entry rules.", details: ["The original grading scale is preserved.", "Institution-specific equivalence remains an open check until sourced."] }
      : eyebrow === "Goal and funding"
        ? { title: "How preferences affect results", summary: "Goals, destination and budget prioritise feasible routes; they do not silently remove alternatives.", details: ["Hard eligibility rules run before preference ranking.", "Conditional awards never count as confirmed funding."] }
        : eyebrow === "Evidence and readiness"
          ? { title: "Why evidence changes the pathway", summary: "Declared evidence controls which claims are ready and which become visible tasks.", details: ["Missing evidence is a planning input, not a penalty.", "Readiness measures preparation rather than acceptance probability."] }
          : null;
  return (
    <header className="step-heading">
      <span className="eyebrow">{eyebrow}</span>
      <div className="step-heading__title"><h1>{title}</h1>{guidance && <ContextHelp {...guidance} />}</div>
      <p>{description}</p>
    </header>
  );
}

function buildCoachInsight(page: number, draft: Draft) {
  if (page === 1 && draft.nationality) return `${draft.nationality} selected—we’ll use its qualification and scholarship rule branches.`;
  if (page === 2 && draft.currentCountry && draft.nationality) {
    return draft.currentCountry === draft.nationality
      ? "Citizenship and residence align, so there is one less rule branch to verify."
      : `We’ll keep ${draft.nationality} citizenship and ${draft.currentCountry} residence rules separate.`;
  }
  if (page === 5 && draft.gradeValue && draft.gradeMaximum) return `Result preserved as ${draft.gradeValue}/${draft.gradeMaximum}; the planning signal is ${Math.round((draft.gradeValue / draft.gradeMaximum) * 100)}%.`;
  if (page === 8 && draft.destinationPreference) return draft.destinationPreference === "suggest" ? "Good choice—CandidRoute can compare routes before prioritizing a country." : `${draft.destinationPreference} will be prioritized while alternatives remain visible.`;
  if (page === 9 && draft.fundingNeed) return draft.fundingNeed === "full" ? "We’ll prioritize full-award and lower-cost routes, separate from admission fit." : "Awards and personal-contribution routes will be compared separately.";
  if (page === 11 && draft.englishStatus) return `English readiness is marked ${draft.englishStatus.replaceAll("_", " ")}; the action plan will adjust its timing.`;
  if (page === 13 && draft.researchEvidence) {
    const count = draft.researchEvidence.filter((item) => item !== "none").length;
    return count ? `${count} documentable research signal${count === 1 ? "" : "s"} will inform programme fit.` : "No evidence yet is valid; the plan will show what to build first.";
  }
  if (page === 14 && draft.weeklyHours) return `${draft.weeklyHours} hours per week gives the action planner a realistic pace.`;
  return pageFeedback[page];
}

function CoachLine({ page, draft }: { page: number; draft: Draft }) {
  return (
    <p className="coach-line" aria-live="polite" key={page}>
      <Sparkles size={15} /> {buildCoachInsight(page, draft)}
    </p>
  );
}

function CountryPicker({ value, options, onChange }: { value: string; options: readonly string[]; onChange: (country: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const matches = options.filter((country) => country.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 10);
  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) { setOpen(false); setQuery(""); }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);
  const openPicker = () => { setOpen(true); setActiveIndex(Math.max(0, matches.indexOf(value))); };
  const selectCountry = (country: string) => { onChange(country); setQuery(""); setOpen(false); };
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") { event.preventDefault(); if (!open) openPicker(); else setActiveIndex((index) => Math.min(index + 1, matches.length - 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
    if (event.key === "Enter" && open && matches[activeIndex]) { event.preventDefault(); selectCountry(matches[activeIndex]); }
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); setQuery(""); }
  };
  return (
    <div className={`country-picker ${open ? "is-open" : ""}`} ref={rootRef}>
      <div className="search-field country-picker__control"><Search size={17} /><input role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" aria-activedescendant={open && matches[activeIndex] ? `${listId}-${activeIndex}` : undefined} value={open ? query : value} onFocus={openPicker} onClick={openPicker} onChange={(event) => { setQuery(event.target.value); setOpen(true); setActiveIndex(0); }} onKeyDown={onKeyDown} placeholder="Choose your country" autoComplete="off" /><button type="button" aria-label={open ? "Close country list" : "Open country list"} aria-expanded={open} onClick={() => { if (open) { setOpen(false); setQuery(""); } else openPicker(); }}><ChevronDown size={17} /></button></div>
      {open && <div id={listId} className="country-picker__results" role="listbox" aria-label="Countries">
        {matches.map((country, index) => <button id={`${listId}-${index}`} key={country} type="button" role="option" aria-selected={value === country} className={`${value === country ? "active" : ""} ${activeIndex === index ? "is-highlighted" : ""}`} onMouseEnter={() => setActiveIndex(index)} onMouseDown={(event) => event.preventDefault()} onClick={() => selectCountry(country)}><span>{country}</span>{value === country && <i><Check size={13} /></i>}</button>)}
        {!matches.length && <p className="country-picker__empty">No country found. Try another spelling.</p>}
      </div>}
    </div>
  );
}

function InstitutionTypeahead({ value, country, onChange }: { value: string; country: string; onChange: (value: string) => void }) {
  const [results, setResults] = useState<Array<{ id: string; official_name: string; short_name?: string | null; country_code?: string | null }>>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (value.trim().length < 2) { setResults([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: value.trim(), limit: "8" });
        if (country) params.set("country", country);
        const response = await fetch(`/api/institutions/search?${params}`, { signal: controller.signal });
        if (!response.ok) return;
        const payload = await response.json() as { results?: typeof results };
        setResults(payload.results ?? []);
        setOpen(true);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([]);
      }
    }, 220);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [country, value]);
  return <div className="institution-typeahead"><div className="search-field"><Search size={17} /><input value={value} onFocus={() => setOpen(true)} onChange={(event) => onChange(event.target.value)} placeholder="Search your university" autoComplete="organization" /></div>{open && results.length > 0 && <div className="institution-typeahead__results" role="listbox">{results.map((item) => <button key={item.id} type="button" role="option" aria-selected={value === item.official_name} onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(item.official_name); setOpen(false); }}><strong>{item.official_name}</strong><small>{item.short_name || "Verified institution"}{item.country_code ? ` · ${item.country_code}` : ""}</small></button>)}</div>}</div>;
}

function StepContent({
  step,
  draft,
  update,
}: {
  step: number;
  draft: Draft;
  update: (patch: Draft) => void;
}) {
  const origin = draft.nationality ?? "Pakistan";
  const qualifications = qualificationOptions[origin] ?? qualificationOptions._default;

  if (step >= 0 && step <= 2) {
    return (
      <>
        <StepHeading
          eyebrow="About you"
          title={step === 0 ? "What should we call you?" : step === 1 ? "What is your citizenship?" : "Where do you currently live?"}
          description={step === 0 ? "We’ll use this to personalize your workspace." : step === 1 ? "This helps us use the correct qualification and funding rules." : "Citizenship and residence can affect different parts of your pathway."}
        />
        <div className="form-stack">
          {step === 0 &&
          <Field label="What should we call you?">
            <input
              value={draft.firstName ?? ""}
              onChange={(event) => update({ firstName: event.target.value })}
              placeholder="Your first name"
              autoComplete="given-name"
            />
          </Field>}
          {step === 1 &&
          <Field label="Your citizenship">
            <CountryPicker value={origin} options={originOptions} onChange={(country) => update({ nationality: country, currentCountry: country, qualification: undefined, budgetCurrency: countryCurrency[country] ?? "USD" })} />
          </Field>}
          {step === 2 && <>
          <Field label="Where do you currently live?">
            <div className="select-wrap">
              <select
                value={draft.currentCountry ?? ""}
                onChange={(event) => update({ currentCountry: event.target.value })}
              >
                {residenceOptions.map((country) => <option key={country}>{country}</option>)}
              </select>
              <ChevronDown size={17} />
            </div>
          </Field>
          <SystemNote title="We adjusted the profile branch">
            We’ll use the {origin} qualification structure while keeping residence separate. You can change either later.
          </SystemNote>
          </>}
        </div>
      </>
    );
  }

  if (step >= 3 && step <= 6) {
    const scaleLabel = draft.gradeMaximum === 100 ? "Percentage" : `CGPA out of ${draft.gradeMaximum}`;
    return (
      <>
        <StepHeading
          eyebrow="Academic record"
          title={step === 3 ? "Which qualification will you apply with?" : step === 4 ? "Where and what did you study?" : step === 5 ? "What was your result?" : "What is your degree status?"}
          description={step === 3 ? "Choose the record most relevant to your next degree." : step === 4 ? "This keeps future comparisons aligned with your academic background." : step === 5 ? "Enter it exactly as your institution reports it." : "This tells us which opportunities are timely for you."}
        />
        <div className="form-stack">
          {step === 3 && <>
          <Field label="Highest relevant qualification">
            <div className="select-wrap">
              <select
                value={draft.qualification ?? ""}
                onChange={(event) => {
                  const qualification = event.target.value;
                  const gradeMaximum = qualification.includes("India") ? 10 : draft.gradeMaximum;
                  update({ qualification, gradeMaximum });
                }}
              >
                <option value="">Select a qualification</option>
                {qualifications.map((item) => <option key={item}>{item}</option>)}
              </select>
              <ChevronDown size={17} />
            </div>
          </Field>
          </>}
          {step === 4 && <>
          <Field label="Institution or awarding university" hint="Search the directory, or keep typing if your institution is not listed yet.">
            <InstitutionTypeahead value={draft.institution ?? ""} country={origin} onChange={(institution) => update({ institution })} />
          </Field>
          <Field label="Field family">
            <div className="select-wrap">
              <select value={draft.fieldFamily ?? ""} onChange={(event) => update({ fieldFamily: event.target.value })}>
                <option value="">Select the closest field</option>
                {fieldOptions.map((field) => <option key={field}>{field}</option>)}
              </select>
              <ChevronDown size={17} />
            </div>
          </Field>
          </>}
          {step === 5 && <>
          <div className="two-column">
            <Field label="Result format">
              <div className="select-wrap">
                <select
                  value={draft.gradeMaximum ?? 4}
                  onChange={(event) => update({ gradeMaximum: Number(event.target.value) as 4 | 5 | 10 | 100 })}
                >
                  <option value="4">CGPA out of 4</option>
                  <option value="5">CGPA out of 5</option>
                  <option value="10">CGPA out of 10</option>
                  <option value="100">Percentage</option>
                </select>
                <ChevronDown size={17} />
              </div>
            </Field>
            <Field label={`Your ${scaleLabel.toLowerCase()}`}>
              <input
                type="number"
                min="0"
                max={draft.gradeMaximum ?? 4}
                step="0.01"
                value={draft.gradeValue ?? ""}
                onChange={(event) => update({ gradeValue: Number(event.target.value) })}
                placeholder={draft.gradeMaximum === 100 ? "72" : "3.40"}
              />
            </Field>
          </div>
          {draft.gradeValue ? (
            <SystemNote title="Planning signal calculated">
              Stored as {draft.gradeValue}/{draft.gradeMaximum}. Approximate planning signal: {Math.round((draft.gradeValue / (draft.gradeMaximum ?? 4)) * 100)}%. This is not an official equivalency.
            </SystemNote>
          ) : null}
          </>}
          {step === 6 && <>
          <div className="two-column">
            <Field label="Degree status">
              <div className="select-wrap"><select
                value={draft.completionStatus ?? "completed"}
                onChange={(event) => update({ completionStatus: event.target.value as AssessmentInput["completionStatus"] })}
              >
                <option value="completed">Completed</option>
                <option value="final_year">Final year</option>
                <option value="result_awaited">Result awaited</option>
              </select><ChevronDown size={17} /></div>
            </Field>
            <Field label="Graduation year">
              <input type="number" min="1980" max={new Date().getFullYear() + 4} value={draft.graduationYear ?? ""} onChange={(event) => update({ graduationYear: Number(event.target.value) })} />
            </Field>
          </div>
          </>}
        </div>
      </>
    );
  }

  if (step >= 7 && step <= 10) {
    return (
      <>
        <StepHeading
          eyebrow="Goal and funding"
          title={step === 7 ? "Which intake are you targeting?" : step === 8 ? "Where would you like to study?" : step === 9 ? "How dependent are you on funding?" : "What can you currently contribute?"}
          description={step === 7 ? "This anchors deadlines and preparation time." : step === 8 ? "Choose a preference or let CandidRoute suggest suitable routes." : step === 9 ? "We keep funding eligibility separate from admission fit." : "An honest range helps us filter out financially unrealistic routes."}
        />
        <div className="form-stack">
          {step === 7 &&
          <Field label="Target intake">
            <div className="select-wrap"><select value={draft.intake ?? ""} onChange={(event) => update({ intake: event.target.value })}>
              {intakeOptions.map((intake) => <option key={intake}>{intake}</option>)}
            </select><ChevronDown size={17} /></div>
          </Field>}
          {step === 8 &&
          <Field label="Destination preference">
            <div className="destination-picker">{destinationGroups.map((group) => <section key={group.label}><span>{group.label}</span><div className="choice-grid choice-grid--two">{group.options.map(([value, title, description]) => <Choice key={value} title={title} description={description} selected={draft.destinationPreference === value} onClick={() => update({ destinationPreference: value })} />)}</div></section>)}</div>
          </Field>}
          {step === 9 &&
          <Field label="How dependent are you on funding?">
            <div className="choice-grid choice-grid--two">
              {[
                ["full", "Full funding required", "Tuition and living costs"],
                ["major", "Major funding required", "Most tuition or living costs"],
                ["partial", "Partial award helps", "I have a base contribution"],
                ["self", "I can self-fund", "Subject to the full cost plan"],
              ].map(([value, title, description]) => (
                <Choice key={value} title={title} description={description} selected={draft.fundingNeed === value} onClick={() => update({ fundingNeed: value as AssessmentInput["fundingNeed"] })} />
              ))}
            </div>
          </Field>}
          {step === 10 && <>
          <Field label="Maximum contribution currently available" hint="We keep the original currency. Exchange-rate assumptions will be timestamped later.">
            <div className="money-field">
              <select value={draft.budgetCurrency ?? "PKR"} onChange={(event) => update({ budgetCurrency: event.target.value as AssessmentInput["budgetCurrency"] })}>
                {budgetCurrencies.map((currency) => <option key={currency}>{currency}</option>)}
              </select>
              <input type="number" min="0" step="10000" value={draft.availableBudget ?? 0} onChange={(event) => update({ availableBudget: Number(event.target.value) })} />
            </div>
          </Field>
          <SystemNote title="Early route signal">
            {draft.fundingNeed === "full"
              ? "We’ll prioritize scholarship-dependent and lower-tuition lanes."
              : "We’ll compare awards with responsible personal-contribution routes."}
          </SystemNote>
          </>}
        </div>
      </>
    );
  }

  if (step >= 11 && step <= 15) {
    const toggleEvidence = (value: AssessmentInput["researchEvidence"][number]) => {
      const current = draft.researchEvidence ?? ["none"];
      if (value === "none") return update({ researchEvidence: ["none"] });
      const withoutNone = current.filter((item) => item !== "none");
      const next = withoutNone.includes(value)
        ? withoutNone.filter((item) => item !== value)
        : [...withoutNone, value];
      update({ researchEvidence: next.length ? next : ["none"] });
    };
    return (
      <>
        <StepHeading
          eyebrow="Evidence and readiness"
          title={step === 11 ? "Where are you with your English test?" : step === 12 ? "How much relevant experience do you have?" : step === 13 ? "What academic evidence can you document?" : step === 14 ? "How much time can you give this each week?" : "What is blocking you most?"}
          description={step === 11 ? "This helps sequence preparation and deadlines." : step === 12 ? "Experience helps, but it is only one part of the profile." : step === 13 ? "Select what you can prove today—none yet is completely valid." : step === 14 ? "We’ll pace your actions around your real capacity." : "Your answer helps us choose the most useful first task."}
        />
        <div className="form-stack">
          {step === 11 && <>
          <Field label="English-test status">
            <div className="choice-grid choice-grid--two">
              {[
                ["not_started", "Not started"],
                ["preparing", "Preparing"],
                ["booked", "Test booked"],
                ["completed", "Score available"],
              ].map(([value, title]) => (
                <Choice key={value} title={title} compact selected={draft.englishStatus === value} onClick={() => update({ englishStatus: value as AssessmentInput["englishStatus"] })} />
              ))}
            </div>
          </Field>
          {draft.englishStatus === "completed" && (
            <div className="two-column reveal">
              <Field label="Test">
                <div className="select-wrap"><select value={draft.englishTest ?? ""} onChange={(event) => update({ englishTest: event.target.value as AssessmentInput["englishTest"] })}>
                  <option value="">Select test</option><option>IELTS</option><option>TOEFL</option><option>PTE</option><option>Other</option>
                </select><ChevronDown size={17} /></div>
              </Field>
              <Field label="Overall score">
                <input type="number" step="0.5" value={draft.englishScore ?? ""} onChange={(event) => update({ englishScore: Number(event.target.value) })} placeholder="e.g. 7.0" />
              </Field>
            </div>
          )}
          </>}
          {step === 12 &&
          <Field label="Relevant work experience">
            <div className="select-wrap"><select value={draft.experienceRange ?? "none"} onChange={(event) => update({ experienceRange: event.target.value as AssessmentInput["experienceRange"] })}>
              <option value="none">No formal experience yet</option>
              <option value="under_one">Under 1 year</option>
              <option value="one_to_two">1–2 years</option>
              <option value="three_plus">3+ years</option>
            </select><ChevronDown size={17} /></div>
          </Field>}
          {step === 13 &&
          <Field label="Research or project evidence" hint="Select everything you can document.">
            <div className="chip-grid">
              {[
                ["thesis", "Thesis"],
                ["assistantship", "Research assistantship"],
                ["publication", "Publication or poster"],
                ["project", "Major academic project"],
                ["none", "None yet"],
              ].map(([value, title]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={draft.researchEvidence?.includes(value as AssessmentInput["researchEvidence"][number])}
                  className={draft.researchEvidence?.includes(value as AssessmentInput["researchEvidence"][number]) ? "active" : ""}
                  onClick={() => toggleEvidence(value as AssessmentInput["researchEvidence"][number])}
                >
                  {draft.researchEvidence?.includes(value as AssessmentInput["researchEvidence"][number]) && <Check size={13} />}
                  {title}
                </button>
              ))}
            </div>
          </Field>}
          {step === 14 &&
          <Field label={`Weekly time available · ${draft.weeklyHours ?? 7} hours`}>
            <input className="range" type="range" min="1" max="20" value={draft.weeklyHours ?? 7} onChange={(event) => update({ weeklyHours: Number(event.target.value) })} />
            <span className="range-labels"><span>1 hour</span><span>20 hours</span></span>
          </Field>}
          {step === 15 &&
          <Field label="What is blocking you most?">
            <div className="select-wrap"><select value={draft.biggestBlocker ?? "where_to_start"} onChange={(event) => update({ biggestBlocker: event.target.value as AssessmentInput["biggestBlocker"] })}>
              <option value="where_to_start">I do not know where to start</option>
              <option value="eligibility">I cannot judge eligibility</option>
              <option value="funding">Funding feels unclear</option>
              <option value="documents">My documents are disorganized</option>
              <option value="deadlines">I keep missing timelines</option>
            </select><ChevronDown size={17} /></div>
          </Field>}
        </div>
      </>
    );
  }

  const grade = draft.gradeValue && draft.gradeMaximum
    ? Math.round((draft.gradeValue / draft.gradeMaximum) * 100)
    : 0;
  return (
    <>
      <StepHeading
        eyebrow="Review"
        title={`${draft.firstName || "Your"} profile is ready for a first pathway.`}
        description="Review the facts and derived signals below. The result will keep unresolved evidence visible."
      />
      <div className="review-grid">
        <div><span>Academic</span><strong>{draft.qualification}</strong><small>{draft.fieldFamily} · {grade}% planning signal</small></div>
        <div><span>Goal</span><strong>Taught master’s</strong><small>{draft.intake} · {draft.destinationPreference === "suggest" ? "System-suggested routes" : `${draft.destinationPreference} preferred`}</small></div>
        <div><span>Funding</span><strong>{draft.fundingNeed?.replace("_", " ")} funding</strong><small>{draft.budgetCurrency} {draft.availableBudget?.toLocaleString()} available</small></div>
        <div><span>Evidence</span><strong>{draft.englishStatus?.replaceAll("_", " ")}</strong><small>{draft.researchEvidence?.filter((item) => item !== "none").length || "No"} research signals declared</small></div>
      </div>
      <SystemNote title="What the system will do next">
        Generate a balanced set of research lanes, label every unresolved condition and turn
        the highest-impact gaps into an ordered task plan.
      </SystemNote>
      <div className="consent">
        <LockKeyhole size={18} />
        <p><strong>Transparent by design.</strong> No admission, scholarship or visa outcome will be predicted or guaranteed.</p>
      </div>
    </>
  );
}

function AnalysisView({ stage }: { stage: number }) {
  const checks = [
    "Structuring your academic record",
    "Separating constraints from preferences",
    "Generating responsible research lanes",
    "Ordering your next actions",
  ];
  return (
    <main className="analysis-view">
      <Brand />
      <div className="analysis-card">
        <div className="analysis-mark"><Sparkles size={24} /></div>
        <span className="eyebrow">Building your pathway</span>
        <h1>Turning answers into an explainable plan.</h1>
        <p>We’re preserving uncertainty instead of hiding it behind a percentage.</p>
        <div className="analysis-list">
          {checks.map((check, index) => (
            <div key={check} className={index < stage ? "complete" : index === stage ? "active" : ""}>
              <span>{index < stage ? <Check size={14} /> : index + 1}</span>
              <strong>{check}</strong>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function RouteCard({
  route,
  expanded,
  onToggle,
}: {
  route: PathwayLane;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article className={`route-card ${expanded ? "route-card--expanded" : ""}`}>
      <button className="route-card__summary" onClick={onToggle} aria-expanded={expanded}>
        <span className={`route-rank route-rank--${route.strength}`}>{route.strength === "strong" ? <Sparkles size={17} /> : <Map size={17} />}</span>
        <span><small>{route.strength} research lane</small><strong>{route.title}</strong><em>{route.subtitle}</em></span>
        <span className={`state state--${route.state}`}>{route.state.replace("_", " ")}</span>
        <ChevronDown size={18} />
      </button>
      {expanded && (
        <div className="route-card__detail">
          <div>
            <h4>Why this route surfaced</h4>
            <ul>{route.why.map((item) => <li key={item}><CheckCircle2 size={15} />{item}</li>)}</ul>
          </div>
          <div>
            <h4>Conditions still open</h4>
            <ul>{route.conditions.map((item) => <li key={item}><CircleAlert size={15} />{item}</li>)}</ul>
          </div>
          <div className="route-next">
            <span>Next action</span><strong>{route.nextAction}</strong>
            <a href={route.sourceUrl} target="_blank" rel="noreferrer">{route.sourceLabel} <ArrowRight size={14} /></a>
          </div>
        </div>
      )}
    </article>
  );
}

function Workspace({
  report,
  name,
  onRestart,
}: {
  report: AssessmentReport;
  name: string;
  onRestart: () => void;
}) {
  const [expanded, setExpanded] = useState(report.pathways[0].id);
  const [tasks, setTasks] = useState(report.actionPlan);
  const done = tasks.filter((task) => task.complete).length;

  return (
    <main className="workspace">
      <aside className="workspace-nav">
        <Brand />
        <nav>
          <a className="active" href="#today"><LayoutDashboard size={18} />Today</a>
          <a href="#pathways"><Map size={18} />Pathways</a>
          <a href="#tasks"><ListChecks size={18} />Tasks <span>{tasks.length - done}</span></a>
          <a href="#profile"><UserRound size={18} />Profile</a>
        </nav>
        <div className="workspace-nav__trust"><ShieldCheck size={17} /><span><strong>Evidence-aware</strong>Suggestions show their conditions.</span></div>
      </aside>
      <section className="workspace-main">
        <header className="workspace-top">
          <div><span className="mobile-brand"><Brand /></span><strong>Your pathway workspace</strong></div>
          <div><span className="sync-state"><i /> Profile saved</span><button onClick={onRestart}><RotateCcw size={15} /> Reassess</button><button className="workspace-enter" onClick={() => window.location.href = "/today"}>Open full workspace <ArrowRight size={15} /></button><span className="avatar">{name.slice(0, 2).toUpperCase()}</span></div>
        </header>
        <div className="workspace-content">
          <section className="workspace-hero" id="today">
            <div>
              <span className="eyebrow">Good start, {name}</span>
              <h1>{report.headline}</h1>
              <p>{report.summary}</p>
            </div>
            <div className="completeness">
              <span style={{ "--value": `${report.profileCompleteness * 3.6}deg` } as React.CSSProperties}><strong>{report.profileCompleteness}%</strong></span>
              <p><strong>Profile evidence</strong><small>{report.confidence} confidence</small></p>
            </div>
          </section>

          <section className="next-best">
            <div className="next-best__icon"><BookOpenCheck size={23} /></div>
            <div><span>Next best action · Today</span><h2>{tasks.find((task) => !task.complete)?.title ?? "Review your completed pathway"}</h2><p>{tasks.find((task) => !task.complete)?.detail}</p></div>
            <Button onClick={() => document.querySelector("#tasks")?.scrollIntoView()}>Open task <ArrowRight size={16} /></Button>
          </section>

          <section className="workspace-section" id="profile">
            <div className="section-title"><div><span className="eyebrow">System understanding</span><h2>Your profile snapshot</h2></div><span className="legend"><i /> Derived from your answers</span></div>
            <div className="snapshot-grid">
              {Object.entries(report.snapshot).map(([key, value]) => (
                <div key={key}><span>{key}</span><strong>{value}</strong></div>
              ))}
            </div>
          </section>

          <section className="workspace-section" id="pathways">
            <div className="section-title">
              <div><span className="eyebrow">Suggested, not guaranteed</span><h2>Your research lanes</h2></div>
              <p>Prioritized around your constraints. Every condition stays visible.</p>
            </div>
            <div className="route-list">
              {report.pathways.map((route) => (
                <RouteCard key={route.id} route={route} expanded={expanded === route.id} onToggle={() => setExpanded(expanded === route.id ? "" as PathwayLane["id"] : route.id)} />
              ))}
            </div>
          </section>

          <section className="workspace-grid">
            <div className="workspace-section tasks" id="tasks">
              <div className="section-title"><div><span className="eyebrow">Execution plan</span><h2>Your next actions</h2></div><strong>{done}/{tasks.length}</strong></div>
              <div className="task-list">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    className={task.complete ? "complete" : ""}
                    onClick={() => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, complete: !item.complete } : item))}
                  >
                    <span className="task-check">{task.complete && <Check size={14} />}</span>
                    <span><small>{task.horizon} · {task.impact}</small><strong>{task.title}</strong><em>{task.detail}</em></span>
                  </button>
                ))}
              </div>
            </div>
            <aside className="evidence-panel">
              <span className="eyebrow">Needs confirmation</span>
              <h2>Evidence still open</h2>
              <p>These gaps prevent the system from calling a route verified.</p>
              <ul>{report.evidenceGaps.map((gap) => <li key={gap}><Flag size={15} />{gap}</li>)}</ul>
              <div className="evidence-panel__foot"><LockKeyhole size={16} /> Private documents will use protected storage paths.</div>
            </aside>
          </section>

          <section className="method-note">
            <ShieldCheck size={20} />
            <div><strong>How to read this workspace</strong><p>{report.assumptions.join(" ")}</p></div>
          </section>
        </div>
      </section>
    </main>
  );
}

const adSlides = [
  {
    tag: "Verified Catalogue",
    title: "100% Official Sources, <span>Zero Unverified Blogs</span>",
    description: "Every scholarship deadline, grade requirement, and coverage rule is traced directly to official university & government portals.",
    badge: "Official Data Pipeline",
    proofIcon: ShieldCheck,
    proofTitle: "Direct Source Integrity",
    proofSubtitle: "Updated continuously with audit timestamps",
  },
  {
    tag: "Worldwide coverage",
    title: "Designed for <span>Pakistan, India & Bangladesh</span>",
    description: "Built-in equivalency signals for HEC/CBSE/State boards, proof of funds guidelines, and local currency cost calculators.",
    badge: "Regional Intelligence",
    proofIcon: Flag,
    proofTitle: "HEC, CBSE & Board Support",
    proofSubtitle: "Original grading scales preserved without distortion",
  },
  {
    tag: "No Agency Bias",
    title: "Zero Consultant Fees, <span>Save $2,000+</span>",
    description: "Independent, evidence-backed matching. We never push low-quality partner colleges or take secret agency commissions.",
    badge: "Unbiased Matching",
    proofIcon: Sparkles,
    proofTitle: "100% Student-First",
    proofSubtitle: "Your evidence dictates the ranking, not agent payouts",
  },
  {
    tag: "Explainable Engine",
    title: "Clear Match Rules: <span>Confirmed or Conditional</span>",
    description: "Never guess why a program surfaced. See exact confirmed facts, conditional requirements, and missing evidence items.",
    badge: "No Fake AI Scores",
    proofIcon: BookOpenCheck,
    proofTitle: "Auditable Decisions",
    proofSubtitle: "Every recommendation provides a clear reason & next action",
  },
  {
    tag: "Execution System",
    title: "Turn Pathways into <span>Weekly Executable Tasks</span>",
    description: "Auto-generate prioritized task lists, document vaults, writing guides, and funding scenario calculators for your target intake.",
    badge: "Complete Workspace",
    proofIcon: ListChecks,
    proofTitle: "Step-by-Step Progress",
    proofSubtitle: "Deadlines, proof requirements, and writing guides included",
  },
];

function AdCarousel({ activeSection }: { activeSection: number }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setSlideIndex(activeSection % adSlides.length);
  }, [activeSection]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % adSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const slide = adSlides[slideIndex];
  const ProofIcon = slide.proofIcon;

  return (
    <aside
      className="ad-carousel-card"
      aria-label="CandidRoute value carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="ad-carousel-header">
        <Brand />
        <div className="ad-carousel-pills" aria-label="Carousel slides">
          {adSlides.map((_, index) => (
            <button
              key={index}
              type="button"
              className="ad-carousel-pill"
              onClick={() => setSlideIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            >
              <div
                className="ad-carousel-pill__fill"
                style={{ width: slideIndex === index ? "100%" : "0%" }}
              />
            </button>
          ))}
        </div>
        <span className="ad-carousel-badge">{slide.badge}</span>
      </div>

      <div className="ad-carousel-content" key={slideIndex}>
        <span className="ad-carousel-tag">
          <Sparkles size={14} /> {slide.tag}
        </span>
        <h2
          className="ad-carousel-title"
          dangerouslySetInnerHTML={{ __html: slide.title }}
        />
        <p className="ad-carousel-description">{slide.description}</p>

        <div className="ad-carousel-proof">
          <div className="ad-carousel-proof__icon">
            <ProofIcon size={20} />
          </div>
          <div className="ad-carousel-proof__text">
            <strong>{slide.proofTitle}</strong>
            <span>{slide.proofSubtitle}</span>
          </div>
        </div>
      </div>

      <div className="ad-carousel-footer">
        <div className="ad-carousel-dots">
          {adSlides.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`ad-carousel-dot ${slideIndex === index ? "active" : ""}`}
              onClick={() => setSlideIndex(index)}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
        <div className="ad-carousel-nav">
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? "Play slide rotation" : "Pause slide rotation"}
          >
            {isPaused ? <Play size={13} /> : <Pause size={13} />}
          </button>
          <button
            type="button"
            onClick={() => setSlideIndex((slideIndex - 1 + adSlides.length) % adSlides.length)}
            title="Previous slide"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => setSlideIndex((slideIndex + 1) % adSlides.length)}
            title="Next slide"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function AssessmentExperience() {
  const [mode, setMode] = useState<Mode>("welcome");
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = loadAssessmentDraft();
    if (stored) setDraft((current) => ({ ...current, ...stored }));
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("retake") !== "1") return;
    let active = true;
    fetch("/api/workspace", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((payload: { authenticated?: boolean; data?: { assessment?: { answers?: Draft | null } | null } | null } | null) => {
        const answers = payload?.authenticated ? payload.data?.assessment?.answers : null;
        if (!active || !answers) return;
        setDraft((current) => ({ ...current, ...answers }));
        setStep(0);
        setMode("assessment");
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (mode === "assessment") saveAssessmentDraft(draft);
  }, [draft, mode]);

  useEffect(() => {
    if (mode !== "analyzing") return;
    setAnalysisStage(0);
    const timers = [350, 700, 1050, 1400].map((delay, index) =>
      window.setTimeout(() => setAnalysisStage(index + 1), delay),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [mode]);

  const update = (patch: Draft) => {
    setError("");
    setDraft((current) => ({ ...current, ...patch }));
  };

  const stepIssue = useMemo(() => getAssessmentStepIssue(draft, step), [draft, step]);

  const submit = async () => {
    setMode("analyzing");
    setError("");
    window.scrollTo({ top: 0, behavior: "auto" });
    try {
      const [response] = await Promise.all([
        fetch("/api/assessment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        }),
        new Promise((resolve) => window.setTimeout(resolve, 1700)),
      ]);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Some answers need attention.");
      const completedReport = result as AssessmentReport;
      const idempotencyKey = crypto.randomUUID();
      saveAssessmentHandoff(draft, completedReport, { requiresClaim: true, idempotencyKey });
      setReport(completedReport);
      clearAssessmentDraft();
      window.location.assign("/auth?next=%2Freport&reason=assessment");
    } catch (submissionError) {
      setMode("assessment");
      setError(submissionError instanceof Error ? submissionError.message : "We could not build your pathway.");
    }
  };

  if (mode === "welcome") return <Welcome onStart={() => setMode("assessment")} />;
  if (mode === "analyzing") return <AnalysisView stage={analysisStage} />;
  if (mode === "workspace" && report) return <Workspace report={report} name={draft.firstName ?? "Student"} onRestart={() => { setReport(null); setStep(0); setMode("assessment"); }} />;

  const activeSection = pages[step].section;
  const move = (next: number, nextDirection: "forward" | "back") => {
    setDirection(nextDirection);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const continueAssessment = () => {
    if (stepIssue) {
      setError(stepIssue);
      return;
    }
    if (step === pages.length - 1) void submit();
    else move(step + 1, "forward");
  };

  return (
    <main className="assessment-shell">
      <div className="split-onboarding-layout">
        <AdCarousel activeSection={activeSection} />

        <section className="split-onboarding-inputs">
          <header className="onboarding-input-header">
            <span className="onboarding-step-label">Step {step + 1} of {pages.length} · {pages[step].label}</span>
            <span><Check size={13} /> Saved locally</span>
          </header>
          <div>
            <div className="higgsfield-progress" aria-label={`Step ${step + 1} of ${pages.length}`}>
              {pages.map((p, index) => (
                <button
                  key={index}
                  type="button"
                  className="higgsfield-progress__pill"
                  onClick={() => index <= step && move(index, index < step ? "back" : "forward")}
                  title={p.label}
                >
                  <div className="higgsfield-progress__fill" style={{ width: index <= step ? "100%" : "0%" }} />
                </button>
              ))}
            </div>



            <div className={`form-content form-content--${direction}`} key={step}>
              <StepContent step={step} draft={draft} update={update} />
              <CoachLine page={step} draft={draft} />
            </div>
          </div>

          <footer className="form-footer">
            <Button variant="quiet" disabled={step === 0} onClick={() => move(step - 1, "back")}><ArrowLeft size={16} /> Back</Button>
            <div>{error && <span className="form-error" role="alert" aria-live="polite">{error}</span>}<Button aria-disabled={Boolean(stepIssue)} onClick={continueAssessment}>{step === pages.length - 1 ? "Build my pathway" : "Continue"} <ArrowRight size={16} /></Button></div>
          </footer>
        </section>
      </div>
    </main>
  );
}
