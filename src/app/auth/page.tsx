import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function AuthenticationPage() {
  return <Suspense><AuthPage /></Suspense>;
}
