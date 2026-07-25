import { permanentRedirect } from "next/navigation";

export default async function LegacyResourcePhasePage({
  params,
}: {
  params: Promise<{ phaseId: string }>;
}) {
  const { phaseId } = await params;
  permanentRedirect(`/learning-hub/${encodeURIComponent(phaseId)}`);
}
