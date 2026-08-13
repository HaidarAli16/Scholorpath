import type { Metadata, Viewport } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import "@/components/tasks/task-command-center.css";
import "@/components/product/frontend-completion.css";

const urbanist = Urbanist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-urbanist",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://candidroute.vercel.app"),
  title: { default: "CandidRoute — Build your admission pathway", template: "%s | CandidRoute" },
  description: "A transparent scholarship and international admissions execution platform for South Asian students.",
  applicationName: "CandidRoute",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "CandidRoute",
    title: "CandidRoute — Build your admission pathway",
    description: "Get an evidence-backed international admissions pathway, opportunity matches and a practical action plan.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "CandidRoute — Build your admission pathway",
    description: "Evidence-backed international admissions guidance for South Asian students.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f9fafb",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={urbanist.variable}><body>{children}</body></html>;
}
