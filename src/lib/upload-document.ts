"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export async function uploadStudentDocument(file: File, category: string) {
  const request = await fetch("/api/documents/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: file.name, category, mimeType: file.type, sizeBytes: file.size }),
  });
  const signed = await request.json();
  if (!request.ok) throw new Error(signed.error || "Upload could not be prepared.");
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.storage.from("student-documents").uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
  if (error) throw error;
  const completed = await fetch("/api/documents/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path: signed.path, name: file.name, category, mimeType: file.type, sizeBytes: file.size }),
  });
  const result = await completed.json();
  if (!completed.ok) throw new Error(result.error || "Document record could not be saved.");
  return result.document;
}

