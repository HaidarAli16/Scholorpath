"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, CalendarClock, Check, ChevronRight, CircleDollarSign, CloudRain, ExternalLink, FileCheck2, GraduationCap, HeartHandshake, Home, Info, Landmark, MapPin, Search, ShieldCheck, Sparkles, Stethoscope, TrainFront, Users, WalletCards, X } from "lucide-react";
import { useEducationDirectory } from "@/lib/use-education-directory";
import type { CountryIntelligence, InstitutionDirectoryItem } from "@/modules/directory/types";
import "./education-directory.css";

const number = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function verified(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? "Review date unavailable" : `Verified ${date.format(parsed)}`; }
function money(value: number | null | undefined, currency: string) { return value == null ? "Open check" : `${currency} ${number.format(Number(value))}`; }

export function CountryIntelligenceCenter() {
  const { countries, mode, warning } = useEducationDirectory();
  const [selectedCode, setSelectedCode] = useState("GB");
  const [cityId, setCityId] = useState("");
  const country = countries.find((item) => item.code === selectedCode) ?? countries[0];
  const firstCityId = country?.cities[0]?.id ?? "";
  useEffect(() => { setCityId(firstCityId); }, [firstCityId]);
  if (!country) return null;
  const city = country.cities.find((item) => item.id === cityId) ?? country.cities[0];
  return <div className="directory-page">
    <header className="directory-hero">
      <div><span className="product-eyebrow"><Sparkles size={14} /> Country intelligence</span><h1>Know the route before choosing the university.</h1><p>Compare the money, visa, work, housing and daily-life conditions that determine whether a pathway is genuinely feasible.</p></div>
      <aside><span className={`directory-live directory-live--${mode}`}><i />{mode === "live" ? "Live verified database" : mode === "loading" ? "Loading intelligence" : "Curated offline dataset"}</span><strong>4</strong><small>beta destinations · UK, Germany, Netherlands and Ireland</small></aside>
    </header>
    {warning && <div className="directory-warning"><Info size={16} />{warning}</div>}
    <nav className="country-switcher" aria-label="Destination countries">{countries.map((item) => <button key={item.code} className={country.code === item.code ? "active" : ""} onClick={() => setSelectedCode(item.code)}><span>{item.flag}</span><strong>{item.name}</strong><small>{item.currencyCode} · {item.studentRoute}</small></button>)}</nav>
    <section className="country-command-card">
      <div className="country-command-card__title"><span>{country.flag}</span><div><small>{country.primaryLanguage} · {country.currencyCode}</small><h2>{country.name}</h2><p>{country.summary}</p></div></div>
      <div className="country-command-metrics"><Metric label="Monthly planning" value={`${country.currencySymbol}${number.format(Number(country.monthlyCostLow))}–${country.currencySymbol}${number.format(Number(country.monthlyCostHigh))}`} detail="living range" /><Metric label="Proof of funds" value={money(country.proofFundsAmount, country.proofFundsCurrency ?? country.currencyCode)} detail={`${country.proofFundsMonths ?? "—"} month basis`} /><Metric label="Term work" value={`${country.workHours ?? "—"} hrs`} detail="weekly limit signal" /><Metric label="Post-study" value={`${country.postStudyMonths ?? "—"} mo`} detail="maximum headline route" /></div>
      <div className="country-command-card__status"><ShieldCheck size={17} /><span><strong>{verified(country.lastVerifiedAt)}</strong><small>Next immigration review {date.format(new Date(country.nextReviewAt))}. Every figure is a planning input, not legal advice.</small></span></div>
    </section>
    <div className="country-main-grid">
      <section className="directory-panel visa-roadmap"><header><div><span className="product-eyebrow">Visa readiness</span><h2>What the route demands</h2></div><span className="difficulty-chip">{country.visaDifficulty} complexity</span></header><div className="roadmap-steps"><Roadmap icon={FileCheck2} n="01" title="Secure admission" text="Obtain the institution-issued admission and sponsorship documents required for the route." /><Roadmap icon={WalletCards} n="02" title="Prove the money" text={`${money(country.proofFundsAmount, country.proofFundsCurrency ?? country.currencyCode)} headline evidence basis; tuition and deposits can be additional.`} /><Roadmap icon={Stethoscope} n="03" title="Cover healthcare" text={country.healthcare} /><Roadmap icon={CalendarClock} n="04" title="Apply with time" text={country.visaUncertainty} /></div></section>
      <BudgetConverter country={country} city={city} />
    </div>
    <section className="directory-panel city-lab"><header><div><span className="product-eyebrow">City feasibility lab</span><h2>City choice changes the answer.</h2></div><div className="city-selector">{country.cities.map((item) => <button key={item.id} className={city?.id === item.id ? "active" : ""} onClick={() => setCityId(item.id)}>{item.name}</button>)}</div></header>{city && <div className="city-lab-grid"><article className="city-cost-card"><div><MapPin size={18} /><span><small>Selected city</small><strong>{city.name}</strong></span></div><strong>{country.currencySymbol}{number.format(city.monthlyCostLow)}–{country.currencySymbol}{number.format(city.monthlyCostHigh)}</strong><p>Indicative monthly living range</p><div className="range-track"><i style={{ width: `${Math.min(100, Math.round(city.confidence))}%` }} /></div><small>{city.confidence}% evidence confidence · accommodation {country.currencySymbol}{number.format(city.accommodationLow)}–{country.currencySymbol}{number.format(city.accommodationHigh)}</small></article><CitySignal icon={Home} label="Housing & deposit" text={city.deposit} /><CitySignal icon={TrainFront} label="Transport" text={city.transport} /><CitySignal icon={ShieldCheck} label="Safety context" text={city.safety} /><CitySignal icon={CloudRain} label="Climate" text={city.climate} /><CitySignal icon={Users} label="Community fit" text={city.community} /></div>}</section>
    <section className="country-life-grid"><LifeCard icon={BriefcaseBusiness} title="Work while studying" text={country.work} /><LifeCard icon={GraduationCap} title="After graduation" text={country.postStudy} /><LifeCard icon={HeartHandshake} title="Community and belonging" text={country.community} /><LifeCard icon={CloudRain} title="Climate and lifestyle" text={country.climate} /></section>
    <footer className="directory-method"><Info size={18} /><div><strong>How to use this module</strong><p>Use country and city data to remove infeasible routes before ranking programmes. Visa thresholds are not the same as a realistic budget, community signals are not guarantees, and all material facts retain verification and review dates.</p></div><Link href="/institutions">Compare institutions <ArrowRight size={15} /></Link></footer>
  </div>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <span><small>{label}</small><strong>{value}</strong><em>{detail}</em></span>; }
function Roadmap({ icon: Icon, n, title, text }: { icon: typeof FileCheck2; n: string; title: string; text: string }) { return <article><span><Icon size={17} /></span><div><small>{n}</small><strong>{title}</strong><p>{text}</p></div></article>; }
function CitySignal({ icon: Icon, label, text }: { icon: typeof Home; label: string; text: string }) { return <article className="city-signal"><span><Icon size={17} /></span><div><small>{label}</small><p>{text}</p></div></article>; }
function LifeCard({ icon: Icon, title, text }: { icon: typeof Home; title: string; text: string }) { return <article><span><Icon size={18} /></span><h3>{title}</h3><p>{text}</p></article>; }

function BudgetConverter({ country, city }: { country: CountryIntelligence; city?: CountryIntelligence["cities"][number] }) {
  const [from, setFrom] = useState<"PKR" | "INR" | "BDT">("PKR");
  const [amount, setAmount] = useState("500000");
  const [result, setResult] = useState<{ converted: number; rate: number; state: string; source: string; asOf: string; warning?: string } | null>(null);
  const target = country.currencyCode as "GBP" | "EUR";
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/fx?from=${from}&to=${target}&amount=${Number(amount) || 0}`, { signal: controller.signal });
      if (response.ok) setResult(await response.json());
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [amount, from, target]);
  const months = result && city?.monthlyCostLow ? result.converted / city.monthlyCostLow : 0;
  return <section className="directory-panel budget-lab"><span className="product-eyebrow"><CircleDollarSign size={14} /> Budget translator</span><h2>What does your money cover?</h2><p>Convert a home-currency budget into a city-level runway. Visa evidence uses the authority’s conversion method, not this planning rate.</p><div className="budget-input"><select value={from} onChange={(event) => setFrom(event.target.value as typeof from)}><option>PKR</option><option>INR</option><option>BDT</option></select><input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} /></div><div className="budget-result"><span><small>Indicative value</small><strong>{country.currencySymbol}{number.format(result?.converted ?? 0)}</strong></span><span><small>{city?.name ?? country.name} runway</small><strong>{months.toFixed(1)} months</strong></span></div><div className="budget-bar"><i style={{ width: `${Math.min(100, months / 12 * 100)}%` }} /></div><small className={`rate-state rate-state--${result?.state ?? "loading"}`}><i />{result ? `${result.source} · ${verified(result.asOf)}` : "Loading current rate…"}</small>{result?.warning && <p className="budget-warning">{result.warning}</p>}</section>;
}

export function InstitutionDirectoryCenter({ origin = "Pakistan" }: { origin?: "Pakistan" | "India" | "Bangladesh" }) {
  const { institutions, countries, mode, warning } = useEducationDirectory();
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [selectedOrigin, setSelectedOrigin] = useState(origin);
  const [selected, setSelected] = useState<InstitutionDirectoryItem | null>(null);
  const filtered = useMemo(() => institutions.filter((item) => (country === "all" || item.countryCode === country) && `${item.name} ${item.city ?? ""} ${item.countryName}`.toLowerCase().includes(query.toLowerCase())), [country, institutions, query]);
  return <div className="directory-page">
    <header className="directory-hero institution-hero"><div><span className="product-eyebrow"><Landmark size={14} /> Institution directory</span><h1>Compare fit first. Use rankings as context.</h1><p>Universities, campuses, origin-specific equivalence, published rankings and evidence requirements in one auditable view.</p></div><aside><span className={`directory-live directory-live--${mode}`}><i />{mode === "live" ? "Live verified database" : "Curated beta directory"}</span><strong>{institutions.length}</strong><small>published institutions · {institutions.filter((item) => item.rankings.length).length} with ranking evidence</small></aside></header>
    {warning && <div className="directory-warning"><Info size={16} />{warning}</div>}
    <section className="institution-controls"><label><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search university, city or country" /></label><select value={country} onChange={(event) => setCountry(event.target.value)}><option value="all">All destinations</option>{countries.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select><select value={selectedOrigin} onChange={(event) => setSelectedOrigin(event.target.value as typeof selectedOrigin)}><option>Pakistan</option><option>India</option><option>Bangladesh</option></select></section>
    <div className="institution-explainer"><ShieldCheck size={18} /><span><strong>Ranking guardrail active</strong><small>Published rank never overrides eligibility, affordability, evidence, deadline or visa feasibility.</small></span><div><span>Eligibility</span><span>Affordability</span><span>Career fit</span><span>Evidence</span></div></div>
    <div className="institution-grid">{filtered.map((item) => {
      const equivalency = item.equivalencies.find((entry) => entry.originCountry === selectedOrigin);
      const ranking = item.rankings[0];
      return <article className="institution-card" key={item.id}><header><span>{item.flag}</span><div><small>{item.city ? `${item.city} · ` : ""}{item.countryName}</small><h2>{item.name}</h2></div><button onClick={() => setSelected(item)} aria-label={`Open ${item.name}`}><ChevronRight size={18} /></button></header><p>{item.summary}</p><div className="institution-signals"><span><small>Published rank</small><strong>{ranking ? `${ranking.publisher} ${ranking.rankLabel}` : "Not loaded"}</strong><em>{ranking ? `${ranking.name} ${ranking.year}` : "No prestige assumption"}</em></span><span><small>{selectedOrigin} equivalence</small><strong>{equivalency ? equivalency.state.replaceAll("_", " ") : "Open check"}</strong><em>{equivalency?.minimumResult ?? "Institution review required"}</em></span></div><div className="institution-meta"><span><Building2 size={14} /> {item.campusCount || "—"} campus record</span><span><GraduationCap size={14} /> {item.programmeCount || "—"} live programmes</span></div><footer><small>{verified(item.lastVerifiedAt)}</small><button onClick={() => setSelected(item)}>View evidence <ArrowRight size={14} /></button></footer></article>;
    })}</div>
    {!filtered.length && <div className="institution-empty"><Search size={24} /><strong>No institution matches these filters.</strong><small>Clear the search or choose another destination.</small></div>}
    {selected && <InstitutionDrawer item={selected} origin={selectedOrigin} onClose={() => setSelected(null)} />}
  </div>;
}

function InstitutionDrawer({ item, origin, onClose }: { item: InstitutionDirectoryItem; origin: "Pakistan" | "India" | "Bangladesh"; onClose: () => void }) {
  const equivalency = item.equivalencies.find((entry) => entry.originCountry === origin);
  return <div className="directory-drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside className="directory-drawer"><header><div><span className="product-eyebrow">{item.flag} {item.countryName}</span><h2>{item.name}</h2><p>{item.city} · {item.publicPrivate} {item.type.replaceAll("_", " ")}</p></div><button onClick={onClose}><X size={19} /></button></header><div className="drawer-trust"><ShieldCheck size={17} /><span><strong>{item.sponsorStatus}</strong><small>{verified(item.lastVerifiedAt)} · next review {date.format(new Date(item.nextReviewAt))}</small></span></div><section><span className="product-eyebrow">Ranking evidence</span>{item.rankings.length ? item.rankings.map((ranking) => <div className="drawer-row" key={ranking.id}><span><strong>{ranking.publisher} {ranking.rankLabel}</strong><small>{ranking.name} · {ranking.year}{ranking.subject ? ` · ${ranking.subject}` : ""}</small></span>{ranking.source && <a href={ranking.source.url} target="_blank" rel="noreferrer">Source <ExternalLink size={13} /></a>}</div>) : <p className="drawer-open-check">No ranking record is published. This does not reduce academic eligibility.</p>}</section><section><span className="product-eyebrow">{origin} qualification mapping</span>{equivalency ? <div className="equivalence-card"><span><Check size={16} /></span><div><strong>{equivalency.minimumResult}</strong><p>{equivalency.qualification}</p><small>{equivalency.notes}</small></div></div> : <p className="drawer-open-check">No verified country threshold is loaded. Keep this as an explicit admissions check.</p>}</section><section><span className="product-eyebrow">Institution requirements</span>{item.requirements.length ? item.requirements.map((requirement) => <div className="drawer-row" key={requirement.id}><span><strong>{requirement.label}</strong><small>{requirement.description}</small></span><em>{requirement.required ? "Required" : "Conditional"}</em></div>) : <p className="drawer-open-check">Programme-level document requirements remain an open check.</p>}</section><footer><a href={item.websiteUrl} target="_blank" rel="noreferrer">Official website <ExternalLink size={14} /></a>{item.admissionsUrl && <a className="primary" href={item.admissionsUrl} target="_blank" rel="noreferrer">Admissions <ArrowRight size={14} /></a>}</footer></aside></div>;
}

