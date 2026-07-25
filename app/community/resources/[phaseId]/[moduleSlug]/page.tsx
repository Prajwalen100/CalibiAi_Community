import { permanentRedirect } from "next/navigation";

export default async function LegacyResourceModulePage({
  params,
}: {
  params: Promise<{ phaseId: string; moduleSlug: string }>;
}) {
  const { phaseId, moduleSlug } = await params;
  permanentRedirect(
    `/learning-hub/${encodeURIComponent(phaseId)}/${encodeURIComponent(moduleSlug)}`
  );
}
