import { permanentRedirect } from "next/navigation";

/** Academy content now lives in the top-level Learning Hub. */
export default function AcademyRedirectPage() {
  permanentRedirect("/learning-hub");
}
