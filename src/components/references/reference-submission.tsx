"use client";

import { useEffect, useState } from "react";
import { Check, FileText, GraduationCap, LoaderCircle, Lock, Upload } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ReferenceSubmission({ token }: { token: string }) {
  const [state, setState] = useState<"loading" | "ready" | "uploading" | "done" | "error">("loading");
  const [context, setContext] = useState<{ name?: string; application?: { title?: string; provider_name?: string } | null }>({});
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/references/${token}`).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setContext(result.recommender);
      setState(result.accepted ? "done" : "ready");
    }).catch((reason) => { setError(reason.message); setState("error"); });
  }, [token]);

  async function submit() {
    if (!file) return;
    setState("uploading"); setError("");
    try {
      const preparedResponse = await fetch(`/api/references/${token}/upload-url`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: file.name, mimeType: file.type, sizeBytes: file.size }) });
      const prepared = await preparedResponse.json();
      if (!preparedResponse.ok) throw new Error(prepared.error);
      const supabase = createSupabaseBrowserClient();
      if (!supabase) throw new Error("Secure storage is not configured.");
      const { error: uploadError } = await supabase.storage.from("confidential-references").uploadToSignedUrl(prepared.path, prepared.token, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const completeResponse = await fetch(`/api/references/${token}/complete`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: prepared.path }) });
      const completed = await completeResponse.json();
      if (!completeResponse.ok) throw new Error(completed.error);
      setState("done");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Submission failed.");
      setState("error");
    }
  }

  return <main className="reference-shell"><header><span><GraduationCap size={18} /></span><strong>CandidRoute</strong><em><Lock size={13} /> Confidential submission</em></header><section className="reference-submit-card">{state === "loading" && <div className="reference-center"><LoaderCircle className="spin" size={28} /><h1>Checking invitation…</h1></div>}{state === "done" && <div className="reference-center"><span className="reference-success"><Check size={28} /></span><h1>Reference submitted</h1><p>Thank you. The student can see that the requirement is complete, but cannot view this confidential file.</p></div>}{state === "error" && <div className="reference-center"><span className="reference-error"><Lock size={26} /></span><h1>Submission unavailable</h1><p>{error || "This invitation may be invalid or expired."}</p></div>}{(state === "ready" || state === "uploading") && <><span className="product-eyebrow">Recommendation request</span><h1>Upload a confidential reference</h1><p>You are submitting for <strong>{context.application?.title || "an application"}</strong>{context.application?.provider_name ? ` at ${context.application.provider_name}` : ""}. The student will see delivery status only.</p><label className={`reference-file ${file ? "has-file" : ""}`}><FileText size={24} /><strong>{file?.name || "Choose the signed reference PDF"}</strong><small>{file ? `${Math.round(file.size / 1024)} KB` : "PDF only · maximum 15 MB"}</small><input type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>{error && <div className="auth-message auth-message--error">{error}</div>}<button className="product-button product-button--primary" onClick={() => void submit()} disabled={!file || state === "uploading"}>{state === "uploading" ? <><LoaderCircle className="spin" size={16} /> Uploading securely</> : <><Upload size={16} /> Submit confidential reference</>}</button><div className="reference-boundary"><Lock size={15} /><span><strong>Privacy boundary</strong><small>The student cannot download or preview the submitted file. Access is limited to the application review workflow.</small></span></div></>}</section></main>;
}

