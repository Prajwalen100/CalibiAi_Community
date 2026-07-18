"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// ── Helpers ──────────────────────────────────────────────────

async function getAuthUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

async function ensureXp(userId: string) {
  const supabase = await createServerSupabaseClient();
  await supabase.from("comm_xp").upsert(
    { user_id: userId, xp: 0, level: 1, contribution_level: "newcomer" },
    { onConflict: "user_id" }
  );
}

async function addXp(userId: string, amount: number) {
  const supabase = await createServerSupabaseClient();
  await ensureXp(userId);
  try {
    const { data } = await supabase.from("comm_xp").select("xp, level").eq("user_id", userId).single();
    if (data) {
      const newXp = data.xp + amount;
      const newLevel = Math.floor(newXp / 100) + 1;
      let cLevel = "newcomer";
      if (newXp >= 1000) cLevel = "legend";
      else if (newXp >= 500) cLevel = "expert";
      else if (newXp >= 100) cLevel = "contributor";
      await supabase.from("comm_xp").update({
        xp: newXp, level: newLevel, contribution_level: cLevel,
        last_active_date: new Date().toISOString().slice(0, 10),
      }).eq("user_id", userId);
    }
  } catch {
    // XP table might not exist yet
  }
}

async function createNotification(userId: string, actorId: string, type: string, postId?: string, commentId?: string) {
  const supabase = await createServerSupabaseClient();
  try {
    await supabase.from("comm_notifications").insert({
      user_id: userId, actor_id: actorId, type,
      post_id: postId || null, comment_id: commentId || null,
    });
  } catch {
    // Table might not exist yet
  }
}

// ── Posts ────────────────────────────────────────────────────

const CreatePostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(1, "Content is required"),
  post_type: z.enum(["discussion", "question", "showcase", "tutorial", "research", "career", "challenge", "team_finder", "resource", "event", "meme"]),
  community_id: z.string().optional(),
  link_url: z.string().url().or(z.literal("")).optional(),
  image_url: z.string().url().or(z.literal("")).optional(),
  tags: z.string().optional(),
  repo_url: z.string().url().or(z.literal("")).optional(),
  live_url: z.string().url().or(z.literal("")).optional(),
  demo_video_url: z.string().url().or(z.literal("")).optional(),
  tech_stack: z.string().optional(),
  event_date: z.string().optional(),
  event_type: z.enum(["workshop", "webinar", "meetup", "hackathon", "ama"]).optional(),
  event_location: z.string().optional(),
  resource_type: z.enum(["pdf", "cheatsheet", "prompt_library", "workflow", "template", "opensource"]).optional(),
  resource_url: z.string().url().or(z.literal("")).optional(),
  challenge_deadline: z.string().optional(),
});

export async function createPost(formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const raw = Object.fromEntries(formData);
  const parsed = CreatePostSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(", ") };

  const d = parsed.data;
  const supabase = await createServerSupabaseClient();

  const insertData: Record<string, unknown> = {
    user_id: user.id, title: d.title, content: d.content, post_type: d.post_type,
    community_id: d.community_id || null, link_url: d.link_url || null, image_url: d.image_url || null,
    tags: d.tags ? d.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    repo_url: d.repo_url || null, live_url: d.live_url || null, demo_video_url: d.demo_video_url || null,
    tech_stack: d.tech_stack ? d.tech_stack.split(",").map((t) => t.trim()).filter(Boolean) : [],
    event_date: d.event_date || null, event_type: d.event_type || null, event_location: d.event_location || null,
    resource_type: d.resource_type || null, resource_url: d.resource_url || null,
    challenge_deadline: d.challenge_deadline || null,
  };

  const { error } = await supabase.from("comm_posts").insert(insertData);
  if (error) {
    // `comm_posts` is created by 002_community.sql. Return a useful setup
    // message instead of making a missing-schema error look like a bad post.
    if (error.code === "42P01" || /comm_posts|relation .* does not exist/i.test(error.message)) {
      return {
        error: "Community database tables are not set up yet. Run supabase/migrations/002_community.sql in your Supabase project, then try again.",
      };
    }
    return { error: error.message };
  }

  await addXp(user.id, 10);
  revalidatePath("/community");
  return { success: true };
}

// ── Dedicated job postings ───────────────────────────────────

const CreateJobSchema = z.object({
  title: z.string().trim().min(3, "Job title must be at least 3 characters"),
  company_name: z.string().trim().min(2, "Company name is required"),
  company_website: z.string().url("Enter a valid company website URL").or(z.literal("")),
  description: z.string().trim().min(20, "Job description must be at least 20 characters"),
  employment_type: z.enum(["internship", "full_time", "part_time", "contract", "freelance"]),
  workplace_type: z.enum(["remote", "hybrid", "on_site"]),
  location: z.string().trim().min(2, "Location is required (use Remote if applicable)"),
  skills_required: z.string().trim().min(1, "Add at least one required skill"),
  compensation: z.string().trim().min(2, "Compensation details are required"),
  experience_required: z.string().trim().min(1, "Experience requirement is required"),
  contact_email: z.string().trim().email("Enter a valid contact email address"),
  application_url: z.string().url("Enter a valid application URL").or(z.literal("")),
  application_deadline: z.string().optional(),
});

export async function createJobPosting(formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = CreateJobSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues.map((issue) => issue.message).join(", ") };
  }

  const job = parsed.data;
  const skills = job.skills_required.split(",").map((skill) => skill.trim()).filter(Boolean);
  if (skills.length === 0) return { error: "Add at least one required skill" };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("comm_jobs")
    .insert({
      user_id: user.id,
      title: job.title,
      company_name: job.company_name,
      company_website: job.company_website || null,
      description: job.description,
      employment_type: job.employment_type,
      workplace_type: job.workplace_type,
      location: job.location,
      skills_required: skills,
      compensation: job.compensation,
      experience_required: job.experience_required,
      contact_email: job.contact_email,
      application_url: job.application_url || null,
      application_deadline: job.application_deadline || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "42P01" || /comm_jobs|relation .* does not exist/i.test(error.message)) {
      return {
        error: "Job postings are not set up yet. Run supabase/migrations/003_community_feed_and_jobs.sql in your Supabase project, then try again.",
      };
    }
    return { error: error.message };
  }

  await addXp(user.id, 10);
  revalidatePath("/community");
  revalidatePath("/community/jobs");
  return { success: true, id: data.id };
}

// ── Votes ────────────────────────────────────────────────────

export async function votePost(postId: string, voteType: 1 | -1) {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();

  try {
    const { data: existing } = await supabase
      .from("comm_post_votes")
      .select("id, vote_type")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .single();

    if (existing) {
      if (existing.vote_type === voteType) {
        await supabase.from("comm_post_votes").delete().eq("id", existing.id);
      } else {
        await supabase.from("comm_post_votes").update({ vote_type: voteType }).eq("id", existing.id);
      }
    } else {
      await supabase.from("comm_post_votes").insert({ user_id: user.id, post_id: postId, vote_type: voteType });
    }

    // Recount votes
    const { count: ups } = await supabase.from("comm_post_votes").select("*", { count: "exact", head: true }).eq("post_id", postId).eq("vote_type", 1);
    const { count: downs } = await supabase.from("comm_post_votes").select("*", { count: "exact", head: true }).eq("post_id", postId).eq("vote_type", -1);
    await supabase.from("comm_posts").update({ upvotes: ups ?? 0, downvotes: downs ?? 0 }).eq("id", postId);

    // Notify post author of upvote
    if (voteType === 1 && !existing) {
      const { data: post } = await supabase.from("comm_posts").select("user_id").eq("id", postId).single();
      if (post && post.user_id !== user.id) {
        await createNotification(post.user_id, user.id, "upvote", postId);
      }
    }
  } catch {
    // Table might not exist
  }

  revalidatePath("/community");
  revalidatePath(`/community/post/${postId}`);
  return { success: true };
}

// ── Save ─────────────────────────────────────────────────────

export async function savePost(postId: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  try {
    const { data: existing } = await supabase
      .from("comm_post_saves")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .single();

    if (existing) {
      await supabase.from("comm_post_saves").delete().eq("id", existing.id);
    } else {
      await supabase.from("comm_post_saves").insert({ user_id: user.id, post_id: postId });
    }
  } catch {
    // Table might not exist
  }

  return { success: true };
}

// ── Comments ─────────────────────────────────────────────────

export async function createComment(postId: string, content: string, parentId?: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };
  if (!content.trim()) return { error: "Comment cannot be empty" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("comm_comments").insert({
    user_id: user.id, post_id: postId, parent_id: parentId || null, content: content.trim(),
  });

  if (error) return { error: error.message };

  await addXp(user.id, 3);

  // Notify post author
  try {
    const { data: post } = await supabase.from("comm_posts").select("user_id").eq("id", postId).single();
    if (post && post.user_id !== user.id) {
      await createNotification(post.user_id, user.id, "reply", postId);
    }
  } catch { /* ignore */ }

  revalidatePath(`/community/post/${postId}`);
  return { success: true };
}

export async function acceptAnswer(commentId: string, postId: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();

  try {
    const { data: post } = await supabase.from("comm_posts").select("user_id").eq("id", postId).single();
    if (!post || post.user_id !== user.id) return { error: "Not authorized" };

    await supabase.from("comm_comments").update({ is_best_answer: false }).eq("post_id", postId);
    await supabase.from("comm_comments").update({ is_best_answer: true }).eq("id", commentId);
    await supabase.from("comm_posts").update({ is_solved: true, accepted_answer_id: commentId }).eq("id", postId);

    const { data: comment } = await supabase.from("comm_comments").select("user_id").eq("id", commentId).single();
    if (comment) {
      await createNotification(comment.user_id, user.id, "answer_accepted", postId, commentId);
      await addXp(comment.user_id, 25);
    }
  } catch { /* ignore */ }

  revalidatePath(`/community/post/${postId}`);
  return { success: true };
}

// ── Follow ───────────────────────────────────────────────────

export async function followUser(followingId: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };
  if (user.id === followingId) return { error: "Cannot follow yourself" };

  const supabase = await createServerSupabaseClient();
  try {
    const { data: existing } = await supabase
      .from("comm_follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", followingId)
      .single();

    if (existing) {
      await supabase.from("comm_follows").delete().eq("id", existing.id);
    } else {
      await supabase.from("comm_follows").insert({ follower_id: user.id, following_id: followingId });
      await createNotification(followingId, user.id, "follow");
    }
  } catch { /* ignore */ }

  return { success: true };
}

// ── Community Join/Leave ─────────────────────────────────────

export async function joinCommunity(communityId: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  try {
    const { data: existing } = await supabase
      .from("comm_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("community_id", communityId)
      .single();

    if (existing) {
      await supabase.from("comm_members").delete().eq("id", existing.id);
    } else {
      await supabase.from("comm_members").insert({ user_id: user.id, community_id: communityId, role: "member" });
      await addXp(user.id, 5);
    }
  } catch { /* ignore */ }

  revalidatePath("/community");
  revalidatePath(`/community/community/${communityId}`);
  return { success: true };
}

// ── Event RSVP ───────────────────────────────────────────────

export async function rsvpEvent(postId: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createServerSupabaseClient();
  try {
    const { data: existing } = await supabase
      .from("comm_event_rsvps")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .single();

    if (existing) {
      await supabase.from("comm_event_rsvps").delete().eq("id", existing.id);
    } else {
      await supabase.from("comm_event_rsvps").insert({ user_id: user.id, post_id: postId });
      await addXp(user.id, 2);
    }
  } catch { /* ignore */ }

  revalidatePath("/community/events");
  revalidatePath(`/community/post/${postId}`);
  return { success: true };
}

// ── Challenge Submission ─────────────────────────────────────

const ChallengeEntrySchema = z.object({
  post_id: z.string(),
  title: z.string().min(3),
  description: z.string().min(10),
  repo_url: z.string().url().or(z.literal("")),
  live_url: z.string().url().or(z.literal("")),
});

export async function submitChallengeEntry(formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const raw = Object.fromEntries(formData);
  const parsed = ChallengeEntrySchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(", ") };

  const d = parsed.data;
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("comm_challenge_entries").insert({
    user_id: user.id, post_id: d.post_id, title: d.title,
    description: d.description, repo_url: d.repo_url || null, live_url: d.live_url || null,
  });

  if (error) return { error: error.message };

  await addXp(user.id, 15);
  revalidatePath(`/community/post/${d.post_id}`);
  revalidatePath("/community/challenges");
  return { success: true };
}

// ── Notifications ────────────────────────────────────────────

export async function markNotificationsRead() {
  const user = await getAuthUser();
  if (!user) return;

  const supabase = await createServerSupabaseClient();
  try {
    await supabase.from("comm_notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  } catch { /* ignore */ }
  revalidatePath("/community/notifications");
}
