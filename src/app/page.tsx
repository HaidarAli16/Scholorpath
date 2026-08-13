import type { Metadata } from "next";
import { AssessmentExperience } from "@/components/assessment/assessment-experience";

export const metadata: Metadata = {
  title: "Free international admissions pathway assessment",
  description: "Build a personalised, evidence-backed study-abroad pathway with scholarship, country, university and application-readiness guidance.",
};

export default function Home() {
  const structuredData = { "@context": "https://schema.org", "@type": "WebApplication", name: "CandidRoute", applicationCategory: "EducationalApplication", operatingSystem: "Web", description: "Evidence-backed international admissions pathway planning for students.", offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free basic pathway assessment" } };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /><AssessmentExperience /></>;
}
