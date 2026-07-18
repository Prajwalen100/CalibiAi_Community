import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-100 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm text-slate-600 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <p className="font-black text-ink">CalibiAI</p>
          <p className="mt-3 max-w-md">CalibiAI helps students become verified, hire-ready applied-AI engineers through real projects, hands-on assessments and trusted talent profiles.</p>
        </div>
        <div>
          <p className="font-semibold text-ink">Platform</p>
          <div className="mt-3 grid gap-2"><Link href="/programs">Programs</Link><Link href="/success-stories">Success stories</Link><Link href="/blog">Blog</Link></div>
        </div>
        <div>
          <p className="font-semibold text-ink">Partners</p>
          <div className="mt-3 grid gap-2"><Link href="/for-colleges">For colleges</Link><Link href="/for-startups">For startups</Link><Link href="/about">Company</Link></div>
        </div>
      </div>
    </footer>
  );
}
