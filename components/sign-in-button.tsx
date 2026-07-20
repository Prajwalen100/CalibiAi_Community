import Link from "next/link";

/**
 * Header sign-in entry point. Sends the user to the branded sign-in / sign-up
 * page where they can pick Google, GitHub, or email + password.
 */
export function SignInButton() {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/signin?mode=sign-in"
        className="text-sm font-semibold text-secondary hover:text-primary dark:hover:text-primary transition-colors"
      >
        Sign in
      </Link>
      <Link href="/signin?mode=sign-up" className="btn-primary py-2.5">
        Get started
      </Link>
    </div>
  );
}