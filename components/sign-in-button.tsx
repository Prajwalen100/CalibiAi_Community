import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Header auth entry point — single solid "Get Started" CTA for first-time visitors.
 */
export function SignInButton() {
  return (
    <Link
      href="/signin?mode=sign-up"
      className="btn-cta-solid text-sm !py-2.5 !px-5"
    >
      Get Started
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
