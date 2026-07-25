import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireAdmin } from "../_lib/guard";
import { AdminShell } from "../_components/admin-shell";
import { BlogPostManager } from "../_components/blog-post-manager";
import { listAdminBlogPosts } from "@/lib/admin/blog-store";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const session = await requireAdmin("/admin/blog");
  const { data: posts, store, warning } = await listAdminBlogPosts();

  return (
    <AdminShell
      active="blog"
      eyebrow="Blog operations"
      title="Blog CMS"
      description="Write an article here and publish it to the Blog tab in the student navigation. Fields: title, author, read time, body, image, tags and resource links."
      adminEmail={session.email}
      actions={
        <Link href="/blog" target="_blank" className="admin-btn admin-btn-ghost">
          View public blog <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      }
    >
      <BlogPostManager initialPosts={posts} store={store} warning={warning} authorFallback={session.email} />
    </AdminShell>
  );
}
