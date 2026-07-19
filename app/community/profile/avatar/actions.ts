"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const AvatarSchema = z.object({
  avatar_id: z.coerce.number().int().min(1).max(12),
});

export async function saveProfileAvatar(formData: FormData) {
  const parsed = AvatarSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid avatar selection." };

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_id: parsed.data.avatar_id })
    .eq("user_id", user.id);

  if (error) {
    if (/avatar_id|profiles/.test(error.message) && /does not exist/i.test(error.message)) {
      return { error: "The avatar column has not been added yet. Apply migration 005_profile_avatars.sql." };
    }
    return { error: error.message };
  }

  revalidatePath("/community");
  revalidatePath("/community/profile/avatar");
  revalidatePath("/dashboard");
  return { success: true, avatar_id: parsed.data.avatar_id };
}
