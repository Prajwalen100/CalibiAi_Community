import Link from "next/link";

type Props = {
  posts: Array<Record<string, unknown>>;
  communities: Array<Record<string, unknown>>;
  members: Array<Record<string, unknown>>;
  query: string;
};

export function SearchResults({ posts, communities, members, query }: Props) {
  const totalResults = posts.length + communities.length + members.length;

  return (
    <div className="mt-6">
      <p className="text-sm text-slate-500">{totalResults} results for &ldquo;{query}&rdquo;</p>

      {/* Members */}
      {members.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold">👤 Members ({members.length})</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {members.map((m) => (
              <Link key={m.user_id as string} href={`/community/members/${m.username as string}`} className="card flex items-center gap-3 hover:border-brand-500">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                  {(m.full_name as string)?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="font-semibold">{m.full_name as string}</p>
                  <p className="text-xs text-slate-500">@{m.username as string} · {m.target_role as string}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Communities */}
      {communities.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold">🏘️ Communities ({communities.length})</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {communities.map((c) => (
              <Link key={c.id as string} href={`/community/community/${c.slug as string}`} className="card hover:border-brand-500">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{c.emoji as string}</span>
                  <div>
                    <p className="font-bold">{c.name as string}</p>
                    <p className="text-xs text-slate-500">{c.member_count as number} members</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold">📝 Posts ({posts.length})</h2>
          <div className="mt-3 space-y-3">
            {posts.map((p) => {
              const pp = p.profiles as Record<string, string> | null;
              return (
                <Link key={p.id as string} href={`/community/post/${p.id as string}`} className="block rounded-xl border border-slate-100 p-4 hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold capitalize">{(p.post_type as string).replace("_", " ")}</span>
                  </div>
                  <h3 className="mt-1 font-semibold">{p.title as string}</h3>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">{p.content as string}</p>
                  <div className="mt-2 text-xs text-slate-500">
                    by {pp?.full_name ?? "Anonymous"} · 👍 {p.upvotes as number} · 💬 {p.comment_count as number}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {totalResults === 0 && (
        <div className="mt-6 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-4 font-bold">No results found</p>
          <p className="mt-2 text-sm text-slate-600">Try different keywords or browse the community.</p>
        </div>
      )}
    </div>
  );
}
