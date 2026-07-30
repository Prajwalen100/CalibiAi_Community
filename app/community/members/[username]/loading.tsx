export default function MemberProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading member profile">
      <div className="rounded-2xl bg-slate-900 p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-white/15" />
          <div className="space-y-3">
            <div className="h-7 w-48 rounded bg-white/15" />
            <div className="h-4 w-32 rounded bg-white/10" />
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((item) => <div key={item} className="h-24 rounded-2xl bg-slate-200/70 dark:bg-slate-800" />)}
      </div>
      <div className="mt-6 h-52 rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
    </div>
  );
}
