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

  revalidatePath("/community");
  revalidatePath("/community/profile/avatar");
  revalidatePath("/dashboard");
  return { success: true, avatar_url: parsed.data.avatar_url ?? null, avatar_id: parsed.data.avatar_id ?? null };
}
