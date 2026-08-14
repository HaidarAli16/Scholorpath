import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { AssessmentInput, AssessmentReport } from "../../modules/assessment/types";

const PAGE = { width: 595.28, height: 841.89, margin: 48 };
const ink = rgb(0.055, 0.094, 0.16);
const muted = rgb(0.32, 0.38, 0.47);
const blue = rgb(0.08, 0.34, 0.94);
const blueSoft = rgb(0.93, 0.96, 1);
const line = rgb(0.88, 0.9, 0.93);
const green = rgb(0.02, 0.48, 0.3);
const amber = rgb(0.71, 0.32, 0.03);

function clean(value: unknown) {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-").replace(/\u2026/g, "...")
    .replace(/\u2192/g, "->").replace(/£/g, "GBP ").replace(/€/g, "EUR ")
    .replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const words = clean(text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width) current = next;
    else { if (current) lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export async function buildPathwayReportPdf(profile: Partial<AssessmentInput>, report: AssessmentReport, options: { access?: "free" | "pro" } = {}) {
  const isFree = options.access !== "pro";
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page!: PDFPage;
  let y = 0;
  let pageNumber = 0;

  const newPage = (section?: string) => {
    page = pdf.addPage([PAGE.width, PAGE.height]);
    pageNumber += 1;
    page.drawRectangle({ x: 0, y: PAGE.height - 10, width: PAGE.width, height: 10, color: blue });
    page.drawText("CANDIDROUTE", { x: PAGE.margin, y: PAGE.height - 42, font: bold, size: 10, color: blue });
    if (section) page.drawText(clean(section).toUpperCase(), { x: PAGE.width - PAGE.margin - bold.widthOfTextAtSize(clean(section).toUpperCase(), 8), y: PAGE.height - 41, font: bold, size: 8, color: muted });
    page.drawText(`Generated ${new Date(report.generatedAt).toLocaleDateString("en-GB")}  |  Page ${pageNumber}`, { x: PAGE.margin, y: 24, font: regular, size: 8, color: muted });
    page.drawLine({ start: { x: PAGE.margin, y: 38 }, end: { x: PAGE.width - PAGE.margin, y: 38 }, thickness: 0.7, color: line });
    y = PAGE.height - 70;
  };
  const ensure = (space: number, section?: string) => { if (y - space < 72) newPage(section); };
  const text = (value: unknown, options: { size?: number; color?: ReturnType<typeof rgb>; bold?: boolean; width?: number; gap?: number } = {}) => {
    const size = options.size ?? 10;
    const font = options.bold ? bold : regular;
    const width = options.width ?? PAGE.width - PAGE.margin * 2;
    const lines = wrap(clean(value), font, size, width);
    ensure(lines.length * (size + 4) + 4);
    lines.forEach((lineText) => { page.drawText(lineText, { x: PAGE.margin, y, font, size, color: options.color ?? ink }); y -= size + 4; });
    y -= options.gap ?? 4;
  };
  const heading = (label: string, title: string) => {
    ensure(64, label);
    page.drawText(clean(label).toUpperCase(), { x: PAGE.margin, y, font: bold, size: 8, color: blue }); y -= 22;
    text(title, { size: 18, bold: true, gap: 12 });
  };
  const rule = () => { ensure(14); page.drawLine({ start: { x: PAGE.margin, y }, end: { x: PAGE.width - PAGE.margin, y }, thickness: 0.7, color: line }); y -= 14; };
  const bullet = (value: string, color = blue) => {
    ensure(34);
    page.drawCircle({ x: PAGE.margin + 3, y: y + 3, size: 3, color });
    const lines = wrap(value, regular, 9.5, PAGE.width - PAGE.margin * 2 - 18);
    lines.forEach((lineText, index) => page.drawText(lineText, { x: PAGE.margin + 15, y: y - index * 13, font: regular, size: 9.5, color: ink }));
    y -= lines.length * 13 + 5;
  };

  newPage("Pathway report");
  page.drawRectangle({ x: PAGE.margin, y: y - 184, width: PAGE.width - PAGE.margin * 2, height: 184, color: rgb(0.035, 0.14, 0.35) });
  page.drawText("YOUR PATHWAY INTELLIGENCE REPORT", { x: PAGE.margin + 24, y: y - 28, font: bold, size: 9, color: rgb(0.55, 0.7, 1) });
  const headlineLines = wrap(report.headline, bold, 23, 350);
  headlineLines.slice(0, 3).forEach((lineText, index) => page.drawText(lineText, { x: PAGE.margin + 24, y: y - 60 - index * 29, font: bold, size: 23, color: rgb(1, 1, 1) }));
  page.drawText(`${report.profileCompleteness}%`, { x: PAGE.width - PAGE.margin - 112, y: y - 83, font: bold, size: 31, color: rgb(1, 1, 1) });
  page.drawText("evidence profile", { x: PAGE.width - PAGE.margin - 112, y: y - 101, font: regular, size: 9, color: rgb(0.77, 0.84, 0.96) });
  page.drawText(`${clean(report.confidence)} confidence`, { x: PAGE.width - PAGE.margin - 112, y: y - 120, font: bold, size: 9, color: rgb(0.43, 0.93, 0.7) });
  y -= 208;
  text(`Prepared for ${profile.firstName || "Student"}. ${report.summary}`, { size: 10.5, color: muted, gap: 14 });

  heading("Executive snapshot", "What the system understands now");
  Object.entries(report.snapshot).forEach(([key, value]) => {
    ensure(34);
    page.drawText(clean(key).toUpperCase(), { x: PAGE.margin, y, font: bold, size: 7.5, color: blue });
    page.drawText(clean(value), { x: PAGE.margin + 86, y: y - 1, font: bold, size: 10, color: ink }); y -= 24;
  });
  rule();
  const priority = report.actionPlan.find((item) => !item.complete) ?? report.actionPlan[0];
  if (priority) {
    page.drawRectangle({ x: PAGE.margin, y: y - 66, width: PAGE.width - PAGE.margin * 2, height: 66, color: blueSoft });
    page.drawText("HIGHEST-IMPACT MOVE", { x: PAGE.margin + 16, y: y - 19, font: bold, size: 8, color: blue });
    page.drawText(clean(priority.title), { x: PAGE.margin + 16, y: y - 37, font: bold, size: 12, color: ink });
    wrap(priority.detail, regular, 8.5, PAGE.width - PAGE.margin * 2 - 32).slice(0, 2).forEach((lineText, index) => page.drawText(lineText, { x: PAGE.margin + 16, y: y - 53 - index * 11, font: regular, size: 8.5, color: muted })); y -= 82;
  }

  newPage("Readiness");
  heading("Decision profile", "Readiness by decision area");
  text("Preparation signals only. These scores do not predict admission, scholarship or visa outcomes.", { color: muted, gap: 12 });
  for (const dimension of report.readiness) {
    ensure(72, "Readiness");
    page.drawText(clean(dimension.label), { x: PAGE.margin, y, font: bold, size: 11, color: ink });
    page.drawText(`${dimension.score}/100`, { x: PAGE.width - PAGE.margin - 48, y, font: bold, size: 10, color: dimension.state === "blocked" ? amber : dimension.state === "ready" ? green : blue });
    page.drawRectangle({ x: PAGE.margin, y: y - 13, width: PAGE.width - PAGE.margin * 2, height: 6, color: line });
    page.drawRectangle({ x: PAGE.margin, y: y - 13, width: (PAGE.width - PAGE.margin * 2) * dimension.score / 100, height: 6, color: dimension.state === "blocked" ? amber : dimension.state === "ready" ? green : blue });
    y -= 29; text(dimension.summary, { size: 9.2, color: muted, gap: 1 });
    text(`Next: ${dimension.nextMove}`, { size: 8.8, bold: true, gap: 9 });
  }
  heading("Evidence gaps", "What prevents confirmation");
  report.evidenceGaps.slice(0, isFree ? 3 : undefined).forEach((gap) => bullet(gap, amber));

  newPage("Pathways");
  heading("Pathway comparison", "Research lanes with open conditions visible");
  text("The order reflects current fit and feasibility. It is not a league table or a guarantee.", { color: muted, gap: 12 });
  for (const [index, pathway] of report.pathways.slice(0, isFree ? 3 : undefined).entries()) {
    ensure(130, "Pathways");
    page.drawText(String(index + 1).padStart(2, "0"), { x: PAGE.margin, y, font: bold, size: 16, color: blue });
    page.drawText(clean(pathway.title), { x: PAGE.margin + 36, y: y + 1, font: bold, size: 13, color: ink }); y -= 19;
    page.drawText(`${clean(pathway.strength)} lane  |  ${clean(pathway.state)}`, { x: PAGE.margin + 36, y, font: bold, size: 8.5, color: pathway.state === "not_recommended" ? amber : green }); y -= 17;
    text(pathway.subtitle, { size: 9.2, color: muted, gap: 5 });
    pathway.why.slice(0, 2).forEach((item) => bullet(`Why: ${item}`, green));
    pathway.conditions.slice(0, 3).forEach((item) => bullet(`Open: ${item}`, amber));
    text(`Next move: ${pathway.nextAction}`, { size: 9.2, bold: true, gap: 10 });
    rule();
  }

  newPage("Action plan");
  heading("Execution plan", "What to do next and why it matters");
  report.actionPlan.slice(0, isFree ? 3 : undefined).forEach((action, index) => {
    const titleLines = wrap(action.title, bold, 11, PAGE.width - PAGE.margin * 2 - 38);
    const detailLines = wrap(action.detail, regular, 9, PAGE.width - PAGE.margin * 2 - 38);
    ensure(42 + titleLines.length * 14 + detailLines.length * 12, "Action plan");
    page.drawCircle({ x: PAGE.margin + 13, y: y - 2, size: 13, color: blueSoft });
    page.drawText(String(index + 1), { x: PAGE.margin + 9.5, y: y - 5, font: bold, size: 9, color: blue });
    page.drawText(`${clean(action.horizon).toUpperCase()}  |  ${clean(action.impact).toUpperCase()} IMPACT`, { x: PAGE.margin + 38, y: y + 3, font: bold, size: 7.5, color: blue }); y -= 15;
    titleLines.forEach((lineText) => { page.drawText(lineText, { x: PAGE.margin + 38, y, font: bold, size: 11, color: ink }); y -= 14; });
    detailLines.forEach((lineText) => { page.drawText(lineText, { x: PAGE.margin + 38, y, font: regular, size: 9, color: muted }); y -= 12; });
    y -= 13;
  });
  heading("Method and safeguards", "How this report was formed");
  ["Answers were validated and normalized.", "Hard eligibility rules ran before preference ranking.", "Funding, deadline and evidence feasibility shaped research priority.", "Unknown facts remained visible and became tasks.", ...report.assumptions].forEach((item) => bullet(item));

  const intelligence = report.intelligence;
  if (intelligence) {
    newPage("Audit summary");
    heading("Recommendation audit", "Source-aware and reproducible");
    text(`${intelligence.audit.evaluatedRules} rules evaluated: ${intelligence.audit.passedRules} passed, ${intelligence.audit.unknownRules} unresolved, ${intelligence.audit.failedRules} failed.`, { size: 10.5, gap: 14 });
    intelligence.audit.trace.forEach((item) => bullet(item));
    text("The opportunity list appears once in Pathway comparison. This page records only the rules and source snapshot behind that same list.", { size: 9, color: muted, gap: 12 });
    text(`Engine ${intelligence.engineVersion}. Evaluated ${new Date(intelligence.evaluatedAt).toLocaleString("en-GB")}.`, { size: 8.5, color: muted });
  }

  if (isFree) {
    newPage("Continue with CandidRoute Pro");
    heading("Your free report", "You have the clearest first three moves");
    text("Upgrade to unlock every eligible opportunity, all country and university intelligence, the complete evidence-gap analysis, application tracking, tasks, documents, deadlines and refreshed recommendations.", { size: 11, color: muted, gap: 16 });
    bullet("All eligible programmes and scholarships");
    bullet("Complete country and university intelligence");
    bullet("Full evidence plan, tracker and deadline workspace");
  }
  pdf.setTitle(`CandidRoute pathway report - ${profile.firstName || "Student"}`);
  pdf.setAuthor("CandidRoute");
  pdf.setSubject("Evidence-backed study pathway planning report");
  pdf.setKeywords(["CandidRoute", "study abroad", "scholarship", "pathway report"]);
  return pdf.save();
}
