import { Suspense } from "react";
import { AuthPage } from "@/components/auth/auth-page";

export default function AuthenticationPage() {
  return <Suspense><AuthPage /></Suspense>;
}

