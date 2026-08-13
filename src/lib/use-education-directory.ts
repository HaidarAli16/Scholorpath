"use client";

import { useCallback, useEffect, useState } from "react";
import type { CountryIntelligence, InstitutionDirectoryItem } from "@/modules/directory/types";
export type DirectoryBootstrap = { countries: CountryIntelligence[]; institutions: InstitutionDirectoryItem[]; mode: "live" | "unavailable"; warning?: string | null };

export function useEducationDirectory(initial?: DirectoryBootstrap) {
  const [countries, setCountries] = useState<CountryIntelligence[]>(initial?.countries ?? []);
  const [institutions, setInstitutions] = useState<InstitutionDirectoryItem[]>(initial?.institutions ?? []);
  const [mode, setMode] = useState<"loading" | "live" | "unavailable">(initial?.mode ?? "loading");
  const [warning, setWarning] = useState<string | null>(initial?.warning ?? null);

  const refresh = useCallback(async () => {
    try {
      const [countryResponse, institutionResponse] = await Promise.all([
        fetch("/api/countries", { cache: "no-store" }),
        fetch("/api/institutions", { cache: "no-store" }),
      ]);
      const [countryPayload, institutionPayload] = await Promise.all([countryResponse.json(), institutionResponse.json()]);
      if (!countryResponse.ok || !institutionResponse.ok) throw new Error(countryPayload.error || institutionPayload.error || "Education directory could not be loaded.");
      setCountries(countryPayload.countries ?? []);
      setInstitutions(institutionPayload.institutions ?? []);
      setMode("live");
      setWarning(countryPayload.warning || institutionPayload.warning || null);
    } catch (cause) {
      setCountries([]);
      setInstitutions([]);
      setMode("unavailable");
      setWarning(cause instanceof Error ? cause.message : "Live education data is unavailable.");
    }
  }, []);

  useEffect(() => { if (!initial) void refresh(); }, [initial, refresh]);
  return { countries, institutions, mode, warning, refresh };
}

