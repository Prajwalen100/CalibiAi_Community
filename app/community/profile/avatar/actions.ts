"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const AvatarSchema = z.object({
  avatar_id: z.coerce
    .number()
    .int()
    .min(1)
    .max(12)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  avatar_url: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export async function saveProfileAvatar(formData: FormData) {
  const parsed = AvatarSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid avatar selection." };
  if (!parsed.data.avatar_id && !parsed.data.avatar_url) {
    return { error: "Choose a preset avatar or generate one." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_id: parsed.data.avatar_id ?? null,
      avatar_url: parsed.data.avatar_url ?? null,
    })
    .eq("user_id", user.id);

  if (error) {
    if (/avatar_(id|url)|profiles/.test(error.message) && /does not exist/i.test(error.message)) {
      return { error: "The avatar column has not been added yet. Apply migration 019_avatar_url.sql." };
    }
    return { error: error.message };
  }

  // Look up the username so the public profile pages (which are keyed by
  // username, not user id) also refresh immediately instead of showing the
  // previous avatar until their next unrelated revalidation.
  const { data: usernameRow } = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", user.id)
    .maybeSingle();
  const username = (usernameRow as { username?: string | null } | null)?.username;

  revalidatePath("/community");
  revalidatePath("/community/profile/avatar");
  revalidatePath("/dashboard");
  if (username) {
    revalidatePath(`/p/${username}`);
    revalidatePath(`/community/members/${username}`);
  }
  revalidatePath(`/p/${user.id}`);
  revalidatePath(`/community/members/${user.id}`);
  return { success: true, avatar_url: parsed.data.avatar_url ?? null, avatar_id: parsed.data.avatar_id ?? null };
}
