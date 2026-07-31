import { ReferenceSubmission } from "@/components/references/reference-submission";

export default async function ReferencePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ReferenceSubmission token={token} />;
}

