"use client";

import { useCallback, useEffect, useState } from "react";
import { fallbackCountries, fallbackInstitutions } from "@/modules/directory/fallback-data";
import type { CountryIntelligence, InstitutionDirectoryItem } from "@/modules/directory/types";

export function useEducationDirectory() {
  const [countries, setCountries] = useState<CountryIntelligence[]>(fallbackCountries);
  const [institutions, setInstitutions] = useState<InstitutionDirectoryItem[]>(fallbackInstitutions);
  const [mode, setMode] = useState<"loading" | "live" | "curated-fallback">("loading");
  const [warning, setWarning] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [countryResponse, institutionResponse] = await Promise.all([
        fetch("/api/countries", { cache: "no-store" }),
        fetch("/api/institutions", { cache: "no-store" }),
      ]);
      const [countryPayload, institutionPayload] = await Promise.all([countryResponse.json(), institutionResponse.json()]);
      if (!countryResponse.ok || !institutionResponse.ok) throw new Error(countryPayload.error || institutionPayload.error || "Education directory could not be loaded.");
      setCountries(countryPayload.countries?.length ? countryPayload.countries : fallbackCountries);
      setInstitutions(institutionPayload.institutions?.length ? institutionPayload.institutions : fallbackInstitutions);
      setMode(countryPayload.mode === "live" && institutionPayload.mode === "live" ? "live" : "curated-fallback");
      setWarning(countryPayload.warning || institutionPayload.warning || null);
    } catch (cause) {
      setCountries(fallbackCountries);
      setInstitutions(fallbackInstitutions);
      setMode("curated-fallback");
      setWarning(cause instanceof Error ? cause.message : "Live education data is unavailable.");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { countries, institutions, mode, warning, refresh };
}

